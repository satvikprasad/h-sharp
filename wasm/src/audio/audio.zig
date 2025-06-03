const std = @import("std");
const debug = @import("../debug.zig");

pub const FourierTransformError = error{
    OutOfMemory,
    InputNotPowerTwo,
};

fn fft( 
    input: [*]std.math.Complex(f32),
    output: [*]std.math.Complex(f32),
    N: usize,
    stride: usize
) !void {
    if (N == 1) {
        output[0] = input[0];
        return;
    }

    if (N/2 % 1 != 0) {
        return FourierTransformError.InputNotPowerTwo;
    }

    const even = output;
    const odd = output + N/2;

    try fft(input, even, N/2, 2*stride);
    try fft(input + stride, odd, N/2, 2*stride);

    for (0..N/2) |i| {
        const theta: f32 = -2 * std.math.pi * 
            @as(f32, @floatFromInt(i))/@as(f32, @floatFromInt(N));

        const p: std.math.Complex(f32) = even[i];
        const q: std.math.Complex(f32) = 
            odd[i].mul(std.math.complex.exp(
                    std.math.complex.Complex(f32){
                        .im = theta,
                        .re = 0
                    }
            ));

        output[i] = p.add(q);
        output[i + N/2] = p.sub(q);
    }
}

pub fn initialiseBuffers(
    N: usize
) !usize {
    const buffers = try std.heap.page_allocator
        .alloc(f32, 2*N);

    @memset(buffers, 0);

    return @intFromPtr(buffers.ptr);
}

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

fn realFFT(
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

    try fft(cx_input.ptr, cx_output.ptr, N, 1);

    for (0..N/2) |i| {
        output[i] = std.math.pow(f32, 
            cx_output[computeLogScaleIndex(lsa, lsb, i)].magnitude(), 0.4);
    }
}

pub fn realFFTWrapper(
    input: [*]f32,
    output: [*]f32,
    N: usize,
    lsa: f32,
    lsb: f32,
) callconv(.c) void {
    realFFT(input, output, N, lsa, lsb) catch |err| {
        switch (err) {
            std.mem.Allocator.Error.OutOfMemory => {
                debug.print("ERROR: Ran out of memory while computing FFT.");
            },
            FourierTransformError.InputNotPowerTwo => {
                debug.print("ERROR: Input array did not have length that was a power of two.");
            }
        }
    };
}

pub fn computeLogScaleAmplitude(N: usize, k: f32) 
    callconv(.c) f32 {
        const N_f32: f32 = @floatFromInt(N);
        const phi = N_f32/2 - 1;

        return phi/(std.math.exp(k*phi) - 1);
    }
