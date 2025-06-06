const audio = @import("audio.zig");
const debug = @import("../debug.zig");

const std = @import("std");

pub fn initialise(
    input_capacity: usize,
    has_system_audio: bool
) callconv(.c) usize {
    if (audio.AudioData
        .create(input_capacity, has_system_audio)) |audio_data| {
        return @intFromPtr(audio_data);
    } else |err| switch (err) {
        std.mem.Allocator.Error.OutOfMemory => {
            debug.print("ERROR: Could not initialise audio_data, ran out of memory.");
        }
    }
   
    return std.math.maxInt(usize);
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
    for (0..audio_data.input_length) |i| {
        const input = audio_data.inputs[i];

        if (input.audio_type == .system_audio) {
            return @intFromPtr(audio_data.inputs[i]
                .waveforms.?[0].buffer.ptr);
        }
    }

    return std.math.maxInt(usize);
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

pub fn getBufferFromInput(
    audio_data: *audio.AudioData,
    input_index: usize,
    waveform_index: usize
) callconv(.c) usize {
    if (input_index >= audio_data.input_length) {
        debug.print("input_index is out of range.");
        return std.math.maxInt(usize);
    }

    if (audio_data.inputs[input_index].audio_type == .uninitialised) {
        unreachable;
    }

    if (waveform_index >= audio_data.inputs[input_index]
        .waveforms.?.len) {
        debug.print("waveform_index is out of range.");
        return std.math.maxInt(usize);
    }

    return @intFromPtr(audio_data.inputs[input_index]
        .waveforms.?[waveform_index]
        .buffer.ptr);
}

pub fn getBufferLengthFromInput(
    audio_data: *audio.AudioData,
    input_index: usize,
    waveform_index: usize
) callconv(.c) usize {
    if (input_index >= audio_data.input_length) {
        debug.print("input_index is out of range.");
        return std.math.maxInt(usize);
    }

    if (audio_data.inputs[input_index].audio_type == .uninitialised) {
        unreachable;
    }

    if (waveform_index >= audio_data.inputs[input_index]
        .waveforms.?.len) {
        debug.print("waveform_index is out of range.");
        return std.math.maxInt(usize);
    }

    return audio_data.inputs[input_index]
        .waveforms.?[waveform_index]
        .buffer.len;
}

pub fn getMaximumFromInput(
    audio_data: *audio.AudioData,
    input_index: usize,
    waveform_index: usize
) callconv(.c) f32 {
    if (input_index >= audio_data.input_length) {
        debug.print("input_index is out of range.");
        return std.math.maxInt(usize);
    }

    if (audio_data.inputs[input_index].audio_type == .uninitialised) {
        unreachable;
    }

    if (waveform_index >= audio_data.inputs[input_index]
        .waveforms.?.len) {
        debug.print("waveform_index is out of range.");
        return std.math.maxInt(usize);
    }

    return audio_data.inputs[input_index]
        .waveforms.?[waveform_index]
        .time_weighted_max;
}
