const audio_wrappers = @import("audio/wrappers.zig");
const audio = @import("audio/audio.zig");

comptime {
    @export(&audio_wrappers.createWaveform, .{ .name = "audioCreateWaveform" });

    @export(&audio_wrappers.updateFrequencyWaveform, .{ .name = "audioUpdateFrequencyWaveform" });

    @export(&audio_wrappers.updateWaveform, .{ .name = "audioUpdateWaveform" });

    @export(&audio.computeLogScaleAmplitude, .{ .name = "audioComputeLogScaleAmplitude" });

    @export(&audio_wrappers.getWaveformMaximum, .{ .name = "audioGetWaveformMaximum" });

    @export(&audio_wrappers.getWaveformBuffer, .{ .name = "audioGetWaveformBuffer" });

    @export(&audio.WaveformData.destroy, .{ .name = "audioDestroyWaveform" });

    @export(&audio.WaveformData.computeDecibel, .{ .name = "audioComputeWaveformDecibel" });
}
