const std = @import("std");

pub fn Deque(comptime T: type) type {
    return struct {
        pub const Node = std.DoublyLinkedList(T).Node;

        const Self = @This();

        list: std.DoublyLinkedList(T),
        length: f32 = 0,

        pub fn pushBack(dq: *Self, data: T) void {
            const new_node: *Node = (
                std.heap.page_allocator
                .alloc(Node, 1) catch null
            ).?.ptr;

            new_node.next = null;
            new_node.prev = null;
            new_node.data = data;

            dq.list.append(dq.list, new_node);
            dq.length += 1;
        }

        pub fn popBack(dq: *Self) ?T {
            const popped_node: ?*Node = dq.list.pop(dq.list);
            defer std.heap.page_allocator.free(popped_node);

            if (popped_node) {
                const data: T = popped_node.?.data;
                dq.length -= 1; 

                return data;
            }

            return null;
        }

        pub fn popFront(dq: *Self) ?T {
            const popped_node: ?*Node = dq.list.popFirst(dq.list);
            defer std.heap.page_allocator.free(popped_node);

            if (popped_node) {
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
    };
}
