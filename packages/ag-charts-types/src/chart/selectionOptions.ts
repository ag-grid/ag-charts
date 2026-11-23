import type { FillOptions, LineDashOptions, StrokeOptions } from '../series/cartesian/commonOptions';
import type { Opacity } from './types';

export interface AgSelectionStyleOptions extends StrokeOptions, LineDashOptions, FillOptions {
    /** The opacity of the whole series (line, fill, labels and markers, if any) */
    opacity?: Opacity;
}

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

export interface AgSelectionOptions<
    ItemSelectionStyleOptions = AgSelectionStyleOptions,
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
    /**
     * Styling options for selected items.
     *
     * Default: `{ strokeWidth: 2, opacity: 1 }`
     */
    selectedItem?: ItemSelectionStyleOptions;
    /**
     * Styling options for unselected items.
     *
     * Default: `{ opacity: 0.5 }`. `0.3` for line, area, scatter, bubble, candlestick, OHLC, HLC, range area, radar line, radar area and map marker; `0.6` for map line
     */
    unselectedItem?: ItemSelectionStyleOptions;
    /**
     * Styling options for series with no selections when there is at least one other selected series.
     *
     * Default: `{ opacity: 0.5 }`. `0.3` for line, area, scatter, bubble, candlestick, OHLC, HLC, range area, radar line, radar area and map marker; `0.2` for map line
     */
    unselectedSeries?: SeriesSelectionStyleOptions;
}
