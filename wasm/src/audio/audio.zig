const std = @import("std");
const dq = @import("../deque.zig");
const debug = @import("../debug.zig");

pub const Math = @import("math.zig");

const InputType = enum {
    uninitialised,
    system_audio,
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

pub const Input = struct {
    name: []const u8 = "Unnamed Input",

    sample_rate: f32 = 48000,
    lsb: f32,
    lsa: f32,

    waveforms: ?[]WaveformData,

    audio_type: InputType,

    pub fn create(
        sample_rate: f32,
        raw_buffer_fidelity: usize,
        lsb: f32,
        input_type: InputType
    ) !Input {
        const raw_data = try initWaveformData(raw_buffer_fidelity, 4);
        const frequency_data = try initWaveformData(@intCast(raw_buffer_fidelity/2), 512);

        const waveforms: []WaveformData = try std.heap.page_allocator.alloc(WaveformData, 2);

        waveforms[0] = raw_data;
        waveforms[1] = frequency_data;

        return .{
            .sample_rate = sample_rate,
            .lsb = lsb,
            .lsa = computeLogScaleAmplitude(
                raw_buffer_fidelity, lsb),
            .audio_type = input_type,
            .waveforms = waveforms
        };
    }
};

pub const AudioData = struct {
    pub const Self = @This();
    const raw_buffer_fidelity: usize = 512;

    inputs: []Input,
    input_length: usize = 0,

    pub fn create(input_capacity: usize, has_system_audio: bool) !*AudioData {
        const default_inputs: []Input = try std.heap.page_allocator
            .alloc(Input, input_capacity);
        @memset(default_inputs, Input{
            .name = "System Audio",
            .audio_type = .uninitialised,
            .waveforms = null,
            .lsb = 0.019,
            .lsa = computeLogScaleAmplitude(AudioData.raw_buffer_fidelity, 0.019),
            .sample_rate = 48000,
        });

        if (has_system_audio) {
            const system_input = try Input.create(48000, AudioData.raw_buffer_fidelity, 0.019, .system_audio);

            default_inputs[0] = system_input;
        }

        const ptr: *AudioData = try std.heap.page_allocator
            .create(AudioData);

        ptr.inputs = default_inputs;
        ptr.input_length = @intFromBool(has_system_audio);

        return ptr;
    }

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
            .uninitialised => {
                debug.print("Warning: iterated over uninitialised input.");
            },
            .system_audio => {
                try realFFT(
                    input.waveforms.?[0].buffer.ptr, 
                    input.waveforms.?[1].buffer.ptr, 
                    Self.raw_buffer_fidelity, 
                    input.lsa, 
                    input.lsb
                );
            },
            .audio => {
                // Perform FFT on buffer
                try realFFT(
                    input.waveforms.?[0].buffer.ptr, 
                    input.waveforms.?[1].buffer.ptr, 
                    Self.raw_buffer_fidelity, 
                    input.lsa, 
                    input.lsb
                );
            },
            .midi => {
                debug.print("MIDI Inputs are not yet supported");
            },
        }

        for (0..input.waveforms.?.len) |i| {
            try updateMaximums(&input.waveforms.?[i]);
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

fn initWaveformData(N: usize, num_maximums: usize) !WaveformData {
    const buffer: []f32 = try std.heap.page_allocator.alloc(f32, N);
    @memset(buffer, 0);

    return .{
        .buffer = buffer,

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


pub fn destroy(audio_data: *AudioData) void {
    audio_data.destroy();

    std.heap.page_allocator.destroy(audio_data);
}

pub fn computeLogScaleAmplitude(N: usize, k: f32) f32 {
    const N_f32: f32 = @floatFromInt(N);
    const phi = N_f32/2 - 1;

    return phi/(std.math.exp(k*phi) - 1);
}
