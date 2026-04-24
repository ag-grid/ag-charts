import type { AgAxisGridLineOptions, AgAxisGridStyle } from 'ag-charts-types';

export class AxisGridLine {
    enabled = true;
    width: number = 1;
    style: AgAxisGridStyle[] = [
        {
            fill: undefined,
            fillOpacity: 1,
            stroke: undefined,
            strokeWidth: undefined,
            lineDash: [],
        },
    ];

    applyOptions(options: AgAxisGridLineOptions | undefined): void {
        if (options != null) Object.assign(this, options);
    }
}
