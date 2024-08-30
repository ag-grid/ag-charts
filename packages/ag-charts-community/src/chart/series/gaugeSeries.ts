import type { TextAlign, VerticalAlign } from 'ag-charts-types';

import type { Series } from './series';

export interface GaugeSeries extends Series<any, any> {
    getCaptionText(): string;
}

export interface RadialGaugeSeries extends GaugeSeries {
    centerX: number;
    centerY: number;
    radius: number;
    textAlign: TextAlign;
    verticalAlign: VerticalAlign;
}
