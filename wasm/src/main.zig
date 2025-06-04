const audio = @import("audio/wrappers.zig");

comptime {
    // These require wrappers to follow c conventions.
    @export(&audio.initialise, .{ 
        .name = "audioInitialise" 
    });

    @export(&audio.update, .{ 
        .name = "audioUpdate" 
    });

    @export(&audio.getSystemBuffer, .{ 
        .name = "audioGetSystemBuffer" 
    });

    @export(&audio.getMaximumFromInput, .{ 
        .name = "audioGetMaximumFromInput" 
    });

    @export(&audio.getBufferFromInput, .{ 
        .name = "audioGetBufferFromInput" 
    });

    @export(&audio.getBufferLengthFromInput, .{
        .name = "audioGetBufferLengthFromInput"
    });
}
