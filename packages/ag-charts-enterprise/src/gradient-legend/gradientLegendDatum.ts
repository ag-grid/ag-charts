import type { _ModuleSupport } from 'ag-charts-community';

export interface GradientLegendDatum extends _ModuleSupport.ChartLegendDatum {
    legendType: 'gradient';
    enabled: boolean;
    seriesId: string;
    colorName?: string;
    colorDomain: number[];
    colorRange: string[];
}
