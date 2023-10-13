import type { _ModuleSupport } from 'ag-charts-community';
import type { _Scale } from 'ag-charts-community';
import { _Scene } from 'ag-charts-community';

export interface ErrorBarWhiskerTheme {
    visible?: boolean;
    stroke?: string;
    strokeWidth?: number;
    strokeOpacity?: number;
}

export interface ErrorBarCapTheme extends ErrorBarWhiskerTheme {
    length?: number;
    lengthRatio?: number;
}

interface ErrorBarPoint {
    readonly lowerPoint: _Scene.Point;
    readonly upperPoint: _Scene.Point;
}

export interface ErrorBarPoints {
    readonly xBar?: ErrorBarPoint;
    readonly yBar?: ErrorBarPoint;
}

type CapDefaults = _ModuleSupport.ErrorBoundSeriesNodeDatum['capDefaults'];

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

    private calculateCapLength(capsTheme: ErrorBarCapTheme, capDefaults: CapDefaults): number {
        // Order of priorities for determining the length of the cap:
        // 1.  User-defined length (pixels).
        // 2.  User-defined lengthRatio.
        // 3.  Library default (defined by underlying series).
        let desiredLength: number;
        if (capsTheme.length !== undefined) {
            desiredLength = capsTheme.length;
        } else if (capsTheme.lengthRatio !== undefined) {
            desiredLength = capsTheme.lengthRatio * capDefaults.lengthRatioMultiplier;
        } else {
            desiredLength = capDefaults.lengthRatio * capDefaults.lengthRatioMultiplier;
        }

        return Math.min(desiredLength, capDefaults.lengthMax);
    }

    update(
        points: ErrorBarPoints,
        whiskerTheme: ErrorBarWhiskerTheme,
        capsTheme: ErrorBarCapTheme,
        capDefaults: CapDefaults
    ) {
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

        // Errorbar caps stretch out pendicular to the whisker equally on both
        // sides, so we want the offset to be half of the total length.
        const capLength = this.calculateCapLength(capsTheme, capDefaults);
        const capOffset = capLength / 2;
        const caps = this.capsPath;
        caps.path.clear();
        if (yBar !== undefined) {
            caps.path.moveTo(yBar.lowerPoint.x - capOffset, yBar.lowerPoint.y);
            caps.path.lineTo(yBar.lowerPoint.x + capOffset, yBar.lowerPoint.y);
            caps.path.moveTo(yBar.upperPoint.x - capOffset, yBar.upperPoint.y);
            caps.path.lineTo(yBar.upperPoint.x + capOffset, yBar.upperPoint.y);
        }
        if (xBar !== undefined) {
            caps.path.moveTo(xBar.lowerPoint.x, xBar.lowerPoint.y - capOffset);
            caps.path.lineTo(xBar.lowerPoint.x, xBar.lowerPoint.y + capOffset);
            caps.path.moveTo(xBar.upperPoint.x, xBar.upperPoint.y - capOffset);
            caps.path.lineTo(xBar.upperPoint.x, xBar.upperPoint.y + capOffset);
        }
        caps.path.closePath();
        caps.updatePath();
    }
}
