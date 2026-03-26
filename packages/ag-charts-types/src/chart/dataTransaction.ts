/**
 * Transaction object for performing incremental data updates.
 *
 * Used for efficient high frequency updates.
 *
 * By default, object identity is determined by referential equality.
 * When `dataIdKey` is set on the chart options, items are matched by the specified ID field instead.
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
     * When `dataIdKey` is set on the chart, only the ID field is needed on each item.
     */
    remove?: T[];

    /**
     * Data items to update in the dataset.
     *
     * Items are matched by referential equality (object reference).
     * When `dataIdKey` is set on the chart, items are matched by the ID field and the
     * existing datum is replaced entirely by the new object.
     */
    update?: T[];
}
