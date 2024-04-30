export declare class LonLatBBox {
    lon0: number;
    lat0: number;
    lon1: number;
    lat1: number;
    constructor(lon0: number, lat0: number, lon1: number, lat1: number);
    merge(other: LonLatBBox): void;
}
