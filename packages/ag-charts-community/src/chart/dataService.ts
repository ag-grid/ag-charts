import type { Series } from './series/series';

export class DataService {
    constructor(readonly getSeries: () => Series<any>[]) {}
}
