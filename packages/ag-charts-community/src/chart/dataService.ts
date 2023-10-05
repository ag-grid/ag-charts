export class DataService<TSeries> {
    constructor(readonly getSeries: () => TSeries[]) {}
}
