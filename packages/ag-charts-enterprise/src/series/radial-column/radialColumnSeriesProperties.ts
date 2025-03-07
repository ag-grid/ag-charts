import type { AgBaseRadialColumnSeriesOptions } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';

import { RadialColumnSeriesBaseProperties } from './radialColumnSeriesBaseProperties';

const { TempValidate, RATIO } = _ModuleSupport;

export class RadialColumnSeriesProperties<
    T extends AgBaseRadialColumnSeriesOptions,
> extends RadialColumnSeriesBaseProperties<T> {
    @TempValidate(RATIO, { optional: true })
    columnWidthRatio?: number;

    @TempValidate(RATIO, { optional: true })
    maxColumnWidthRatio?: number;
}
