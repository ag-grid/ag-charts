import { ArrowUp } from './arrowUp';
import { Marker } from './marker';

export class ArrowDown extends Marker {
    static readonly className = 'ArrowDown';

    override updatePath() {
        const s = this.size / 2;

        super.applyPath(
            s,
            ArrowUp.moves.map((m) => ({ x: m.x * -1, y: m.y * -1 }))
        );
    }
}
