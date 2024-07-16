import type { MarkerPathMove } from './marker';
import { Marker } from './marker';
export declare class Triangle extends Marker {
    static readonly className = "Triangle";
    static moves: MarkerPathMove[];
    updatePath(): void;
}
