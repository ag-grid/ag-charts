type LinkedListItem<T> = { value: T; next: LinkedListItem<T> | null };
export type LinkedList<T> = LinkedListItem<T> | null;

export function insertListItemsSorted<T>(list: LinkedList<T>, items: T[], cmp: (a: T, b: T) => number): LinkedList<T> {
    let head = list;
    let current = head;
    for (const value of items) {
        if (head == null || cmp(head.value, value) > 0) {
            head = { value, next: head };
            current = head;
        } else {
            current = current!;

            while (current.next != null && cmp(current.next.value, value) <= 0) {
                current = current.next;
            }

            current.next = { value, next: current.next };
        }
    }
    return head;
}
