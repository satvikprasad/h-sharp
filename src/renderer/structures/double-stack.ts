class DoubleStackNode<T> {
    public next: DoubleStackNode<T> | null = null;
    public prev: DoubleStackNode<T> | null = null;

    constructor(public data: T) {}
}

interface IDoubleStack<T> {
    pushFront(elem: T): void;
    popFront(): T | null;
    readFront(): T | null;

    pushBack(elem: T): void;
    popBack(): T | null;
}

class DoubleStack<T> implements IDoubleStack<T> {
    private head: DoubleStackNode<T> | null = null;
    private tail: DoubleStackNode<T> | null = null;

    public length: number = 0;

    pushFront(elem: T): void {
        this.length += 1;

        if (!this.head) {
            this.head = new DoubleStackNode(elem);
            this.tail = this.head;
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

        this.length -= 1;

        if (!this.head.next) {
            let data = this.head.data;

            this.head = null;
            this.tail = null;

            return data;
        }

        let data = this.head.data;

        if (this.head.next) {
            this.head.next.prev = null;
        }

        this.head = this.head.next;

        return data;
    }

    readFront(): T | null {
        if (!this.head) {
            return null;
        }

        return this.head.data;
    }

    pushBack(elem: T): void {
        this.length += 1;

        if (!this.tail) {
            this.tail = new DoubleStackNode(elem);
            this.head = this.tail;
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

        this.length -= 1;

        if (!this.tail.prev) {
            let toPop = this.tail;

            this.tail = null;
            this.head = null;

            return toPop.data;
        }
        
        let toPop = this.tail;

        if (toPop.prev) {
            toPop.prev.next = null;
        }

        this.tail = toPop.prev;
        toPop.prev = null;

        return toPop.data;
    }

    printStack(): string {
        if (!this.head) {
            return "";
        }
       
        let out = "["
        let currNode = this.head

        while (currNode.next) {
            out = out.concat(String(currNode.data), ", ")
            currNode = currNode.next
        }

        out = out.concat(String(currNode.data), "]")

        return out
    }

    iterateBackwards(
        callback: (node: DoubleStackNode<T>) => boolean
    ) {
        if (!this.tail) {
            return;
        }

        let currNode = this.tail;

        while (currNode.prev != null) {
            let shouldContinue = callback(currNode);

            if (!shouldContinue) return

            currNode = currNode.prev;
        }

        callback(currNode);
    }
}

export { 
    type DoubleStackNode, 

    DoubleStack 
}
