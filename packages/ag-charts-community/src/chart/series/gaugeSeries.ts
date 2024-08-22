import type { TextAlign, VerticalAlign } from 'ag-charts-types';

import type { Series } from './series';

export interface RadialGaugeSeries extends Series<any, any> {
    centerX: number;
    centerY: number;
    radius: number;
    textAlign: TextAlign;
    verticalAlign: VerticalAlign;
}
