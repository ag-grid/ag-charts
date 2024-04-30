import type { AgBaseRadialColumnSeriesOptions } from 'ag-charts-community';
import { RadialColumnSeriesBaseProperties } from './radialColumnSeriesBaseProperties';
export declare class RadialColumnSeriesProperties<T extends AgBaseRadialColumnSeriesOptions> extends RadialColumnSeriesBaseProperties<T> {
    columnWidthRatio?: number;
    maxColumnWidthRatio?: number;
}
