import type { AgAnnotation } from '../chart/annotationsOptions';
import type { AgStateSerializableDate } from './stateTypes';

export interface AgInitialStateOptions {
    /** The initial set of annotations to display on the chart. */
    annotations?: AgAnnotation[];
    /* The initial chart type. */
    chartType?: AgInitialStateChartType;
    /** The initial zoom state. */
    zoom?: AgInitialStateZoomOptions;
}

export type AgInitialStateChartType =
    | 'candlestick'
    | 'hollow-candlestick'
    | 'ohlc'
    | 'line'
    | 'step-line'
    | 'hlc'
    | 'high-low';

export interface AgInitialStateZoomOptions {
    rangeX?: AgInitialStateZoomRange;
    rangeY?: AgInitialStateZoomRange;
    ratioX?: AgInitialStateZoomRatio;
    ratioY?: AgInitialStateZoomRatio;
}

export interface AgInitialStateZoomRange {
    start?: AgStateSerializableDate | number;
    end?: AgStateSerializableDate | number;
}

export interface AgInitialStateZoomRatio {
    start?: number;
    end?: number;
}
