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
     * Click-to-select mode. `'single'` replaces the current selection; `'multiple'` toggles each click.
     * Holding Control (or Command) temporarily promotes a single click to `'multiple'`.
     *
     * Default: `'single'`
     */
    clickMode?: AgSelectionClickMode;
    /**
     * Drag-to-select containment rule. `'any'` selects a datum when any part overlaps the drag rectangle;
     * `'all'` requires the datum to be fully enclosed.
     *
     * Default: `'any'`
     */
    containment?: AgSelectionContainment;
}

export interface AgSelectionOptions<ItemSelectionStyleOptions> {
    /** Set to `true` to enable the data-selection on this series. */
    enabled?: boolean;
    /**
     * Override the drag-to-select containment rule for this series.
     *
     * Default: `chart.selection.containment`
     */
    containment?: AgSelectionContainment;
    /** Styling options for selected items. */
    selectedItem?: ItemSelectionStyleOptions;
    /** Styling options for unselected items. */
    unselectedItem?: ItemSelectionStyleOptions;
}
