import type { _Scale } from 'ag-charts-community';
import { _Scene } from 'ag-charts-community';

export type ErrorBarNodeProperties = {
    visible?: boolean;
    stroke?: string;
    strokeWidth?: number;
    strokeOpacity?: number;
};

export interface ErrorBarPoints {
    readonly yLowerPoint: _Scene.Point;
    readonly yUpperPoint: _Scene.Point;
}

export class ErrorBarNode extends _Scene.Group {
    private points: ErrorBarPoints = { yLowerPoint: { x: 0, y: 0 }, yUpperPoint: { x: 0, y: 0 } };
    private whiskerPath: _Scene.Path;
    private capsPath: _Scene.Path;

    constructor() {
        super();
        this.whiskerPath = new _Scene.Path();
        this.capsPath = new _Scene.Path();
        this.append([this.whiskerPath, this.capsPath]);
    }

    update(points: ErrorBarPoints, whiskerTheme: ErrorBarNodeProperties, capsTheme: ErrorBarNodeProperties) {
        this.points = points;
        Object.assign(this.whiskerPath, whiskerTheme);
        Object.assign(this.capsPath, capsTheme);

        const { yLowerPoint, yUpperPoint } = this.points;

        const whisker = this.whiskerPath;
        whisker.path.clear();
        whisker.path.moveTo(yLowerPoint.x, yLowerPoint.y);
        whisker.path.lineTo(yUpperPoint.x, yUpperPoint.y);
        whisker.path.closePath();
        whisker.updatePath();

        const capLength = 5;
        const caps = this.capsPath;
        caps.path.clear();
        caps.path.moveTo(yLowerPoint.x - capLength, yLowerPoint.y);
        caps.path.lineTo(yLowerPoint.x + capLength, yLowerPoint.y);
        caps.path.moveTo(yUpperPoint.x - capLength, yUpperPoint.y);
        caps.path.lineTo(yUpperPoint.x + capLength, yUpperPoint.y);
        caps.path.closePath();
        caps.updatePath();
    }
}
