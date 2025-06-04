const audio = @import("audio/audio.zig");
const debug = @import("debug.zig");
const std = @import("std");

export fn audioInitialiseBuffers(
    N: usize
) usize {
    const ptr: usize = audio.initialiseBuffersWrapper(N) catch |err| { 
        if (err == std.mem.Allocator.Error.OutOfMemory) {
            debug.print(
                "Insufficient memory to intialise audio buffers"
            );
        }

        return std.math.maxInt(usize);
    };

    return ptr;
}

comptime {
    @export(&audio.realFFTWrapper, .{ .name = "audioRealFFT" });
    @export(&audio.computeLogScaleAmplitude, .{ .name = "audioComputeLogScaleAmplitude" });
}

