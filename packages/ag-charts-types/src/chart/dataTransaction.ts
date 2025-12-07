/**
 * Transaction object for performing incremental data updates.
 *
 * Used for efficient high frequency updates.
 *
 *
 * Object identity is determined by referential equality.
 */
export interface AgDataTransaction<T = unknown> {
    /**
     * Data items to add to the dataset.
     *
     * Use `addIndex` to control the insertion position, otherwise items are appended to the end.
     */
    add?: T[];

    /**
     * Zero-based index at which to insert the `add` items.
     * - If undefined or >= dataset length: items are appended to the end
     * - If 0: items are prepended to the beginning
     * - Otherwise: items are inserted at the specified position
     */
    addIndex?: number;

    /**
     * Data items to remove from the dataset.
     *
     * Items are matched by referential equality (object reference).
     */
    remove?: T[];

    /**
     * Data items to update in the dataset.
     *
     * Items are matched by referential equality (object reference).
     */
    update?: T[];
}
