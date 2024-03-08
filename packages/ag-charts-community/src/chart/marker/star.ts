import { Marker } from './marker';

export class Star extends Marker {
    static override readonly className = 'Star';

    override updatePath() {
        const { x, y, path, size } = this;
        const spikes = 5;
        const innerRadius = size / 2;
        const rotation = Math.PI / 2;

        path.clear();
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? size : innerRadius;
            const angle = (i * Math.PI) / spikes - rotation;
            const xCoordinate = x + Math.cos(angle) * radius;
            const yCoordinate = y + Math.sin(angle) * radius;
            path.lineTo(xCoordinate, yCoordinate);
        }
        path.closePath();
    }
}
