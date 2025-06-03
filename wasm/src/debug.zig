const std = @import("std");

extern fn serverPrint(sPtr: usize, length: usize) void;

extern fn serverPrintFloat(f: f32) void;

fn printUnsafe(s: []const u8) !void {
    const to_print: []u8 = try std.heap.page_allocator
        .alloc(u8, s.len);
    defer std.heap.page_allocator.free(to_print);

    std.mem.copyForwards(u8, to_print, s);

    serverPrint(@intFromPtr(to_print.ptr), s.len);
}

pub fn print(s: []const u8) void {
    printUnsafe(s) catch |err| {
        if (err == std.mem.Allocator.Error.OutOfMemory) {
            // We are cooked here.
        }
    };
}
