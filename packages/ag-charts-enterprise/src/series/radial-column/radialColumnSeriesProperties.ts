import type { AgBaseRadialColumnSeriesOptions } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';

import { RadialColumnSeriesBaseProperties } from './radialColumnSeriesBaseProperties';

const { Validate, RATIO } = _ModuleSupport;

export class RadialColumnSeriesProperties<
    T extends AgBaseRadialColumnSeriesOptions,
> extends RadialColumnSeriesBaseProperties<T> {
    @Validate(RATIO, { optional: true })
    columnWidthRatio?: number;

    @Validate(RATIO, { optional: true })
    maxColumnWidthRatio?: number;
}
