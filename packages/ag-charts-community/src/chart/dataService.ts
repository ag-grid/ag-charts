interface Series {
    id: string;
    type: string;
    axes: { y: { id: string }; x: { id: string } };
    getLegendData(): any[];
}

type SeriesGetter = () => Series[];

export class DataService {
    readonly getSeries: SeriesGetter;

    constructor(getSeries: SeriesGetter) {
        this.getSeries = getSeries;
    }
}
