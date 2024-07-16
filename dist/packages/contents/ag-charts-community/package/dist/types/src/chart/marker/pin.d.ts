import { Marker } from './marker';
export declare class Pin extends Marker {
    static readonly className = "MapPin";
    static center: {
        x: number;
        y: number;
    };
    updatePath(): void;
}
