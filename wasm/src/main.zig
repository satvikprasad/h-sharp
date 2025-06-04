const audio = @import("audio/wrappers.zig");

comptime {
    // These require wrappers to follow c conventions.
    @export(&audio.initialise, .{ .name = "audioInitialise" });
    @export(&audio.update, .{ .name = "audioUpdate" });
    @export(&audio.getSystemBuffer, .{ .name = "audioGetSystemBuffer" });

    @export(&audio.getFrequencyBufferFromInput, .{ .name = "audioGetFrequencyBufferFromInput" });
    @export(&audio.getRawBufferFromInput, .{ .name = "audioGetRawBufferFromInput" });
}
