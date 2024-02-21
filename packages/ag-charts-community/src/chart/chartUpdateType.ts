/** Types of chart-update, in pipeline execution order. */
export enum ChartUpdateType {
    FULL,
    UPDATE_DATA,
    PROCESS_DATA,
    PERFORM_LAYOUT,
    TOOLTIP_RECALCULATION,
    SERIES_UPDATE,
    SCENE_RENDER,
    NONE,
}
