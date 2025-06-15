const std = @import("std");

pub fn build(b: *std.Build) void {
    const app = b.addExecutable(.{
        .name = "peggiator",
        .root_source_file = b.path("src/main.zig"),
        .target = b.resolveTargetQuery(.{
            .cpu_arch = .wasm32,
            .os_tag = .freestanding
        }),
        .optimize = .Debug,
    });

    app.entry = .disabled;
    app.rdynamic = true;

    b.installArtifact(app);
}
