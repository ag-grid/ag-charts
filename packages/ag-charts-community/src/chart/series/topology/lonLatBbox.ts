export class LonLatBBox {
    constructor(
        public lon0: number,
        public lat0: number,
        public lon1: number,
        public lat1: number
    ) {}

    extend(lon0: number, lat0: number, lon1: number, lat1: number) {
        this.lon0 = Math.min(this.lon0, lon0);
        this.lat0 = Math.min(this.lat0, lat0);
        this.lon1 = Math.max(this.lon1, lon1);
        this.lat1 = Math.max(this.lat1, lat1);
        return this;
    }

    merge(other: LonLatBBox) {
        return this.extend(other.lon0, other.lat0, other.lon1, other.lat1);
    }

    static extend(into: LonLatBBox | undefined, lon0: number, lat0: number, lon1: number, lat1: number): LonLatBBox {
        return into ? into.extend(lon0, lat0, lon1, lat1) : new LonLatBBox(lon0, lat0, lon1, lat1);
    }
}
