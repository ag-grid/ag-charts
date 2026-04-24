import type { AgAxisLineOptions } from 'ag-charts-types';

export class AxisLine {
    enabled = true;
    width: number = 1;
    stroke?: string = undefined;

    applyOptions(options: AgAxisLineOptions | undefined): void {
        if (options != null) Object.assign(this, options);
    }
}
