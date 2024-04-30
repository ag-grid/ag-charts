import type { MarkerPathMove } from './marker';
import { Marker } from './marker';
export declare class Diamond extends Marker {
    static readonly className = "Diamond";
    static moves: MarkerPathMove[];
    updatePath(): void;
}
