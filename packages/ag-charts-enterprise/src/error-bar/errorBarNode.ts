import type { _Scale } from 'ag-charts-community';
import { _Scene } from 'ag-charts-community';

export type ErrorBarNodeProperties = {
    visible: boolean;
    stroke?: string;
    strokeWidth: number;
    strokeOpacity: number;
};

interface ErrorBarCapExclusiveOptions {
    lengthRatio: number;
}

export interface ErrorBarPoints {
    readonly yLowerPoint: _Scene.Point;
    readonly yUpperPoint: _Scene.Point;
}

export class ErrorBarNode extends _Scene.Path {
    private points: ErrorBarPoints = { yLowerPoint: { x: 0, y: 0 }, yUpperPoint: { x: 0, y: 0 } };

    updateData(
        points: ErrorBarPoints,
        capOpts: ErrorBarCapExclusiveOptions,
        capTheme: ErrorBarNodeProperties,
        whiskerTheme: ErrorBarNodeProperties
    ) {
        // Mute unused variables (cap not yet implemented)
        capOpts as any;
        capTheme as any;

        this.points = points;
        Object.assign(this, whiskerTheme);
    }

    updatePath() {
        const { path } = this;
        const { yLowerPoint, yUpperPoint } = this.points;

        path.clear();
        path.moveTo(yLowerPoint.x, yLowerPoint.y);
        path.lineTo(yUpperPoint.x, yUpperPoint.y);
        path.closePath();
    }
}
