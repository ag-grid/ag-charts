/**
 * Constants to declare the expected nominal zIndex for all types of layer in chart rendering.
 */
export enum Layers {
    SERIES_BACKGROUND_ZINDEX = -10,
    AXIS_GRID_ZINDEX = 0,
    AXIS_ZINDEX = 20,
    SERIES_CROSSLINE_RANGE_ZINDEX = 30,
    SERIES_LAYER_ZINDEX = 500,
    SERIES_ERRORBAR_ZINDEX = 600,
    AXIS_FOREGROUND_ZINDEX = 750,
    SERIES_CROSSHAIR_ZINDEX = 1000,
    SERIES_LABEL_ZINDEX = 1500,
    SERIES_CROSSLINE_LINE_ZINDEX = 2500,
    LEGEND_ZINDEX = 3000,
}
