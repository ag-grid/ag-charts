type ListItem<T> = { value: T; next: ListItem<T> | null };
export type List<T> = ListItem<T> | null;

export const insertManySorted = <T>(list: List<T>, items: T[], cmp: (a: T, b: T) => number): List<T> => {
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
};
