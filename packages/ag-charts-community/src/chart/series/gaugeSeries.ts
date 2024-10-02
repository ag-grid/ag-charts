import type { TextAlign, VerticalAlign } from 'ag-charts-types';

import type { ChartAxisDirection } from '../chartAxisDirection';
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
    readonly maximumRadius: number | undefined;
    readonly minimumRadius: number | undefined;
}

export interface LinearGaugeSeries extends GaugeSeries {
    originX: number;
    originY: number;
    readonly horizontal: boolean;
    readonly thickness: number;
    // Negative numbers for leading inset, positive for trailing
    computeInset(direction: ChartAxisDirection, ticks: number[]): number;
}
