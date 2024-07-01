type ListItem<T> = {
    value: T;
    next: ListItem<T> | null;
};
export type List<T> = ListItem<T> | null;
export declare const insertManySorted: <T>(list: List<T>, items: T[], cmp: (a: T, b: T) => number) => List<T>;
export {};
