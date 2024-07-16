import type { MarkerPathMove } from './marker';
import { Marker } from './marker';
export declare class Plus extends Marker {
    static readonly className = "Plus";
    static moves: MarkerPathMove[];
    updatePath(): void;
}
