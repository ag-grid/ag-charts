interface AgChartEvent<T extends string> {
    type: T;
    event: Event;
}
export interface AgNodeClickEvent<TEvent extends string, TDatum> extends AgChartEvent<TEvent> {
    /** Event type. */
    type: TEvent;
    /** Series ID, as specified in series.id (or generated if not specified) */
    seriesId: string;
    /** Datum from the chart or series data array. */
    datum: TDatum;
    /** xKey as specified on series options */
    xKey?: string;
    /** yKey as specified on series options */
    yKey?: string;
    /** sizeKey as specified on series options */
    sizeKey?: string;
    /** labelKey as specified on series options */
    labelKey?: string;
    /** colorKey as specified on series options */
    colorKey?: string;
    /** angleKey as specified on series options */
    angleKey?: string;
    /** calloutLabelKey as specified on series options */
    calloutLabelKey?: string;
    /** sectorLabelKey as specified on series options */
    sectorLabelKey?: string;
    /** radiusKey as specified on series options */
    radiusKey?: string;
}
export type AgChartClickEvent = AgChartEvent<'click'>;
export type AgChartDoubleClickEvent = AgChartEvent<'doubleClick'>;
export type AgChartContextMenuEvent = AgChartEvent<'contextMenuEvent'>;
export type AgNodeContextMenuActionEvent<TDatum = any> = AgNodeClickEvent<'nodeContextMenuAction', TDatum>;
export interface AgBaseChartListeners<TDatum> {
    /** The listener to call when a node (marker, column, bar, tile or a pie sector) in any series is clicked.
     *  Useful for a chart containing multiple series.
     */
    seriesNodeClick?: (event: AgNodeClickEvent<'seriesNodeClick', TDatum>) => any;
    /** The listener to call when a node (marker, column, bar, tile or a pie sector) in any series is double clicked.
     * Useful for a chart containing multiple series.*/
    seriesNodeDoubleClick?: (event: AgNodeClickEvent<'seriesNodeDoubleClick', TDatum>) => any;
    /** The listener to call when the chart is clicked. */
    click?: (event: AgChartClickEvent) => any;
    /** The listener to call when the chart is double clicked. */
    doubleClick?: (event: AgChartDoubleClickEvent) => any;
}
export interface AgSeriesListeners<TDatum> {
    /** The listener to call when a node (marker, column, bar, tile or a pie sector) in the series is clicked. */
    nodeClick?: (params: AgNodeClickEvent<'nodeClick', TDatum>) => void;
    /** The listener to call when a node (marker, column, bar, tile or a pie sector) in the series is double clicked. */
    nodeDoubleClick?: (params: AgNodeClickEvent<'nodeDoubleClick', TDatum>) => void;
}
export {};
