import { Property } from 'ag-charts-core';
import type { AgAxisGridStyle } from 'ag-charts-types';

export class AxisGridLine {
    @Property
    enabled = true;

    @Property
    width: number = 1;

    @Property
    style: AgAxisGridStyle[] = [
        {
            fill: undefined,
            fillOpacity: 1,
            stroke: undefined,
            strokeWidth: undefined,
            lineDash: [],
        },
    ];
}
