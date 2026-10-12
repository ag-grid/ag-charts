import type { AgCssColorOrRef } from 'ag-charts-types';

/**
 * Internal options of the `axisSelectedBand` axis plugin; presets fill them in on a category axis.
 */
export interface AxisSelectedBandOptions {
    enabled?: boolean;
    fill?: AgCssColorOrRef;
    fillOpacity?: number;
    stroke?: AgCssColorOrRef;
    strokeWidth?: number;
    lineDash?: number[];
}
