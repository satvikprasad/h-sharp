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

pub const GenerateFrequencyWaveformError = error{
    LengthNotFactorOf2,
};

pub const WaveformData = struct {
    const Self = @This();

    buffer: []f32,

    maximums: dq.Deque(f32),
    rolling_maximums: dq.Deque(f32),

    time_weighted_max: f32,
    num_maximums: usize,

    fn updateMaximiums(waveform: *Self) !void {
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

    pub fn update(waveform_data: *Self) !void {
        try updateMaximiums(waveform_data);
    }

    pub fn create(
        buffer_length: usize,
        num_maximums: usize
    ) !*WaveformData {
        const waveform_data = try std.heap.page_allocator.create(
            WaveformData
        );

        const buffer = try std.heap.page_allocator.alloc(
            f32, buffer_length);
        @memset(buffer, 0);
        
        waveform_data.buffer = buffer;
        waveform_data.num_maximums = num_maximums;
        waveform_data.maximums = dq.Deque(f32){};
        waveform_data.rolling_maximums = dq.Deque(f32){};
        waveform_data.time_weighted_max = 0;

        return waveform_data;
    }

    pub fn updateFrequencyWaveform(
        raw_waveform_data: *Self,
        frequency_waveform_data: *Self,
        lsa: f32,
        lsb: f32,
    ) !void {
        if (frequency_waveform_data.buffer.len != 
            raw_waveform_data.buffer.len / 2) {
            return GenerateFrequencyWaveformError.LengthNotFactorOf2;
        }

        try realFFT(
            raw_waveform_data.buffer.ptr, 
            frequency_waveform_data.buffer.ptr, 
            raw_waveform_data.buffer.len, 
            lsa,
            lsb
        );
    }

    pub fn destroy(waveform_data: *Self) callconv(.c) void {
        std.heap.page_allocator.free(waveform_data.buffer);
        std.heap.page_allocator.destroy(waveform_data);
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

pub fn computeLogScaleAmplitude(N: usize, k: f32) callconv(.c) f32 {
    const N_f32: f32 = @floatFromInt(N);
    const phi = N_f32/2 - 1;

    return phi/(std.math.exp(k*phi) - 1);
}
