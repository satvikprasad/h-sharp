const std = @import("std");
const dq = @import("../deque.zig");
const debug = @import("../debug.zig");

pub const Math = @import("math.zig");

const InputType = enum {
    audio,
    midi,
};

const WaveformData = struct {
    buffer: []f32,

    maximums: dq.Deque(f32),
    rolling_maximums: dq.Deque(f32),

    time_weighted_max: f32,
    num_maximums: usize,
};

pub const AudioData = struct {
    pub const Self = @This();
    const raw_buffer_fidelity: usize = 512;

    inputs: []Input,
    input_length: usize = 0,

    fn updateMaximums(waveform: *WaveformData) !void {
        const curr_max = std.sort
            .max(f32, waveform.buffer, {}, std.sort.asc(f32)).?;

        waveform.maximums.pushBack(curr_max);
        waveform.rolling_maximums.pushBack(curr_max);

        if (waveform.maximums.length > waveform.num_maximums) {
            _ = waveform.maximums.popFront();

            const popped = waveform.rolling_maximums.popFront();

            if (popped == null) {
                debug.print("ERROR: Contradiction while updating maximums.");
            }

            waveform.time_weighted_max = popped.?;
        } else {
            const max_since_front = waveform.rolling_maximums
                .readFront();

            if (max_since_front != null) {
                waveform.time_weighted_max = max_since_front.?;
            }
        }

        const _it = struct  {
            fn iterator(
                node: *dq.Deque(f32).Node,
                user_data: *const anyopaque,
            ) bool {
                const max: f32 = @as(*f32, 
                    @ptrCast(@alignCast(@constCast(user_data)))).*;

                if  (max >= node.data) {
                    node.data = max;
                    return true;
                }

                return false;
            }
        };

        const max_ptr: *const anyopaque = &curr_max;

        waveform.rolling_maximums.iterateBackwards(
           _it.iterator, max_ptr
        );
    }

    fn updateInput(input: *Input) !void {
        switch (input.audio_type)  {
            .audio => {
                // Perform FFT on buffer
                try realFFT(
                    input.waveforms[0].buffer.ptr, 
                    input.waveforms[1].buffer.ptr, 
                    Self.raw_buffer_fidelity, 
                    input.log_scale_amplitude, 
                    input.log_scale_base
                );
            },
            .midi => {
                debug.print("MIDI Inputs are not yet supported");
            }
        }

        for (0..input.waveforms.len) |i| {
            try updateMaximums(&input.waveforms[i]);
        }
    }

    fn destroyInput(input: Input) void {
        for (0..input.waveforms.len) |i| {
            destroyWaveformData(&input.waveforms[i]);
        }
    }

    pub fn update(audio_data: *Self) !void {
        for (0..audio_data.input_length) |i| {
            try updateInput(&audio_data.inputs[i]);
        }
    }

    pub fn destroy(audio_data: *Self) !void {
        for (0..audio_data.input_length) |i| {
            destroyInput(&audio_data.inputs[i]);
        }

        std.heap.page_allocator.free(audio_data.inputs);
    }
};


pub const Input = struct {
    sample_rate: f32 = 48000,

    log_scale_base: f32,
    log_scale_amplitude: f32,

    waveforms: []WaveformData,

    audio_type: InputType,
};

fn computeLogScaleIndex(
    a: f32,
    k: f32,
    index: usize
) usize {
    const index_f32: f32 = @floatFromInt(index);

    const new_index: f32 = std.math.floor(a*std.math.exp(
            k * index_f32
    ) - a);

    return @intFromFloat(new_index);
}

// output.len = input.len/2
pub fn realFFT(
    input: [*]f32, 
    output: [*]f32,
    N: usize,
    lsa: f32,
    lsb: f32,
) !void {
    // Convert inputs to complex valued inputs.
    const cx_input: []std.math.Complex(f32) = try std.heap
        .page_allocator
        .alloc(
            std.math.Complex(f32), N
        );
    defer std.heap.page_allocator.free(cx_input);

    for (0..N) |i| {
        cx_input[i].re = input[i];
        cx_input[i].im = 0;
    }

    const cx_output: []std.math.Complex(f32) = try std.heap
        .page_allocator
        .alloc(
            std.math.Complex(f32), N
        );
    defer std.heap.page_allocator.free(cx_output);

    try Math.fft(cx_input.ptr, cx_output.ptr, N, 1);

    for (0..N/2) |i| {
        output[i] = std.math.pow(f32, 
            cx_output[computeLogScaleIndex(lsa, lsb, i)].magnitude(), 0.4);
    }
}

fn initWaveformData(N: usize, num_maximums: usize) ?WaveformData {
    const buffer: ?[]f32 = std.heap.page_allocator.alloc(f32, N) catch null;

    if (buffer == null) {
        debug.print(
            "ERROR: Failed to allocate WaveformData.buffer."
        );
        return null;
    }

    return .{
        .buffer = buffer.?,

        .maximums = dq.Deque(f32){},
        .rolling_maximums = dq.Deque(f32){},

        .time_weighted_max = 0,
        .num_maximums = num_maximums,
    };
}

fn destroyWaveformData(data: WaveformData) void {
    if (data.buffer) {
        std.heap.page_allocator.free(data.buffer.?);
    }

    data.maximums.destroy();
    data.rolling_maximums.destroy();
}

pub fn create(
    input_capacity: usize,
) ?*AudioData {
    const rawData = initWaveformData(
        AudioData.raw_buffer_fidelity, 4
    );

    const frequencyData = initWaveformData(
        @intCast(AudioData.raw_buffer_fidelity/2), 512
    );

    // TODO: Don't hardcode this length
    const waveforms: ?[]WaveformData = std.heap.page_allocator
        .alloc(WaveformData, 2) catch null;

    if (rawData == null or 
        frequencyData == null or 
        waveforms == null) {
        debug.print("Failed to setup waveform data for input.");
        return null;
    }

    waveforms.?[0] = rawData.?;
    waveforms.?[1] = frequencyData.?;

    // Initialise default system audio input
    const system_audio_input: Input = .{
        .sample_rate = 48000,
        .log_scale_base = 0.019,
        .log_scale_amplitude = computeLogScaleAmplitude(
            AudioData.raw_buffer_fidelity, 0.019),
        .audio_type = .audio,
        .waveforms = waveforms.?
    };

    // Construct inputs with capacity
    const default_inputs: ?[]Input = std.heap.page_allocator
        .alloc(Input, input_capacity) catch null;

    if (default_inputs == null) {
        debug.print("ERROR: Failed to allocate audio inputs with capacity.");

        return null;    
    }

    default_inputs.?[0] = system_audio_input;

    const ptr: ?*AudioData = std.heap.page_allocator
        .create(AudioData) catch null;

    if (ptr == null) {
        debug.print("ERROR: Failed to allocate AudioData");
    }

    ptr.?.inputs = default_inputs.?;
    ptr.?.input_length = 1;

    return ptr;
}

pub fn destroy(audio_data: *AudioData) void {
    audio_data.destroy();

    std.heap.page_allocator.destroy(audio_data);
}

pub fn computeLogScaleAmplitude(N: usize, k: f32) f32 {
    const N_f32: f32 = @floatFromInt(N);
    const phi = N_f32/2 - 1;

    return phi/(std.math.exp(k*phi) - 1);
}
