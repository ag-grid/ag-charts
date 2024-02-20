import type { AgErrorBarFormatterParams, AgErrorBarOptions, AgErrorBarThemeableOptions } from 'ag-charts-community';
import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

const { partialAssign, mergeDefaults } = _ModuleSupport;
const { BBox } = _Scene;
type BBox = _Scene.BBox;
type Point = _Scene.Point;
type NearestResult<T> = _Scene.NearestResult<T>;

export type ErrorBarNodeDatum = _ModuleSupport.CartesianSeriesNodeDatum & _ModuleSupport.ErrorBoundSeriesNodeDatum;
export type ErrorBarStylingOptions = Omit<AgErrorBarThemeableOptions, 'cap'>;

export type ErrorBarFormatter = NonNullable<AgErrorBarOptions['formatter']>;
export type ErrorBarCapFormatter = NonNullable<NonNullable<AgErrorBarOptions['cap']>['formatter']>;

type ErrorBarDataOptions = Pick<
    AgErrorBarOptions,
    'xLowerKey' | 'xLowerName' | 'xUpperKey' | 'xUpperName' | 'yLowerKey' | 'yLowerName' | 'yUpperKey' | 'yUpperName'
>;

type Formatters = {
    formatter?: ErrorBarFormatter;
    cap: { formatter?: ErrorBarCapFormatter };
} & ErrorBarDataOptions;

type CapDefaults = NonNullable<ErrorBarNodeDatum['capDefaults']>;
type CapOptions = NonNullable<AgErrorBarThemeableOptions['cap']>;
type CapLengthOptions = Pick<CapOptions, 'length' | 'lengthRatio'>;

class HierarchicalBBox {
    // ErrorBarNode can include up to 6 bboxes in total (2 whiskers, 4 caps). This is expensive hit
    // testing, therefore we'll use a hierarchical bbox structure: `union` is the bbox that includes
    // all the components.
    public union: BBox;
    public components: BBox[];

    constructor(components: BBox[]) {
        this.components = components;
        this.union = BBox.merge(components);
    }

    public containsPoint(x: number, y: number) {
        if (!this.union.containsPoint(x, y)) {
            return false;
        }

        for (const bbox of this.components) {
            if (bbox.containsPoint(x, y)) {
                return true;
            }
        }

        return false;
    }
}

export class ErrorBarNode extends _Scene.Group {
    private whiskerPath: _Scene.Path;
    private capsPath: _Scene.Path;
    private capLength: number = NaN;

    // The ErrorBarNode does not need to handle the 'nearest' interaction range type, we can let the
    // series class handle that for us. The 'exact' interaction range is the same as having a distance
    // of 0. Therefore, we only need bounding boxes for number based ranges.
    private bboxes: HierarchicalBBox;

    protected override _datum?: ErrorBarNodeDatum = undefined;
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
        this.bboxes = new HierarchicalBBox([]);
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

    private getFormatterParams(formatters: Formatters, highlighted: boolean): AgErrorBarFormatterParams | undefined {
        const { datum } = this;
        if (datum === undefined || (formatters.formatter === undefined && formatters.cap.formatter === undefined)) {
            return;
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
            highlighted,
        };
    }

    private formatStyles(style: AgErrorBarThemeableOptions, formatters: Formatters, highlighted: boolean) {
        let { cap: capsStyle, ...whiskerStyle } = style;

        const params = this.getFormatterParams(formatters, highlighted);
        if (params !== undefined) {
            if (formatters.formatter !== undefined) {
                const result = formatters.formatter(params);
                whiskerStyle = mergeDefaults(result, whiskerStyle);
                capsStyle = mergeDefaults(result, capsStyle);
                capsStyle = mergeDefaults(result?.cap, capsStyle);
            }

            if (formatters.cap.formatter !== undefined) {
                const result = formatters.cap.formatter(params);
                capsStyle = mergeDefaults(result, capsStyle);
            }
        }

        return { whiskerStyle, capsStyle };
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

    update(style: AgErrorBarThemeableOptions, formatters: Formatters, highlighted: boolean) {
        // Note: The method always uses the RedrawType.MAJOR mode for simplicity.
        // This could be optimised to reduce a amount of unnecessary redraws.
        if (this.datum === undefined) {
            return;
        }
        const { whiskerStyle, capsStyle } = this.formatStyles(style, formatters, highlighted);
        const { xBar, yBar, capDefaults } = this.datum;

        const whisker = this.whiskerPath;
        this.applyStyling(whisker, whiskerStyle);
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

        // ErrorBar caps stretch out perpendicular to the whisker equally on both
        // sides, so we want the offset to be half of the total length.
        this.capLength = this.calculateCapLength(capsStyle ?? {}, capDefaults);
        const capOffset = this.capLength / 2;
        const caps = this.capsPath;
        this.applyStyling(caps, capsStyle);
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

    updateBBoxes(): void {
        const { capLength, whiskerPath: whisker, capsPath: caps } = this;
        const { yBar, xBar } = this.datum ?? {};
        const capOffset = capLength / 2;
        const components = [];

        if (yBar !== undefined) {
            const whiskerHeight = yBar.lowerPoint.y - yBar.upperPoint.y;
            components.push(
                new BBox(yBar.lowerPoint.x, yBar.upperPoint.y, whisker.strokeWidth, whiskerHeight),
                new BBox(yBar.lowerPoint.x - capOffset, yBar.lowerPoint.y, capLength, caps.strokeWidth),
                new BBox(yBar.upperPoint.x - capOffset, yBar.upperPoint.y, capLength, caps.strokeWidth)
            );
        }
        if (xBar !== undefined) {
            const whiskerWidth = xBar.upperPoint.x - xBar.lowerPoint.x;
            components.push(
                new BBox(xBar.lowerPoint.x, xBar.upperPoint.y, whiskerWidth, whisker.strokeWidth),
                new BBox(xBar.lowerPoint.x, xBar.lowerPoint.y - capOffset, caps.strokeWidth, capLength),
                new BBox(xBar.upperPoint.x, xBar.upperPoint.y - capOffset, caps.strokeWidth, capLength)
            );
        }

        this.bboxes.components = components;
        this.bboxes.union = BBox.merge(components);
    }

    override containsPoint(x: number, y: number): boolean {
        return this.bboxes.containsPoint(x, y);
    }

    override pickNode(x: number, y: number): _Scene.Node | undefined {
        return this.containsPoint(x, y) ? this : undefined;
    }

    nearestSquared(point: Point, maxDistance: number): NearestResult<_Scene.Node> {
        const { bboxes } = this;
        if (bboxes.union.distanceSquared(point) > maxDistance) {
            return { nearest: undefined, distanceSquared: Infinity };
        }

        const { distanceSquared } = BBox.nearestBox(point, bboxes.components);
        return { nearest: this, distanceSquared };
    }
}

export class ErrorBarGroup extends _Scene.Group {
    override get children(): ErrorBarNode[] {
        return super.children as ErrorBarNode[];
    }

    nearestSquared(point: Point): _ModuleSupport.PickNodeDatumResult {
        const { nearest, distanceSquared } = _Scene.nearestSquaredInContainer(point, this);
        if (nearest !== undefined && !isNaN(distanceSquared)) {
            return { datum: nearest.datum, distanceSquared };
        }
    }
}
