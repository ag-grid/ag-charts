import type { AgBaseRadialColumnSeriesOptions } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';

import { RadialColumnSeriesBaseProperties } from './radialColumnSeriesBaseProperties';

const { Property } = _ModuleSupport;

export class RadialColumnSeriesProperties<
    T extends AgBaseRadialColumnSeriesOptions<unknown>,
> extends RadialColumnSeriesBaseProperties<T> {
    @Property
    columnWidthRatio?: number;

    @Property
    maxColumnWidthRatio?: number;
}
