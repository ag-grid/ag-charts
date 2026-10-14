import type { AgErrorBarOptions, AgErrorBarThemeableOptions } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import type { BoxBounds, Node, Normalised, PickNodeDatumResult, RequireOptional } from 'ag-charts-core';
import {
    BBox,
    Group,
    type NearestResult,
    Path,
    mergeDefaults,
    nearestSquared,
    nearestSquaredInContainer,
    partialAssign,
} from 'ag-charts-core';
import type {
    AgBarSeriesItemStylerParams,
    AgLineSeriesMarkerItemStylerParams,
    AgScatterSeriesItemStylerParams,
    CssColor,
    HighlightState,
    SelectionState,
} from 'ag-charts-types';

export type ErrorBarNodeDatum = _ModuleSupport.CartesianSeriesNodeDatum &
    _ModuleSupport.ErrorBoundSeriesNodeDatum & { yKey: string };
export type ErrorBarStylingOptions = Omit<AgErrorBarThemeableOptions, 'cap'>;
// Resolved render-time shape: refs are resolved to concrete colours during theme-merge before reaching scene nodes.
type NormalisedErrorBarStylingOptions = Normalised<ErrorBarStylingOptions, never, { stroke?: CssColor }>;
type NormalisedErrorBarCapStyle = Normalised<
    NonNullable<AgErrorBarThemeableOptions['cap']>,
    never,
    { stroke?: CssColor }
>;
export type NormalisedErrorBarStyles = {
    whiskerStyle: NormalisedErrorBarStylingOptions;
    capsStyle: NormalisedErrorBarCapStyle | undefined;
};

type ErrorBarKey = 'xLowerKey' | 'xUpperKey' | 'yLowerKey' | 'yUpperKey';
type IgnoredSeriesKey = 'context' | 'size' | 'shape' | 'fill' | 'fillOpacity' | 'labelKey' | 'colorKey';

type ErrorBarItemStylerParams =
    | AgBarSeriesItemStylerParams<unknown, unknown>
    | AgLineSeriesMarkerItemStylerParams<unknown, unknown>
    | AgScatterSeriesItemStylerParams<unknown, unknown>;

// Turn `A | B | ...` into `Rule<A> | Rule<B> | ...`
type DistributeItemStylerRule<T> = T extends any
    ? RequireOptional<Omit<T, IgnoredSeriesKey> & Pick<AgErrorBarOptions<unknown, unknown>, ErrorBarKey>>
    : never;
type ErrorBarItemStylerParamsRules = DistributeItemStylerRule<ErrorBarItemStylerParams>;

type FormatOptions = Pick<AgErrorBarOptions<any>, ErrorBarKey | 'itemStyler'>;
type Caller = {
    callWithContext<I, O, F extends (params: I) => O>(callback: F, params: I): O;
    callWithContext<I, O, F extends (params: I) => O | undefined>(callback: F, params: I): O | undefined;
};

type CapDefaults = NonNullable<ErrorBarNodeDatum['capDefaults']>;
type CapOptions = NonNullable<AgErrorBarThemeableOptions['cap']>;
type CapLengthOptions = Pick<CapOptions, 'length' | 'lengthRatio'>;

/** The cap length: a user-defined `length` (px), else `lengthRatio` of the series default, capped at `lengthMax`. */
export function errorBarCapLength(capsTheme: CapLengthOptions, capDefaults: CapDefaults): number {
    const { lengthRatio = 1, length } = capsTheme;
    const { lengthRatioMultiplier, lengthMax } = capDefaults;
    const desiredLength = length ?? lengthRatio * lengthRatioMultiplier;
    return Math.min(desiredLength, lengthMax);
}

interface StrokeStyle {
    readonly visible?: boolean;
    readonly strokeWidth?: number;
}

/** The extent of the whiskers and caps drawn for a datum, strokes and cap lengths included. */
export function errorBarDrawnBounds(
    { xBar, yBar }: Pick<ErrorBarNodeDatum, 'xBar' | 'yBar'>,
    whisker: StrokeStyle,
    caps: StrokeStyle | undefined,
    capLength: number
): BoxBounds | undefined {
    const whiskerVisible = whisker.visible !== false;
    const capsVisible = caps != null && caps.visible !== false;
    if (!whiskerVisible && !capsVisible) return undefined;
    const across = Math.max(whiskerVisible ? (whisker.strokeWidth ?? 0) / 2 : 0, capsVisible ? capLength / 2 : 0);
    const along = capsVisible ? (caps.strokeWidth ?? 0) / 2 : 0;
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    if (yBar != null) {
        const { lowerPoint, upperPoint } = yBar;
        x0 = lowerPoint.x - across;
        x1 = lowerPoint.x + across;
        y0 = Math.min(lowerPoint.y, upperPoint.y) - along;
        y1 = Math.max(lowerPoint.y, upperPoint.y) + along;
    }
    if (xBar != null) {
        const { lowerPoint, upperPoint } = xBar;
        x0 = Math.min(x0, lowerPoint.x - along, upperPoint.x - along);
        x1 = Math.max(x1, lowerPoint.x + along, upperPoint.x + along);
        y0 = Math.min(y0, lowerPoint.y - across);
        y1 = Math.max(y1, lowerPoint.y + across);
    }
    if (x0 > x1) return undefined;
    return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
}

function getItemStylerParams(
    datum: ErrorBarNodeDatum,
    options: FormatOptions,
    style: AgErrorBarThemeableOptions,
    highlightState: HighlightState,
    selectionState: SelectionState | undefined,
    candidateState: SelectionState | undefined
) {
    const { xLowerKey, xUpperKey, yLowerKey, yUpperKey } = options;

    return {
        ...(style as Required<AgErrorBarThemeableOptions>),
        datum: datum.datum,
        seriesId: datum.series.id,
        xKey: datum.xKey,
        yKey: datum.yKey,
        xLowerKey,
        xUpperKey,
        yLowerKey,
        yUpperKey,
        highlightState,
        selectionState,
        candidateState,
    } satisfies ErrorBarItemStylerParamsRules;
}

/** The whisker and cap styles `datum` is drawn with, after its `itemStyler`. */
export function resolveErrorBarStyles(
    datum: ErrorBarNodeDatum,
    style: AgErrorBarThemeableOptions,
    options: FormatOptions,
    caller: Caller,
    highlightState: HighlightState,
    selectionState: SelectionState | undefined,
    candidateState: SelectionState | undefined
): NormalisedErrorBarStyles {
    let { cap: capsStyle, ...whiskerStyle } = style;

    if (options.itemStyler != null) {
        const params = getItemStylerParams(datum, options, style, highlightState, selectionState, candidateState);
        type F = NonNullable<typeof options.itemStyler>;
        type I = Parameters<F>[0];
        type O = ReturnType<F>;
        const result = caller.callWithContext<I, O, F>(options.itemStyler, params);
        whiskerStyle = mergeDefaults(result, whiskerStyle);
        capsStyle = mergeDefaults(result?.cap, result, capsStyle);
    }

    // Colour refs are resolved at runtime before render, so the styles are concrete here.
    return { whiskerStyle, capsStyle } as NormalisedErrorBarStyles;
}

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

export class ErrorBarNode extends Group<ErrorBarNodeDatum> {
    private readonly whiskerPath: Path;
    private readonly capsPath: Path;
    private capLength: number = Number.NaN;

    // The ErrorBarNode does not need to handle the 'nearest' interaction range type, we can let the
    // series class handle that for us. The 'exact' interaction range is the same as having a distance
    // of 0. Therefore, we only need bounding boxes for number based ranges.
    private readonly bboxes: HierarchicalBBox;

    protected override _datum: ErrorBarNodeDatum | undefined = undefined;
    public override get datum(): ErrorBarNodeDatum | undefined {
        return this._datum;
    }
    public override set datum(datum: ErrorBarNodeDatum | undefined) {
        this._datum = datum;
    }

    constructor() {
        super();
        this.whiskerPath = new Path();
        this.capsPath = new Path();
        this.bboxes = new HierarchicalBBox([]);
        this.append([this.whiskerPath, this.capsPath]);
    }

    private applyStyling(target: Path, source?: NormalisedErrorBarStylingOptions) {
        // Style can be any object, including user data (e.g. formatter
        // result). So filter out anything that isn't styling options:
        partialAssign(
            ['visible', 'stroke', 'strokeWidth', 'strokeOpacity', 'lineDash', 'lineDashOffset'],
            target,
            source
        );
    }

    update(
        style: AgErrorBarThemeableOptions,
        formatters: FormatOptions,
        caller: Caller,
        highlightState: HighlightState,
        selectionState: SelectionState | undefined,
        candidateState: SelectionState | undefined
    ) {
        if (this.datum === undefined) {
            return;
        }

        const { whiskerStyle, capsStyle } = resolveErrorBarStyles(
            this.datum,
            style,
            formatters,
            caller,
            highlightState,
            selectionState,
            candidateState
        );
        const { xBar, yBar, capDefaults } = this.datum;

        const whisker = this.whiskerPath;
        this.applyStyling(whisker, whiskerStyle);
        whisker.path.clear(true);
        if (yBar !== undefined) {
            whisker.path.moveTo(yBar.lowerPoint.x, yBar.lowerPoint.y);
            whisker.path.lineTo(yBar.upperPoint.x, yBar.upperPoint.y);
        }
        if (xBar !== undefined) {
            whisker.path.moveTo(xBar.lowerPoint.x, xBar.lowerPoint.y);
            whisker.path.lineTo(xBar.upperPoint.x, xBar.upperPoint.y);
        }
        whisker.path.closePath();

        // ErrorBar caps stretch out perpendicular to the whisker equally on both
        // sides, so we want the offset to be half of the total length.
        this.capLength = errorBarCapLength(capsStyle ?? {}, capDefaults);
        const capOffset = this.capLength / 2;
        const caps = this.capsPath;
        this.applyStyling(caps, capsStyle);
        caps.path.clear(true);
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
    }

    drawnBounds(): BoxBounds | undefined {
        const { datum } = this;
        if (datum == null) return undefined;
        return errorBarDrawnBounds(datum, this.whiskerPath, this.capsPath, this.capLength);
    }

    /** The boxes of the whiskers and caps actually drawn; each bar's boxes are its whisker then two caps. */
    get drawnBBoxComponents(): readonly BBox[] {
        const { components } = this.bboxes;
        const whisker = this.whiskerPath.visible;
        const caps = this.capsPath.visible;
        if (whisker && caps) return components;
        return components.filter((_, i) => (i % 3 === 0 ? whisker : caps));
    }

    updateBBoxes(): void {
        const { capLength, whiskerPath: whisker, capsPath: caps } = this;
        const { yBar, xBar } = this.datum ?? {};
        const capOffset = capLength / 2;
        // Strokes are centred on their path, so each box straddles its line by half the stroke width.
        const whiskerWidth = whisker.strokeWidth;
        const capWidth = caps.strokeWidth;
        const components = [];

        if (yBar !== undefined) {
            const { lowerPoint, upperPoint } = yBar;
            components.push(
                new BBox(
                    lowerPoint.x - whiskerWidth / 2,
                    Math.min(lowerPoint.y, upperPoint.y),
                    whiskerWidth,
                    Math.abs(lowerPoint.y - upperPoint.y)
                ),
                new BBox(lowerPoint.x - capOffset, lowerPoint.y - capWidth / 2, capLength, capWidth),
                new BBox(upperPoint.x - capOffset, upperPoint.y - capWidth / 2, capLength, capWidth)
            );
        }
        if (xBar !== undefined) {
            const { lowerPoint, upperPoint } = xBar;
            components.push(
                new BBox(
                    Math.min(lowerPoint.x, upperPoint.x),
                    upperPoint.y - whiskerWidth / 2,
                    Math.abs(upperPoint.x - lowerPoint.x),
                    whiskerWidth
                ),
                new BBox(lowerPoint.x - capWidth / 2, lowerPoint.y - capOffset, capWidth, capLength),
                new BBox(upperPoint.x - capWidth / 2, upperPoint.y - capOffset, capWidth, capLength)
            );
        }

        this.bboxes.components = components;
        this.bboxes.union = BBox.merge(components);
    }

    override containsPoint(x: number, y: number): boolean {
        return this.bboxes.containsPoint(x, y);
    }

    override pickNode(x: number, y: number): Node | undefined {
        return this.containsPoint(x, y) ? this : undefined;
    }

    nearestSquared(x: number, y: number, maxDistance: number): NearestResult<Node> {
        const { bboxes } = this;
        if (bboxes.union.distanceSquared(x, y) > maxDistance) {
            return { nearest: undefined, distanceSquared: Infinity };
        }

        const { distanceSquared } = nearestSquared(x, y, bboxes.components);
        return { nearest: this, distanceSquared };
    }
}

export class ErrorBarGroup extends Group {
    nearestSquared(x: number, y: number): PickNodeDatumResult {
        const { nearest, distanceSquared } = nearestSquaredInContainer(x, y, {
            children: this.children() as Iterable<ErrorBarNode>,
        });
        if (nearest !== undefined && !Number.isNaN(distanceSquared)) {
            // eslint-disable-next-line sonarjs/deprecation
            return { unsafeDatum: nearest.unsafeDatum, distanceSquared };
        }
    }
}
