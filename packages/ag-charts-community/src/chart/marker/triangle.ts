import type { MarkerPathMove } from './marker';
import { Marker } from './marker';

export class Triangle extends Marker {
    static override className = 'Triangle';

    static moves: MarkerPathMove[] = [
        { x: 0, y: -0.48, t: 'move' },
        { x: 0.5, y: 0.87 },
        { x: -1, y: 0 },
    ];

    override updatePath() {
        const s = this.size * 1.1;

        super.applyPath(s, Triangle.moves);
    }
}
