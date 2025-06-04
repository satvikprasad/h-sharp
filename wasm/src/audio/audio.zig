const std = @import("std");
const dq = @import("../deque.zig");
const debug = @import("../debug.zig");

pub const FourierTransformError = error{
    OutOfMemory,
    InputNotPowerTwo,
};

fn fft( 
    input: [*]std.math.Complex(f32),
    output: [*]std.math.Complex(f32),
    N: usize,
    stride: usize
) !void {
    if (N == 1) {
        output[0] = input[0];
        return;
    }

    if (N/2 % 1 != 0) {
        return FourierTransformError.InputNotPowerTwo;
    }

    const even = output;
    const odd = output + N/2;

    try fft(input, even, N/2, 2*stride);
    try fft(input + stride, odd, N/2, 2*stride);

    for (0..N/2) |i| {
        const theta: f32 = -2 * std.math.pi * 
            @as(f32, @floatFromInt(i))/@as(f32, @floatFromInt(N));

        const p: std.math.Complex(f32) = even[i];
        const q: std.math.Complex(f32) = 
            odd[i].mul(std.math.complex.exp(
                    std.math.complex.Complex(f32){
                        .im = theta,
                        .re = 0
                    }
            ));

        output[i] = p.add(q);
        output[i + N/2] = p.sub(q);
    }
}

fn initialiseBuffers(
    N: usize
) ![]f32 {
    const buffers: []f32 = try std.heap.page_allocator
        .alloc(f32, 2*N);

    @memset(buffers, 0);

    return buffers;
}


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

fn realFFT(
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

    try fft(cx_input.ptr, cx_output.ptr, N, 1);

    for (0..N/2) |i| {
        output[i] = std.math.pow(f32, 
            cx_output[computeLogScaleIndex(lsa, lsb, i)].magnitude(), 0.4);
    }
}

const InputType = enum {
    audio,
    midi,
};

const WaveformData = struct {
    buffer: []f32,

    maximums: dq.Deque(f32),
    rolling_maximums: dq.Deque(f32),

    time_weighted_max: dq.Deque(f32),
    num_maximums: f32,
};

const Input = struct {
    sample_rate: f32 = 48000,

    log_scale_base: f32,
    log_scale_amplitude: f32,

    raw: WaveformData,
    frequency_spectrum: WaveformData,

    audio_type: InputType,
};

fn initWaveformData(N: usize, num_maximums: usize) !WaveformData {
    // TODO: Ensure this is freed
    const buffer: []f32 = try std.heap.page_allocator.alloc(f32, N);

    return .{
        .buffer = buffer,
        .maximums = dq.Deque(f32),
        .rolling_maximums = dq.Deque(f32),
        .time_weighted_max = 0,
        .num_maximums = num_maximums,
    };
}

fn AudioData(
    input_capacity: usize
) !type {
    // Initialise default system audio input
    const system_audio_input: Input = .{
        .sample_rate = 48000,
        .log_scale_base = 0.019,
        .log_scale_amplitude = computeLogScaleAmplitude(512, 0.019),
        .audio_type = .audio,
        .raw = initWaveformData(512, 4),
        .frequency_spectrum = initWaveformData(512, 512),
    };

    // Construct inputs with capacity
    // TODO: Ensure this is freed
    const default_inputs: []Input = try std.heap.page_allocator
        .alloc(Input, input_capacity);
    default_inputs[0] = system_audio_input;

    return struct {
        const inputs: []Input = default_inputs;

        fn updateMaximums(waveform: WaveformData) !void {
            const curr_max = std.sort
                .max(f32, waveform.buffer, {}, std.sort.asc(f32)).?;

            waveform.maximums.pushBack(curr_max);
            waveform.rolling_maximums.pushBack(curr_max);

            if (waveform.maximums.length > waveform.num_maximums) {
                waveform.maximums.popFront();
                
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

            const _fn = struct {
                fn updateMaximumsIterator(
                    node: *dq.Deque(f32).Node
                ) bool {
                    if (curr_max >= node.data) {
                        node.data = curr_max;

                        return true;
                    }

                    return false;
                }
            };

            waveform.rolling_maximums.iterateBackwards(
                _fn.updateMaximumsIterator
            );
        }

        fn updateInput(input: Input) !void {
            switch (input.audio_type)  {
                .audio => {
                    // Perform FFT on buffer
                    realFFT(
                        input.raw.buffer.ptr, 
                        input.frequency_spectrum.buffer.ptr, 
                        512, 
                        input.log_scale_amplitude, 
                        input.log_scale_base
                    );
                
                    // Update maximums for frequency spectrum
                    try updateMaximums(input.frequency_spectrum);
                },
            }

            // Update maximums for raw data
            updateMaximums(input.raw);
        }

        pub fn update() !void {
            for (inputs) |input| {
                try updateInput(input);
            }
        }
    };
}

pub fn initialiseBuffersWrapper(N: usize) !usize {
    const buf: ?[]f32 = initialiseBuffers(N) catch null;

    return @intFromPtr(buf.?.ptr);
}

pub fn realFFTWrapper(
    input: [*]f32,
    output: [*]f32,
    N: usize,
    lsa: f32,
    lsb: f32,
) callconv(.c) void {
    realFFT(input, output, N, lsa, lsb) catch |err| {
        switch (err) {
            std.mem.Allocator.Error.OutOfMemory => {
                debug.print("ERROR: Ran out of memory while computing FFT.");
            },
            FourierTransformError.InputNotPowerTwo => {
                debug.print("ERROR: Input array did not have length that was a power of two.");
            }
        }
    };
}

pub fn computeLogScaleAmplitude(N: usize, k: f32) 
    callconv(.c) f32 {
        const N_f32: f32 = @floatFromInt(N);
        const phi = N_f32/2 - 1;

        return phi/(std.math.exp(k*phi) - 1);
    }
