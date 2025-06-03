const audio = @import("audio/audio.zig");
const std = @import("std");

extern fn server_print(sPtr: usize, length: usize) void;

fn print(s: []const u8) !void {
    const to_print: []u8 = try std.heap.page_allocator.alloc(u8, s.len);
    defer std.heap.page_allocator.free(to_print);

    std.mem.copyForwards(u8, to_print, s);

    server_print(@intFromPtr(to_print.ptr), s.len);
}

fn safePrint(s: []const u8) void {
    print(s) catch |err| {
        if (err == std.mem.Allocator.Error.OutOfMemory) {
            // We are cooked here.
        }
    };
}

export fn audio_initialise_buffers(
    N: usize
) usize {
    return audio.initialise_buffers(N) catch |err| { 
        if (err == std.mem.Allocator.Error.OutOfMemory) {
            safePrint(
                "Insufficient memory to intialise audio buffers"
            );
        }

        return std.math.maxInt(usize);
    };
}

export fn audio_real_fft(
    input: [*]f32,
    output: [*]f32,
    N: usize,
) void {
    audio.real_fft(input, output, N)
        catch |err| {
            if (err == audio.FourierTransformError.InputNotPowerTwo) {
                safePrint("FFT received input with length that was not a power of 2.");
            }
        };
}
