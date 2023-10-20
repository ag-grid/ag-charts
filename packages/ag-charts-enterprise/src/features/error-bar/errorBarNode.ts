import type { AgErrorBarCapLengthOptions, AgErrorBarThemeableOptions, _ModuleSupport } from 'ag-charts-community';
import { _Scene } from 'ag-charts-community';

export type ErrorBoundSeriesNodeDatum = _ModuleSupport.ErrorBoundSeriesNodeDatum;

interface ErrorBarPoint {
    readonly lowerPoint: _Scene.Point;
    readonly upperPoint: _Scene.Point;
}

export interface ErrorBarPoints {
    readonly xBar?: ErrorBarPoint;
    readonly yBar?: ErrorBarPoint;
}

type CapDefaults = ErrorBoundSeriesNodeDatum['capDefaults'];

export class ErrorBarNode extends _Scene.Group {
    private whiskerPath: _Scene.Path;
    private capsPath: _Scene.Path;

    constructor() {
        super();
        this.whiskerPath = new _Scene.Path();
        this.capsPath = new _Scene.Path();
        this.append([this.whiskerPath, this.capsPath]);
    }

    private calculateCapLength(capsTheme: AgErrorBarCapLengthOptions, capDefaults: CapDefaults): number {
        // Order of priorities for determining the length of the cap:
        // 1.  User-defined length (pixels).
        // 2.  User-defined lengthRatio.
        // 3.  Library default (defined by underlying series).
        const { lengthRatio = 1, length } = capsTheme;
        const { lengthRatioMultiplier, lengthMax } = capDefaults;
        const desiredLength = length ?? lengthRatio * lengthRatioMultiplier;
        return Math.min(desiredLength, lengthMax);
    }

    updateStyle(style: AgErrorBarThemeableOptions) {
        const { whiskerPath, capsPath } = this;
        const { cap, ...whiskerStyle } = style;
        const { length, lengthRatio, ...capsStyle } = cap ?? {};
        Object.assign(whiskerPath, whiskerStyle);
        Object.assign(capsPath, capsStyle);
        whiskerPath.markDirty(whiskerPath, _Scene.RedrawType.MINOR);
        capsPath.markDirty(capsPath, _Scene.RedrawType.MINOR);
    }

    updateTranslation(points: ErrorBarPoints, cap: AgErrorBarCapLengthOptions, capDefaults: CapDefaults) {
        // Note: The method always uses the RedrawType.MAJOR mode for simplicity.
        // This could be optimised to reduce a amount of unnecessary redraws.
        const { xBar, yBar } = points;

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
        whisker.markDirtyTransform();

        // Errorbar caps stretch out pendicular to the whisker equally on both
        // sides, so we want the offset to be half of the total length.
        const capLength = this.calculateCapLength(cap, capDefaults);
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
        caps.markDirtyTransform();
    }
}
