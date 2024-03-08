export class LonLatBBox {
    constructor(
        public lon0: number,
        public lat0: number,
        public lon1: number,
        public lat1: number
    ) {}

    merge(other: LonLatBBox) {
        this.lon0 = Math.min(this.lon0, other.lon0);
        this.lat0 = Math.min(this.lat0, other.lat0);
        this.lon1 = Math.max(this.lon1, other.lon1);
        this.lat1 = Math.max(this.lat1, other.lat1);
    }
}
