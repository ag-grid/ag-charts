import { type AgMarkerShapeFnParams } from 'ag-charts-community';

export function lineMarker({ path, x, y, size }: AgMarkerShapeFnParams) {
    path.moveTo(x, y - size / 2);
    path.lineTo(x, y + size / 2);
}
