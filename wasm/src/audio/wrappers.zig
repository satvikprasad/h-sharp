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
    audio_data.update() catch |err| {
        switch (err) {
            std.mem.Allocator.Error.OutOfMemory => {
            },
            audio.Math.FourierTransformError.InputNotPowerTwo => {
            },
        }
    };
}

pub fn destroy(audio_data: *audio.AudioData) callconv(.c) void {
    audio.destroy(audio_data);
}

pub fn getSystemBuffer(
    audio_data: *audio.AudioData
) callconv(.c) usize {
    return @intFromPtr(audio_data.inputs[0].raw.buffer.ptr);
}

fn getInput(
    audio_data: *audio.AudioData,
    index: usize,
) ?*audio.Input {
    if (index < audio_data.inputs.len) {
        return &audio_data.inputs[index];
    }

    debug.print("ERROR: Input requested is out of range.");
    return null;
}

pub fn getRawBufferFromInput(
    audio_data: *audio.AudioData,
    input_index: usize,
) callconv(.c) usize {
    const input = getInput(audio_data, input_index);

    return @intFromPtr(input.?.raw.buffer.ptr);
}


pub fn getRawMaximumFromInput(
    audio_data: *audio.AudioData,
    input_index: usize,
) callconv(.c) f32 {
    const input = getInput(audio_data, input_index);

    return @intFromPtr(input.?.raw.time_weighted_max);
}

pub fn getFrequencyBufferFromInput(
    audio_data: *audio.AudioData,
    input_index: usize,
) callconv(.c) usize {
    const input = getInput(audio_data, input_index);

    return @intFromPtr(input.?.frequency_spectrum.buffer.ptr);
}


pub fn getFrequencyMaximumFromInput(
    audio_data: *audio.AudioData,
    input_index: usize,
) callconv(.c) f32 {
    const input = getInput(audio_data, input_index);

    return @intFromPtr(input.?.frequency_spectrum.time_weighted_max);
}
