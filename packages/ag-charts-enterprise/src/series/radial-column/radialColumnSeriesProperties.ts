import type { AgBaseRadialColumnSeriesOptions } from 'ag-charts-community';
import { Property } from 'ag-charts-core';

import { RadialColumnSeriesBaseProperties } from './radialColumnSeriesBaseProperties';

export class RadialColumnSeriesProperties<
    T extends AgBaseRadialColumnSeriesOptions,
> extends RadialColumnSeriesBaseProperties<T> {
    @Property
    columnWidthRatio?: number;

    @Property
    maxColumnWidthRatio?: number;
}
