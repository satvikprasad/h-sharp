class DoubleStackNode<T> {
    public next: DoubleStackNode<T> | null = null;
    public prev: DoubleStackNode<T> | null = null;

    constructor(public data: T) {}
}

interface IDoubleStack<T> {
    pushFront(elem: T): void;
    popFront(): T | null;

    pushBack(elem: T): void;
    popBack(): T | null;
}

class DoubleStack<T> implements IDoubleStack<T> {
    private head: DoubleStackNode<T> | null = null;
    private tail: DoubleStackNode<T> | null = null;

    pushFront(elem: T): void {
        if (!this.head) {
            this.head = new DoubleStackNode(elem);
            return
        }

        let prevHead = this.head;
        this.head = new DoubleStackNode(elem);

        prevHead.prev = this.head;
        this.head.next = prevHead;
    }

    popFront(): T | null {
        if (!this.head) {
            return null;
        }
        
        let toPop = this.head;

        if (toPop.next) {
            toPop.next.prev = null;
        }

        this.head = toPop.next;
        toPop.next = null;

        return toPop.data;
    }

    pushBack(elem: T): void {
        if (!this.tail) {
            this.tail = new DoubleStackNode(elem);
            return;
        }

        let prevTail = this.tail;
        this.tail = new DoubleStackNode(elem);

        prevTail.next = this.tail;
        this.tail.prev = prevTail;
    }

    popBack(): T | null {
        if (!this.tail) {
            return null;
        }
        
        let toPop = this.tail;

        if (toPop.prev) {
            toPop.prev.next = null;
        }

        this.tail = toPop.prev;
        toPop.prev = null;

        return toPop.data;
    }
}

export { DoubleStack }
