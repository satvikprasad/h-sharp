const audio = @import("audio/wrappers.zig");

comptime {
    // These require wrappers to follow c conventions.
    @export(&audio.realFFTWrapper, .{ .name = "audioRealFFT" });
    @export(&audio.initialiseWrapper, .{ .name = "audioInitialise" });
    @export(&audio.initialiseBuffersWrapper, .{ .name = "audioInitialiseBuffers" });

    // These don't
    @export(&audio.computeLogScaleAmplitudeWrapper, .{ .name = "audioComputeLogScaleAmplitude" });
}
