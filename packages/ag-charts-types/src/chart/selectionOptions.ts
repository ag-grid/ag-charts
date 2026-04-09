export type AgSelectionClickMode = 'single' | 'multiple';

export interface AgSelectionOptions {
    /**
     * Set to `true` to enable the data-selection module.
     *
     * Default: `false`
     */
    enabled?: boolean;

    /**
     * Set to `true` to enable click-to-select.
     *
     * Default: `true`
     */
    enableClick?: boolean;

    /**
     * Click-to-select cardinality. Mode `'multiple'` toggles the selection on the clicked series-node. Mode `'single'`
     * first deselects the current selection completely, and then sets the clicked node to selected. Clicking using the
     * Control (or Command) modifier temporarily uses the `'multiple'` mode for that one click.
     *
     * Default: `'single'`
     */
    clickMode: AgSelectionClickMode;
}
