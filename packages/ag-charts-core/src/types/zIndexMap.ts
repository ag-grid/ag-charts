/**
 * Constants to declare the expected nominal zIndex for all types of layer in chart rendering.
 */
export enum ZIndexMap {
    CHART_BACKGROUND,
    SERIES_AREA_UNDERLAY,
    AXIS_BAND_HIGHLIGHT,
    AXIS_GRID,
    AXIS,
    SERIES_AREA_CONTAINER,
    ZOOM_SELECTION,
    SERIES_AXIS_OVERLAY_LOW,
    SERIES_LAYER,
    AXIS_FOREGROUND,
    SERIES_CROSSHAIR,
    SERIES_AXIS_OVERLAY_MID,
    SERIES_ANNOTATION,
    CHART_ANNOTATION,
    CHART_ANNOTATION_FOCUSED,
    STATUS_BAR,
    SERIES_LABEL,
    LEGEND,
    NAVIGATOR,
    FOREGROUND,
}

export enum SeriesZIndexMap {
    BACKGROUND,
    ANY_CONTENT,
}

export enum SeriesContentZIndexMap {
    FOREGROUND,
    HIGHLIGHT,
    LABEL,
}

export enum PolarZIndexMap {
    BACKGROUND,
    FOREGROUND,
    HIGHLIGHT,
    LABEL,
}
