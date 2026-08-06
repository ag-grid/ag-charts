import type { AxisID, Scale } from 'ag-charts-core';
import type { AgTimeInterval, AgTimeIntervalUnit, AxisValue, CssColor, Degree, FontFamily } from 'ag-charts-types';

import type { Group } from '../../scene/group';

export interface BackgroundRegion {
    fill?: CssColor;
    label?: BackgroundRegionLabel;
    labelGroup: Group;
    regionGroup: Group;
    xRange?: BackgroundRegionRange;
    xScale?: Scale<any, number, number | AgTimeInterval | AgTimeIntervalUnit>;
    yRange?: BackgroundRegionRange;
    yScale?: Scale<any, number, number | AgTimeInterval | AgTimeIntervalUnit>;
    update(visible: boolean): void;
    set(properties: object): void;
}

export interface BackgroundRegionLabel {
    fontFamily?: FontFamily;
    position?: string;
    rotation?: Degree;
    text?: string;
}

export interface BackgroundRegionRange {
    axis?: AxisID;
    start?: AxisValue;
    end?: AxisValue;
}
