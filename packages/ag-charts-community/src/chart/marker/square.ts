import { Marker } from './marker';

export class Square extends Marker {
    static override readonly className = 'Square';

    override updatePath() {
        const { path, x, y } = this;
        const hs = this.size / 2;

        path.clear();

        path.moveTo(this.align(x - hs), this.align(y - hs));
        path.lineTo(this.align(x + hs), this.align(y - hs));
        path.lineTo(this.align(x + hs), this.align(y + hs));
        path.lineTo(this.align(x - hs), this.align(y + hs));
        path.closePath();
    }
}
