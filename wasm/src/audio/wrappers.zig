const audio = @import("audio.zig");
const debug = @import("../debug.zig");

const std = @import("std");

pub fn getWaveformBuffer(
    waveform_data: *audio.WaveformData
) callconv(.c) usize {
    return @intFromPtr(waveform_data.buffer.ptr);
}

pub fn createWaveform(
    buffer_length: usize,
    num_maximums: usize
) callconv(.c) usize {
    if(audio.WaveformData.create(buffer_length, num_maximums)) 
        |waveform_data| {
            return @intFromPtr(waveform_data);
        }
    else |err| switch (err) {
        std.mem.Allocator.Error.OutOfMemory => {
            debug.print("Could not create waveform, out of memory.");
        },
    }

    return std.math.maxInt(usize);
}

pub fn updateFrequencyWaveform(
    raw_waveform_data: *audio.WaveformData,
    frequency_waveform_data: *audio.WaveformData,
    lsa: f32,
    lsb: f32
) callconv(.c) void {
    raw_waveform_data.updateFrequencyWaveform(frequency_waveform_data, lsa, lsb) catch |err| switch(err) {
        audio.GenerateFrequencyWaveformError.LengthNotFactorOf2 => {
            debug.print("Error when updating frequencies: Length of frequency waveform buffer must be half the length of the raw waveform buffer.");
        },
        audio.Math.FourierTransformError.InputNotPowerTwo => {
            debug.print("Error when updating frequencies: Raw buffer length was not power of two.");
        },
        std.mem.Allocator.Error.OutOfMemory => {
            debug.print("Error when updating frequencies: Out of memory.");
        }
    };
}

pub fn updateWaveform(
    waveform_data: *audio.WaveformData
) callconv(.c) void {
    waveform_data.update() 
        catch |err| switch(err) {
            std.mem.Allocator.Error.OutOfMemory => {
                debug.print("Could not update waveform, out of memory.");
            }
        };
}

pub fn getWaveformMaximum(
    waveform_data: *audio.WaveformData,
) callconv(.c) f32 {
    return waveform_data.time_weighted_max;
}
