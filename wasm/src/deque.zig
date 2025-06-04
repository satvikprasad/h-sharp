const std = @import("std");
const debug = @import("debug.zig");

pub fn Deque(comptime T: type) type {
    return struct {
        pub const Node = std.DoublyLinkedList(T).Node;
        const Self = @This();

        list: std.DoublyLinkedList(T) = std.DoublyLinkedList(T){},
        length: f32 = 0,

        pub fn pushBack(dq: *Self, data: T) void {
            const new_node: *Node = (
                std.heap.page_allocator.create(Node) catch null
            );

            if (new_node == null) {
                debug.print("Error in Deque.pushBack: failed to create Node.");

                return;
            }

            new_node.next = null;
            new_node.prev = null;
            new_node.data = data;

            dq.list.append(dq.list, new_node);
            dq.length += 1;
        }

        pub fn popBack(dq: *Self) ?T {
            const popped_node: ?*Node = dq.list.pop(dq.list);

            if (popped_node) {
                defer std.heap.page_allocator.destroy(popped_node);

                const data: T = popped_node.?.data;
                dq.length -= 1; 

                return data;
            }

            return null;
        }

        pub fn popFront(dq: *Self) ?T {
            const popped_node: ?*Node = dq.list.popFirst(dq.list);

            if (popped_node) {
                defer std.heap.page_allocator.destroy(popped_node);
                const data: T = popped_node.?.data;
                dq.length -= 1; 

                return data;
            }

            return null;
        }

        pub fn readFront(dq: *Self) ?T {
            if (dq.list.first == null) {
                return null;
            }

            return dq.list.first.?.data;
        }

        pub fn iterateBackwards(
            dq: *Self, iterator: fn (*Node) bool
        ) void {
            if (dq.list.last == null) {
                // Do nothing.
                return;
            }

            var curr_node: *Node = dq.list.last.?;

            while (curr_node.prev != null) {
                if (!iterator(curr_node)) {
                    return;
                }

                curr_node = curr_node.prev.?;
            }

            iterator(curr_node);
        }

        pub fn destroy(dq: *Self) void {
            while(dq.list.last) {
                const to_free: ?*Node = dq.list.pop();

                if (to_free) {
                    std.heap.page_allocator.destroy(to_free);
                }
            }
        }
    };
}
