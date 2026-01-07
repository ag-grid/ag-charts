import type { AgAnnotation } from '../chart/annotationsOptions';
import type { AgInitialStateLegendOptions } from '../chart/legendOptions';
import type { Ratio } from '../chart/types';
import type { AgAutoScaledAxes } from '../chart/zoomOptions';
import type { AgPriceVolumeChartType } from '../presets/financial/priceVolumeOptions';
import type { AgStateSerializableDate } from './stateTypes';

// Theme
export interface AgInitialStateThemeableOptions {
    zoom?: AgInitialStateZoomOptions;
    legend?: AgInitialStateLegendOptions[];
}

// Options
export interface AgInitialStateOptions {
    /** The initial picked item. */
    picked?: AgPickedState;
    /** The initial set of annotations to display on the chart. */
    annotations?: AgAnnotation[];
    /* The initial chart type. */
    chartType?: AgInitialStateChartType;
    /** The initial zoom state. */
    zoom?: AgInitialStateZoomOptions;
    /** The initial legend state. */
    legend?: AgInitialStateLegendOptions[];
}

export type AgInitialStateChartType = AgPriceVolumeChartType;

export interface AgInitialStateZoomOptions {
    rangeX?: AgInitialStateZoomRange;
    rangeY?: AgInitialStateZoomRange;
    ratioX?: AgInitialStateZoomRatio;
    ratioY?: AgInitialStateZoomRatio;
    /** Axes that are zoomed by the auto scaling functionality. */
    autoScaledAxes?: AgAutoScaledAxes;
}

export interface AgInitialStateZoomRange {
    // @todo(AG-13954) Re-enable strings
    // start?: AgStateSerializableDate | string | number;
    // end?: AgStateSerializableDate | string | number;
    start?: AgStateSerializableDate | number;
    end?: AgStateSerializableDate | number;
}

export interface AgInitialStateZoomRatio {
    start?: Ratio;
    end?: Ratio;
}

export interface AgPickedItemsState {
    /** The unique identifier of the series that this picked datum belongs to. */
    seriesId: string;
    /** The unique identifier of the picked datum. */
    itemId?: string;
}

export interface AgPickedState {
    /**
     * The active series datum shape. If the entire series is active, then `itemId` will be set to `undefined`.
     */
    activeItem?: AgPickedItemsState;
    /** The frozen state. When the picked item is frozen, user interactions with the chart will be ignored and not updated the currently picked item. */
    frozen: boolean;
}
