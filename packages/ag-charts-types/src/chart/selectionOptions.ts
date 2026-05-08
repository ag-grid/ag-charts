export type AgSelectionClickMode = 'single' | 'multiple';

export type AgSelectionContainment = 'any' | 'all';

export interface AgChartSelectionOptions {
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
     * Set to `true` to enable drag-to-select.
     *
     * Default: `false`
     */
    enableDrag?: boolean;
    /**
     * Set to `true` to clear the selection by clicking an empty space on the chart.
     *
     * Default: `true`
     */
    enableClickAwayToClear?: boolean;
    /**
     * Click-to-select cardinality. Mode `'multiple'` toggles the selection on the clicked series-node. Mode `'single'`
     * first deselects the current selection completely, and then sets the clicked node to selected. Clicking using the
     * Control (or Command) modifier temporarily uses the `'multiple'` mode for that one click.
     *
     * Default: `'single'`
     */
    clickMode?: AgSelectionClickMode;
    /**
     * Drag-to-select containment rule. Mode `'any'` selects a datum if any part of it overlaps the
     * drag rectangle, including overlapping items at the same position. Mode `'all'` selects a datum
     * only if it is entirely enclosed within the drag rectangle. Unlike click selection, which
     * targets the topmost datum, drag selection includes all qualifying overlapping items.
     *
     * Default: `'any'`
     */
    containment?: AgSelectionContainment;
}

export interface AgSelectionOptions<
    ItemSelectionStyleOptions,
    SeriesSelectionStyleOptions = ItemSelectionStyleOptions,
> {
    /** Set to `true` to enable the data-selection on this series. */
    enabled?: boolean;
    /**
     * Override the drag-to-select containment rule for this series.
     *
     * Default: `chart.selection.containment`
     */
    containment?: AgSelectionContainment;
    /** Styling options for selected items.  */
    selectedItem?: ItemSelectionStyleOptions;
    /** Styling options for unselected items. */
    unselectedItem?: ItemSelectionStyleOptions;
    /** Styling options for series with no selections when there is at least one other selected series. */
    unselectedSeries?: SeriesSelectionStyleOptions;
}
