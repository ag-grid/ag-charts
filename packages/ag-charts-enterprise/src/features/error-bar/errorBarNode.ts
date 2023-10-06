import type { _Scale } from 'ag-charts-community';
import { _Scene } from 'ag-charts-community';

export type ErrorBarNodeProperties = {
    visible?: boolean;
    stroke?: string;
    strokeWidth?: number;
    strokeOpacity?: number;
};

interface ErrorBarPoint {
    readonly lowerPoint: _Scene.Point;
    readonly upperPoint: _Scene.Point;
}

export interface ErrorBarPoints {
    readonly xBar?: ErrorBarPoint;
    readonly yBar?: ErrorBarPoint;
}

export class ErrorBarNode extends _Scene.Group {
    private points: ErrorBarPoints = {
        xBar: {
            lowerPoint: { x: 0, y: 0 },
            upperPoint: { x: 0, y: 0 },
        },
        yBar: {
            lowerPoint: { x: 0, y: 0 },
            upperPoint: { x: 0, y: 0 },
        },
    };
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

        const { xBar, yBar } = this.points;

        const whisker = this.whiskerPath;
        whisker.path.clear();
        if (yBar !== undefined) {
            whisker.path.moveTo(yBar.lowerPoint.x, yBar.lowerPoint.y);
            whisker.path.lineTo(yBar.upperPoint.x, yBar.upperPoint.y);
        }
        if (xBar !== undefined) {
            whisker.path.moveTo(xBar.lowerPoint.x, xBar.lowerPoint.y);
            whisker.path.lineTo(xBar.upperPoint.x, xBar.upperPoint.y);
        }
        whisker.path.closePath();
        whisker.updatePath();

        const capLength = 5;
        const caps = this.capsPath;
        caps.path.clear();
        if (yBar !== undefined) {
            caps.path.moveTo(yBar.lowerPoint.x - capLength, yBar.lowerPoint.y);
            caps.path.lineTo(yBar.lowerPoint.x + capLength, yBar.lowerPoint.y);
            caps.path.moveTo(yBar.upperPoint.x - capLength, yBar.upperPoint.y);
            caps.path.lineTo(yBar.upperPoint.x + capLength, yBar.upperPoint.y);
        }
        if (xBar !== undefined) {
            caps.path.moveTo(xBar.lowerPoint.x, xBar.lowerPoint.y - capLength);
            caps.path.lineTo(xBar.lowerPoint.x, xBar.lowerPoint.y + capLength);
            caps.path.moveTo(xBar.upperPoint.x, xBar.upperPoint.y - capLength);
            caps.path.lineTo(xBar.upperPoint.x, xBar.upperPoint.y + capLength);
        }
        caps.path.closePath();
        caps.updatePath();
    }
}
