import { Marker } from 'ag-charts-community';

export class LineMarker extends Marker {
    static readonly className = 'LineMarker';

    override updatePath() {
        const { x, y, path, size } = this;

        path.clear();
        path.moveTo(x, y - size / 2);
        path.lineTo(x, y + size / 2);
    }
}
