import type { ChartLegendDatum, ChartLegendType } from './legendDatum';

interface Series {
    id: string;
    type: string;
    getLegendData(legendType: ChartLegendType): ChartLegendDatum[];
}

type SeriesGetter = () => Series[];

export class DataService {
    readonly getSeries: SeriesGetter;

    constructor(getSeries: SeriesGetter) {
        this.getSeries = getSeries;
    }
}
