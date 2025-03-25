import type { AgAxisGridStyle } from 'ag-charts-types';

import { Property } from '../../util/properties';

export class AxisGridLine {
    @Property
    enabled = true;

    @Property
    width: number = 1;

    @Property
    style: AgAxisGridStyle[] = [
        {
            stroke: undefined,
            lineDash: [],
        },
    ];
}
