import { Marker } from './marker';

export class Star extends Marker {
    static readonly className = 'Star';

    override updatePath() {
        const { x, y, path, size } = this;
        const spikes = 5;
        const outerRadius = size / 2;
        const innerRadius = outerRadius / 2;
        const rotation = Math.PI / 2;

        path.clear();
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / spikes - rotation;
            const xCoordinate = x + Math.cos(angle) * radius;
            const yCoordinate = y + Math.sin(angle) * radius;
            path.lineTo(xCoordinate, yCoordinate);
        }
        path.closePath();
    }
}
