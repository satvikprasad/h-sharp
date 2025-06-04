const audio = @import("audio.zig");
const debug = @import("../debug.zig");

const std = @import("std");

pub fn initialise(input_capacity: usize) callconv(.c) usize {
    const audio_data: ?*audio.AudioData = audio.create(input_capacity);

    if (audio_data == null) {
        return std.math.maxInt(usize);
    }

    return @intFromPtr(audio_data.?);
}

pub fn update(audio_data: *audio.AudioData) callconv(.c) void {
    audio_data.update();
}

pub fn destroy(audio_data: *audio.AudioData) callconv(.c) void {
    audio.destroy(audio_data);
}

pub fn initialiseBuffersWrapper(N: usize) callconv(.c) usize {
    if (audio.initialiseBuffers(N)) |buf| {
        return @intFromPtr(buf.ptr);
    } else |err| switch (err) {
        std.mem.Allocator.Error.OutOfMemory => {
            debug.print("ERROR: Out of memory when initialising buffers.");
        }
    }

    return std.math.maxInt(usize);
}

pub fn realFFTWrapper(
    input: [*]f32,
    output: [*]f32,
    N: usize,
    lsa: f32,
    lsb: f32,
) callconv(.c) void {
    audio.realFFT(input, output, N, lsa, lsb) catch |err| {
        switch (err) {
            std.mem.Allocator.Error.OutOfMemory => {
                debug.print("ERROR: Ran out of memory while computing FFT.");
            },
            audio.FourierTransformError.InputNotPowerTwo => {
                debug.print("ERROR: Input array did not have length that was a power of two.");
            }
        }
    };
}

pub fn computeLogScaleAmplitudeWrapper(N: usize, k: f32) 
    callconv(.c) f32 {
        return audio.computeLogScaleAmplitude(N, k);
    }


