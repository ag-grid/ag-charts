import { Marker } from './marker';

export class Star extends Marker {
    static override readonly className = 'Star';

    override updatePath() {
        const { path, x, y } = this;
        const s = this.size;

        path.clear();

        path.moveTo(x, y + (0.5 - 1) * s);
        path.lineTo(x + (1.11226 - 1) * s, y + (0.845491 - 1) * s);
        path.lineTo(x + (1.47553 - 1) * s, y + (0.845491 - 1) * s);
        path.lineTo(x + (1.18164 - 1) * s, y + (1.05902 - 1) * s);
        path.lineTo(x + (1.29389 - 1) * s, y + (1.40451 - 1) * s);
        path.lineTo(x, y + (1.19098 - 1) * s);
        path.lineTo(x + (0.706107 - 1) * s, y + (1.40451 - 1) * s);
        path.lineTo(x + (0.818364 - 1) * s, y + (1.05902 - 1) * s);
        path.lineTo(x + (0.524472 - 1) * s, y + (0.845491 - 1) * s);
        path.lineTo(x + (0.887743 - 1) * s, y + (0.845491 - 1) * s);
        path.closePath();
    }
}
