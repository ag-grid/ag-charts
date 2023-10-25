import type { AgErrorBarFormatterParams, AgErrorBarOptions, AgErrorBarThemeableOptions } from 'ag-charts-community';
import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';
import type { InteractionRange } from 'ag-charts-community';

const { partialAssign, mergeDefaults } = _ModuleSupport;

export type ErrorBarNodeDatum = _ModuleSupport.CartesianSeriesNodeDatum & _ModuleSupport.ErrorBoundSeriesNodeDatum;

interface ErrorBarPoint {
    readonly lowerPoint: _Scene.Point;
    readonly upperPoint: _Scene.Point;
}

export interface ErrorBarPoints {
    readonly xBar?: ErrorBarPoint;
    readonly yBar?: ErrorBarPoint;
}

export type ErrorBarStylingOptions = Omit<AgErrorBarThemeableOptions, 'cap'>;
export type ErrorBarFormatter = (params: AgErrorBarFormatterParams) => AgErrorBarOptions | undefined;
export type ErrorBarCapFormatter = (params: AgErrorBarFormatterParams) => AgErrorBarOptions['cap'] | undefined;
export type ErrorBarDataOptions = Pick<
    AgErrorBarOptions,
    'xLowerKey' | 'xLowerName' | 'xUpperKey' | 'xUpperName' | 'yLowerKey' | 'yLowerName' | 'yUpperKey' | 'yUpperName'
>;

type CapDefaults = NonNullable<ErrorBarNodeDatum['capDefaults']>;
type CapOptions = NonNullable<AgErrorBarThemeableOptions['cap']>;
type CapLengthOptions = Pick<CapOptions, 'length' | 'lengthRatio'>;

export class ErrorBarNode extends _Scene.Group {
    private whiskerPath: _Scene.Path;
    private capsPath: _Scene.Path;

    private bboxes: {
        // ErrorBarNode can include up to 6 bboxes in total (2 whiskers, 4 caps). This is expensive hit
        // testing, therefore we'll use a hierachial bbox structure: `union` is the bbox that includes
        // all the components.
        union: _Scene.BBox;
        components: _Scene.BBox[];
    } = { union: this.computeBBox(), components: [] };

    protected override _datum?: ErrorBarNodeDatum;
    public override get datum(): ErrorBarNodeDatum | undefined {
        return this._datum;
    }
    public override set datum(datum: ErrorBarNodeDatum | undefined) {
        this._datum = datum;
    }

    constructor() {
        super();
        this.whiskerPath = new _Scene.Path();
        this.capsPath = new _Scene.Path();
        this.append([this.whiskerPath, this.capsPath]);
    }

    private calculateCapLength(capsTheme: CapLengthOptions, capDefaults: CapDefaults): number {
        // Order of priorities for determining the length of the cap:
        // 1.  User-defined length (pixels).
        // 2.  User-defined lengthRatio.
        // 3.  Library default (defined by underlying series).
        const { lengthRatio = 1, length } = capsTheme;
        const { lengthRatioMultiplier, lengthMax } = capDefaults;
        const desiredLength = length ?? lengthRatio * lengthRatioMultiplier;
        return Math.min(desiredLength, lengthMax);
    }

    private getFormatterParams(
        formatters: { formatter?: ErrorBarFormatter; cap: { formatter?: ErrorBarCapFormatter } } & ErrorBarDataOptions
    ): AgErrorBarFormatterParams | undefined {
        const { datum } = this;
        if (datum === undefined || (formatters.formatter === undefined && formatters.cap.formatter === undefined)) {
            return undefined;
        }
        const { xLowerKey, xLowerName, xUpperKey, xUpperName, yLowerKey, yLowerName, yUpperKey, yUpperName } =
            formatters;
        return {
            datum: datum.datum,
            seriesId: datum.datum.seriesId,
            xKey: datum.xKey,
            yKey: datum.yKey,
            xLowerKey,
            xLowerName,
            xUpperKey,
            xUpperName,
            yLowerKey,
            yLowerName,
            yUpperKey,
            yUpperName,
        };
    }

    private applyStyling(target: ErrorBarStylingOptions, source?: ErrorBarStylingOptions) {
        // Style can be any object, including user data (e.g. formatter
        // result). So filter out anything that isn't styling options:
        partialAssign(
            ['visible', 'stroke', 'strokeWidth', 'strokeOpacity', 'lineDash', 'lineDashOffset'],
            target,
            source
        );
    }

    updateStyle(
        style: AgErrorBarThemeableOptions,
        formatters: { formatter?: ErrorBarFormatter; cap: { formatter?: ErrorBarCapFormatter } }
    ) {
        const { cap, ...whiskerStyleOptions } = style;
        const { length, lengthRatio, ...capsStyleOptions } = cap ?? {};
        let whiskerStyle = whiskerStyleOptions;
        let capsStyle = capsStyleOptions;

        const params = this.getFormatterParams(formatters);
        if (params !== undefined) {
            if (formatters.formatter !== undefined) {
                const result = formatters.formatter(params);
                whiskerStyle = mergeDefaults(result, whiskerStyle);
                capsStyle = mergeDefaults(result, capsStyle);
            }

            if (formatters.cap.formatter !== undefined) {
                const result = formatters.cap.formatter(params);
                capsStyle = mergeDefaults(result, capsStyle);
            }
        }

        const { whiskerPath, capsPath } = this;
        this.applyStyling(whiskerPath, whiskerStyle);
        this.applyStyling(capsPath, capsStyle);
        whiskerPath.markDirty(whiskerPath, _Scene.RedrawType.MINOR);
        capsPath.markDirty(capsPath, _Scene.RedrawType.MINOR);
    }

    updateTranslation(cap: CapLengthOptions, range: InteractionRange) {
        // Note: The method always uses the RedrawType.MAJOR mode for simplicity.
        // This could be optimised to reduce a amount of unnecessary redraws.
        if (this.datum === undefined) {
            return;
        }
        const { xBar, yBar, capDefaults } = this.datum;

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

        const { components } = this.bboxes;
        components.length = 0;
        if (yBar !== undefined) {
            const whiskerHeight = yBar.lowerPoint.y - yBar.upperPoint.y;
            components.push(
                new _Scene.BBox(yBar.lowerPoint.x, yBar.upperPoint.y, whisker.strokeWidth, whiskerHeight),
                new _Scene.BBox(yBar.lowerPoint.x - capOffset, yBar.lowerPoint.y, capLength, caps.strokeWidth),
                new _Scene.BBox(yBar.upperPoint.x - capOffset, yBar.upperPoint.y, capLength, caps.strokeWidth)
            );
        }
        if (xBar !== undefined) {
            const whiskerWidth = xBar.upperPoint.x - xBar.lowerPoint.x;
            components.push(
                new _Scene.BBox(xBar.lowerPoint.x, xBar.upperPoint.y, whiskerWidth, whisker.strokeWidth),
                new _Scene.BBox(xBar.lowerPoint.x, xBar.lowerPoint.y - capOffset, caps.strokeWidth, capLength),
                new _Scene.BBox(xBar.upperPoint.x, xBar.upperPoint.y - capOffset, caps.strokeWidth, capLength)
            );
        }
        const expansion = typeof range === 'string' ? 0 : range;
        if (expansion > 0) {
            for (const bbox of components) {
                bbox.grow({ top: expansion, bottom: expansion, left: expansion, right: expansion });
            }
        }
        this.bboxes.union = _Scene.BBox.merge(components);
    }

    override pickNode(x: number, y: number): _Scene.Node | undefined {
        const point = this.transformPoint(x, y);
        if (this.containsPoint(point.x, point.y)) {
            return this;
        }
    }

    override containsPoint(x: number, y: number): boolean {
        if (!this.bboxes.union.containsPoint(x, y)) {
            return false;
        }

        for (const bbox of this.bboxes.components) {
            if (bbox.containsPoint(x, y)) {
                return true;
            }
        }

        return false;
    }
}
