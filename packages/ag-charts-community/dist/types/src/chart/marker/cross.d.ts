import type { MarkerPathMove } from './marker';
import { Marker } from './marker';
export declare class Cross extends Marker {
    static readonly className = "Cross";
    static moves: MarkerPathMove[];
    updatePath(): void;
}
