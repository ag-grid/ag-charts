import type { BaseChartLegendDatum, ChartLegendDatum, ChartLegendType } from './legendDatum';

interface Series {
    id: string;
    type: string;
    getLegendData<T extends ChartLegendType>(legendType: T): ChartLegendDatum<T>[];
    getLegendData(legendType: ChartLegendType): BaseChartLegendDatum[];
}

type SeriesGetter = () => Series[];

export class DataService {
    readonly getSeries: SeriesGetter;

    constructor(getSeries: SeriesGetter) {
        this.getSeries = getSeries;
    }
}
