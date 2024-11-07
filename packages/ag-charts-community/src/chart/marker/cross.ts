import type { MarkerPathMove } from './marker';
import { Marker } from './marker';

export class Cross extends Marker {
    static readonly className = 'Cross';

    private static readonly moves: MarkerPathMove[] = [
        { x: -1, y: 0, t: 'move' },
        { x: -1, y: -1 },
        { x: +1, y: -1 },
        { x: +1, y: +1 },
        { x: +1, y: -1 },
        { x: +1, y: +1 },
        { x: -1, y: +1 },
        { x: +1, y: +1 },
        { x: -1, y: +1 },
        { x: -1, y: -1 },
        { x: -1, y: +1 },
        { x: -1, y: -1 },
    ];

    override updatePath() {
        const s = this.size / 4.2;

        super.applyPath(s, Cross.moves);
    }
}
