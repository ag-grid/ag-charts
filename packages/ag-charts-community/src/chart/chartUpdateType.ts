/** Types of chart-update, in pipeline execution order. */
export enum ChartUpdateType {
    FULL,
    UPDATE_DATA,
    PROCESS_DATA,
    PERFORM_LAYOUT,
    SERIES_UPDATE,
    PRE_SCENE_RENDER,
    SCENE_RENDER,
    NONE,
}
