import type { AgMarkerShape } from 'ag-charts-types';

import type { Gradient } from '../../scene/gradient/gradient';

export interface LegendMarker {
    shape?: AgMarkerShape;
    fill?: string | Gradient;
    fillOpacity: number;
    stroke?: string | Gradient;
    strokeOpacity: number;
    strokeWidth: number;
    enabled?: boolean;
}

export interface LegendLine {
    stroke: string;
    strokeOpacity: number;
    strokeWidth: number;
    lineDash: number[];
}

export interface LegendSymbolOptions {
    marker: LegendMarker;
    line?: LegendLine;
}
