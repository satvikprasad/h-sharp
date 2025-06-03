const std = @import("std");

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

pub fn initialise_buffers(
    N: usize
) !usize {
    const buffers = try std.heap.page_allocator
        .alloc(f32, 2*N);

    return @intFromPtr(buffers.ptr);
}

pub fn real_fft(
    input: [*]f32, 
    output: [*]f32,
    N: usize,
) !void {
    const cx_input: []std.math.Complex(f32) = try std.heap
        .page_allocator
        .alloc(
            std.math.Complex(f32), N
        );
    defer std.heap.page_allocator.free(cx_input);

    for (0..N) |i| {
        cx_input[i].re = input[i];
    }

    const cx_output: []std.math.Complex(f32) = try std.heap
        .page_allocator
        .alloc(
            std.math.Complex(f32), N
        );
    defer std.heap.page_allocator.free(cx_output);

    try fft(cx_input.ptr, cx_output.ptr, N, 1);

    for (cx_output, 0..) |elem, i| {
        output[i] = elem.squaredMagnitude();
    }
}
