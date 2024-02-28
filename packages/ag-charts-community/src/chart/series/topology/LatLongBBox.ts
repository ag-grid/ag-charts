export class LatLongBBox {
    constructor(
        public lat0: number,
        public lon0: number,
        public lat1: number,
        public lon1: number
    ) {}

    merge(other: LatLongBBox) {
        this.lat0 = Math.min(this.lat0, other.lat0);
        this.lon0 = Math.min(this.lon0, other.lon0);
        this.lat1 = Math.max(this.lat1, other.lat1);
        this.lon1 = Math.max(this.lon1, other.lon1);
    }
}
