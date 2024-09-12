import type { AgAnnotation } from '../chart/annotationsOptions';

// import type { AgStateSerializableDate } from './stateTypes';

export interface AgInitialStateOptions {
    /** The initial set of annotations to display on the chart. */
    annotations?: AgAnnotation[];
    /** The initial zoom state. */
    // zoom?: AgInitialStateZoomOptions;
}

// export interface AgInitialStateZoomOptions {
//     rangeX?: AgInitialStateZoomRange;
//     rangeY?: AgInitialStateZoomRange;
//     ratioX?: AgInitialStateZoomRatio;
//     ratioY?: AgInitialStateZoomRatio;
// }

// export interface AgInitialStateZoomRange {
//     start?: AgStateSerializableDate | number;
//     end?: AgStateSerializableDate | number;
// }

// export interface AgInitialStateZoomRatio {
//     start?: number;
//     end?: number;
// }
