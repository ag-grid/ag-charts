import { _ModuleSupport } from 'ag-charts-community';
import type { AgMarkerShapeFnParams } from 'ag-charts-community';
import { clamp } from 'ag-charts-core';

const { Marker } = _ModuleSupport;

export function lineMarker({ path, x, y, size }: AgMarkerShapeFnParams) {
    path.moveTo(x, y - size / 2);
    path.lineTo(x, y + size / 2);
}

export class LineMarker<D = unknown> extends Marker<D> {
    // The generic Marker hit-test models every marker as a circle of radius size/2, highlighting a
    // large empty area around a thin line; hit-test against the segment itself instead.
    protected override distanceSquaredLocal(x: number, y: number): number {
        if (this.shape !== lineMarker) {
            return super.distanceSquaredLocal(x, y);
        }

        const half = this.size / 2;
        const dy = y - clamp(-half, y, half);
        const tolerance = this.strokeWidth / 2;
        return Math.max(x * x + dy * dy - tolerance * tolerance, 0);
    }
}
