import type { AgAnnotation } from '../chart/annotationsOptions';
import type { AgInitialStateLegendOptions } from '../chart/legendOptions';
import type { Ratio } from '../chart/types';
import type { AgAutoScaledAxes } from '../chart/zoomOptions';
import type { AgPriceVolumeChartType } from '../presets/financial/priceVolumeOptions';
import type { AgActiveState } from './activeState';
import type {
    AgStateSerializableBigInt,
    AgStateSerializableDate,
    AgStateSerializableGroupingValueType,
} from './stateTypes';

// Theme
export interface AgInitialStateThemeableOptions {
    /** The initial zoom state. */
    zoom?: AgInitialStateZoomOptions;
    /** The initial legend series visibility state. */
    legend?: AgInitialStateLegendOptions[];
}

// Options
export interface AgInitialStateOptions {
    /** The initial picked item. */
    active?: AgActiveState;
    /** The initial set of annotations to display on the chart. */
    annotations?: AgAnnotation[];
    /** The initial chart type. */
    chartType?: AgInitialStateChartType;
    /** The initial collapsed datums by id, for Organization Charts. */
    collapsed?: (string | number)[];
    /** The initial legend series visibility state. */
    legend?: AgInitialStateLegendOptions[];
    /** The initial legend pagination page as a zero-based index, restored on a best-effort like-for-like basis as the page count depends on the render size. */
    legendPagination?: number;
    /** The initial zoom state. */
    zoom?: AgInitialStateZoomOptions;
}

export type AgInitialStateChartType = AgPriceVolumeChartType;

export interface AgInitialStateZoomOptions {
    /** The initial zoom range for the x-axis. */
    rangeX?: AgInitialStateZoomRange;
    /** The initial zoom range for the y-axis. */
    rangeY?: AgInitialStateZoomRange;
    /** The initial zoom ratio for the x-axis. */
    ratioX?: AgInitialStateZoomRatio;
    /** The initial zoom ratio for the y-axis. */
    ratioY?: AgInitialStateZoomRatio;
    /** Axes that are zoomed by the auto scaling functionality. */
    autoScaledAxes?: AgAutoScaledAxes;
}

export interface AgInitialStateZoomRange {
    /** The start value of the zoom range. A number, or a serialised value object. */
    start?: AgStateSerializableDate | AgStateSerializableBigInt | AgStateSerializableGroupingValueType | number;
    /** The end value of the zoom range. A number, or a serialised value object. */
    end?: AgStateSerializableDate | AgStateSerializableBigInt | AgStateSerializableGroupingValueType | number;
}

export interface AgInitialStateZoomRatio {
    /** The start ratio of the zoom range. */
    start?: Ratio;
    /** The end ratio of the zoom range. */
    end?: Ratio;
}
