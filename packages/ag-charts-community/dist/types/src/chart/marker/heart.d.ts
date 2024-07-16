import { Marker } from './marker';
export declare class Heart extends Marker {
    static readonly className = "Heart";
    rad(degree: number): number;
    updatePath(): void;
}
