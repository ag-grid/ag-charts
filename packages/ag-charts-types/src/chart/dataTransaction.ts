export interface AgDataTransaction<T = unknown> {
    append?: T[];
    prepend?: T[];
    remove?: T[];
    // update?: T[];
    // replace?: T[];
    // clear?: boolean;
}
