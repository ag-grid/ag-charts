/** Types of chart-update, in pipeline execution order. */
export enum ChartUpdateType {
    FULL,
    UPDATE_DATA,
    PROCESS_DATA,
    PROCESS_DOMAIN,
    PROCESS_RANGE,
    PERFORM_LAYOUT,
    PRE_SERIES_UPDATE,
    SERIES_UPDATE,
    PRE_SCENE_RENDER,
    SCENE_RENDER,
    NONE,
}
