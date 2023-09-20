import type { _Scale } from 'ag-charts-community';
import { _Scene } from 'ag-charts-community';

export interface ErrorBarPoints {
    readonly yLowerPoint: _Scene.Point;
    readonly yUpperPoint: _Scene.Point;
}

export class ErrorBarNode extends _Scene.Path {
    public points: ErrorBarPoints = { yLowerPoint: { x: 0, y: 0 }, yUpperPoint: { x: 0, y: 0 } };

    updatePath() {
        // TODO(olegat) implement, this is just placeholder draw code
        const { path } = this;
        this.fill = 'black';
        this.stroke = 'black';
        this.strokeWidth = 1;
        this.fillOpacity = 1;
        this.strokeOpacity = 1;

        const { yLowerPoint, yUpperPoint } = this.points;

        path.clear();
        path.moveTo(yLowerPoint.x, yLowerPoint.y);
        path.lineTo(yUpperPoint.x, yUpperPoint.y);
        path.closePath();
    }
}
