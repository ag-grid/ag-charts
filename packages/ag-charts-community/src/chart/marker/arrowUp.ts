import type { MarkerPathMove } from './marker';
import { Marker } from './marker';

export class ArrowUp extends Marker {
    static readonly className = 'ArrowUp';

    static readonly moves: MarkerPathMove[] = [
        { x: 0, y: 0, t: 'move' },
        { x: 1, y: 1.2 },
        { x: -0.5, y: 0 },
        { x: 0, y: 0.8 },
        { x: -1, y: 0 },
        { x: 0, y: -0.8 },
        { x: -0.5, y: 0 },
    ];

    override updatePath() {
        const s = this.size / 2;

        super.applyPath(s, ArrowUp.moves);
    }
}
