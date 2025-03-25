import { Logger, isArray } from 'ag-charts-core';
import type {
    AgAxisBoundSeries,
    AgBaseAxisLabelStyleOptions,
    CssColor,
    FontFamily,
    FontSize,
    FontStyle,
    FontWeight,
} from 'ag-charts-types';

import type { AxisContext } from '../../module/axisContext';
import type { AxisOptionModule } from '../../module/axisOptionModule';
import type { ModuleInstance } from '../../module/baseModule';
import type { ModuleContext, ModuleContextWithParent } from '../../module/moduleContext';
import { ModuleMap } from '../../module/moduleMap';
import { ContinuousScale } from '../../scale/continuousScale';
import { OrdinalTimeScale } from '../../scale/ordinalTimeScale';
import type { Scale, ScaleFormatParams } from '../../scale/scale';
import { BBox } from '../../scene/bbox';
import { Group, TransformableGroup, TranslatableGroup } from '../../scene/group';
import type { Node } from '../../scene/node';
import { Selection } from '../../scene/selection';
import { Line } from '../../scene/shape/line';
import { TransformableText } from '../../scene/shape/text';
import { Transformable, Translatable } from '../../scene/transformable';
import { normalizeAngle360, toRadians } from '../../util/angle';
import { formatValue } from '../../util/format.util';
import { createId } from '../../util/id';
import { findMinMax, findRangeExtent } from '../../util/number';
import { mergeDefaults } from '../../util/object';
import { Property } from '../../util/properties';
import { ObserveChanges } from '../../util/proxy';
import type { ChartAnimationPhase } from '../chartAnimationPhase';
import type { AxisGroups, ChartAxis, ChartAxisLabelFlipFlag } from '../chartAxis';
import { ChartAxisDirection } from '../chartAxisDirection';
import { CartesianCrossLine } from '../crossline/cartesianCrossLine';
import type { CrossLine } from '../crossline/crossLine';
import type { AxisLayout } from '../layout/layoutManager';
import type { ISeries } from '../series/seriesTypes';
import { ZIndexMap } from '../zIndexMap';
import { AxisGridLine } from './axisGridLine';
import { AxisInterval } from './axisInterval';
import { AxisLabel } from './axisLabel';
import { AxisLine } from './axisLine';
import { AxisTick, type TickInterval } from './axisTick';
import { AxisTitle } from './axisTitle';
import { NiceMode } from './axisUtil';

export interface LabelNodeDatum {
    tickId: string;
    fill?: CssColor;
    fontFamily?: FontFamily;
    fontSize?: FontSize;
    fontStyle?: FontStyle;
    fontWeight?: FontWeight;
    rotation: number;
    rotationCenterX: number;
    text: string;
    textAlign?: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
    visible: boolean;
    x: number;
    y: number;
    translationX?: number;
    translationY: number;
    range: number[];
}

type AxisModuleMap = ModuleMap<AxisOptionModule, ModuleInstance, ModuleContextWithParent<AxisContext>>;

export class TranslatableLine extends Translatable(Line) {}

export enum AxisGroupZIndexMap {
    TickLines,
    // eslint-disable-next-line @typescript-eslint/no-shadow
    AxisLine,
    TickLabels,
}

export type CrosslineFormatterParams<D> = Omit<ScaleFormatParams<D>, 'specifier'> | undefined;

/**
 * A general purpose linear axis with no notion of orientation.
 * The axis is always rendered vertically, with horizontal labels positioned to the left
 * of the axis line by default. The axis can be {@link rotation | rotated} by an arbitrary angle,
 * so that it can be used as a top, right, bottom, left, radial or any other kind
 * of linear axis.
 * The generic `D` parameter is the type of the domain of the axis' scale.
 * The output range of the axis' scale is always numeric (screen coordinates).
 */
export abstract class Axis<
    S extends Scale<D, number, TickInterval<S>> = Scale<any, number, any>,
    D = any,
    TickDatum = any,
    TickLabelDatum = TickDatum,
> implements ChartAxis
{
    static readonly defaultTickMinSpacing = 50;

    protected static CrossLineConstructor: new () => CrossLine<any> = CartesianCrossLine;

    readonly id = createId(this);

    // user pass-through option: no validation required.
    context?: unknown;

    @Property
    nice: boolean = true;

    /** Reverse the axis scale domain. */
    @Property
    reverse: boolean = false;

    @Property
    keys: string[] = [];

    @Property
    readonly interval = new AxisInterval();

    dataDomain: { domain: D[]; clipped: boolean } = { domain: [], clipped: false };

    get type(): string {
        return (this.constructor as any).type ?? '';
    }

    abstract get direction(): ChartAxisDirection;

    layoutConstraints: ChartAxis['layoutConstraints'] = {
        stacked: true,
        align: 'start',
        width: 100,
        unit: 'percent',
    };

    boundSeries: ISeries<unknown, unknown, unknown>[] = [];
    includeInvisibleDomains: boolean = false;

    interactionEnabled = true;

    protected readonly axisGroup = new Group({ name: `${this.id}-axis` });

    // Order is important to apply the correct z-index.
    protected readonly tickLineGroup = this.axisGroup.appendChild(
        new TransformableGroup({ name: `${this.id}-Axis-tick-lines`, zIndex: AxisGroupZIndexMap.TickLines })
    );
    protected readonly tickLabelGroup = this.axisGroup.appendChild(
        new TransformableGroup({ name: `${this.id}-Axis-tick-labels`, zIndex: AxisGroupZIndexMap.TickLabels })
    );
    protected readonly labelGroup = new Group({
        name: `${this.id}-Labels`,
        zIndex: ZIndexMap.SERIES_ANNOTATION,
    });

    readonly gridGroup = new TranslatableGroup({ name: `${this.id}-Axis-grid`, zIndex: ZIndexMap.AXIS_GRID });
    protected readonly gridLineGroup = this.gridGroup.appendChild(new Group({ name: `${this.id}-gridLines` }));

    protected readonly crossLineRangeGroup = new TransformableGroup({
        name: `${this.id}-CrossLines-Range`,
        zIndex: ZIndexMap.SERIES_CROSSLINE_RANGE,
    });
    protected readonly crossLineLineGroup = new TransformableGroup({
        name: `${this.id}-CrossLines-Line`,
        zIndex: ZIndexMap.SERIES_CROSSLINE_LINE,
    });
    protected readonly crossLineLabelGroup = new TransformableGroup({
        name: `${this.id}-CrossLines-Label`,
        zIndex: ZIndexMap.SERIES_LABEL,
    });

    protected tickLineGroupSelection = Selection.select<TranslatableLine, TickDatum>(
        this.tickLineGroup,
        TranslatableLine,
        false
    );
    protected tickLabelGroupSelection = Selection.select<TransformableText, TickLabelDatum>(
        this.tickLabelGroup,
        TransformableText,
        false
    );
    protected gridLineGroupSelection = Selection.select<TranslatableLine, TickDatum>(
        this.gridLineGroup,
        TranslatableLine,
        false
    );

    get labelNodes() {
        return this.tickLabelGroupSelection.nodes();
    }

    private _crossLines: CrossLine[] = [];
    set crossLines(value: CrossLine[]) {
        const { CrossLineConstructor } = this.constructor as typeof Axis;
        this._crossLines.forEach((crossLine) => this.detachCrossLine(crossLine));
        this._crossLines = value.map((crossLine) => {
            const instance = new CrossLineConstructor();
            instance.set(crossLine);
            return instance;
        });
        this._crossLines.forEach((crossLine) => {
            this.attachCrossLine(crossLine);
            this.initCrossLine(crossLine);
        });
    }
    get crossLines() {
        return this._crossLines;
    }

    readonly line = new AxisLine();
    readonly tick = new AxisTick();
    readonly gridLine = new AxisGridLine();
    readonly label = this.createLabel();

    defaultTickMinSpacing: number = Axis.defaultTickMinSpacing;

    readonly translation = { x: 0, y: 0 };
    rotation: number = 0; // axis rotation angle in degrees

    protected readonly layout: Pick<AxisLayout, 'label'> = {
        label: {
            fractionDigits: 0,
            spacing: this.label.spacing,
            format: this.label.format,
        },
    };

    protected axisContext: AxisContext | undefined = undefined;

    private labelFormatter: ((datum: unknown) => string) | undefined = undefined;
    private datumFormatter: ((datum: unknown) => string) | undefined = undefined;
    private scaleFormatterParams: CrosslineFormatterParams<D> | undefined = undefined;

    protected readonly destroyFns: Array<() => void> = [];

    constructor(
        protected readonly moduleCtx: ModuleContext,
        readonly scale: S
    ) {
        this.range = this.scale.range.slice() as [number, number];
        this.crossLines.forEach((crossLine) => this.initCrossLine(crossLine));
    }

    resetAnimation(_phase: ChartAnimationPhase) {
        // Override in classes
    }

    private attachCrossLine(crossLine: CrossLine) {
        this.crossLineRangeGroup.appendChild(crossLine.rangeGroup);
        this.crossLineLineGroup.appendChild(crossLine.lineGroup);
        this.crossLineLabelGroup.appendChild(crossLine.labelGroup);
    }

    private detachCrossLine(crossLine: CrossLine) {
        this.crossLineRangeGroup.removeChild(crossLine.rangeGroup);
        this.crossLineLineGroup.removeChild(crossLine.lineGroup);
        this.crossLineLabelGroup.removeChild(crossLine.labelGroup);
    }

    destroy() {
        this.moduleMap.destroy();
        this.destroyFns.forEach((f) => f());
    }

    protected updateScale() {
        const { range: rr, visibleRange: vr, scale } = this;
        const span = (rr[1] - rr[0]) / (vr[1] - vr[0]);
        const shift = span * vr[0];
        const start = rr[0] - shift;

        scale.range = [start, start + span];
        this.crossLines.forEach((crossLine) => {
            crossLine.clippedRange = [rr[0], rr[1]];
        });
    }

    setCrossLinesVisible(visible: boolean) {
        this.crossLineRangeGroup.visible = visible;
        this.crossLineLineGroup.visible = visible;
        this.crossLineLabelGroup.visible = visible;
    }

    attachAxis(groups: AxisGroups) {
        groups.gridNode.appendChild(this.gridGroup);
        groups.axisNode.appendChild(this.axisGroup);
        groups.labelNode.appendChild(this.labelGroup);
        groups.crossLineRangeNode.appendChild(this.crossLineRangeGroup);
        groups.crossLineLineNode.appendChild(this.crossLineLineGroup);
        groups.crossLineLabelNode.appendChild(this.crossLineLabelGroup);
    }

    detachAxis(groups: AxisGroups) {
        groups.gridNode.removeChild(this.gridGroup);
        groups.axisNode.removeChild(this.axisGroup);
        groups.labelNode.removeChild(this.labelGroup);
        groups.crossLineRangeNode.removeChild(this.crossLineRangeGroup);
        groups.crossLineLineNode.removeChild(this.crossLineLineGroup);
        groups.crossLineLabelNode.removeChild(this.crossLineLabelGroup);
    }

    attachLabel(axisLabelNode: Node) {
        this.labelGroup.append(axisLabelNode);
    }

    range: [number, number] = [0, 1];
    visibleRange: [number, number] = [0, 1];

    /**
     * Checks if a point or an object is in range.
     * @param value A point (or object's starting point).
     * @param tolerance Expands the range on both ends by this amount.
     */
    inRange(value: number, tolerance = 0): boolean {
        const [min, max] = findMinMax(this.range);
        return value >= min - tolerance && value <= max + tolerance;
    }

    /**
     * Get a point's overflow on the range, expanded to include the non-visible range.
     * @param value Point
     * @returns Overflow
     */
    getRangeOverflow(value: number): number {
        const { range: rr, visibleRange: vr } = this;
        const size = (rr[1] - rr[0]) / (vr[1] - vr[0]);
        const [min, max] = findMinMax([rr[0] - size * vr[0], rr[0] - size * vr[0] + size]);

        if (value < min) return value - min;
        if (value > max) return value - max;
        return 0;
    }

    protected defaultDatumFormatter(datum: unknown, fractionDigits: number): string {
        return formatValue(datum, fractionDigits + 1);
    }

    protected defaultLabelFormatter(datum: unknown, fractionDigits: number): string {
        return formatValue(datum, fractionDigits);
    }

    @Property
    readonly title = new AxisTitle();

    /**
     * The length of the grid. The grid is only visible in case of a non-zero value.
     */
    @ObserveChanges<Axis>((target, value, oldValue) => target.onGridLengthChange(value, oldValue))
    gridLength: number = 0;

    /**
     * The distance between the grid ticks and the axis ticks.
     */
    gridPadding = 0;

    /**
     * Is used to avoid collisions between axis labels and series.
     */
    seriesAreaPadding = 0;

    protected onGridLengthChange(value: number, prevValue: number) {
        // Was visible and now invisible, or was invisible and now visible.
        if (prevValue ^ value) {
            this.onGridVisibilityChange();
        }
        this.crossLines.forEach((crossLine) => this.initCrossLine(crossLine));
    }

    protected onGridVisibilityChange() {
        this.gridLineGroupSelection.clear();
    }

    protected createLabel() {
        return new AxisLabel();
    }

    /**
     * Creates/removes/updates the scene graph nodes that constitute the axis.
     */
    update() {
        this.updatePosition();

        this.updateSelections();

        this.tickLineGroup.visible = this.tick.enabled;
        this.gridLineGroup.visible = this.gridLine.enabled;
        this.tickLabelGroup.visible = this.label.enabled;

        this.updateLabels();
        this.updateGridLines();
        this.updateTickLines();
        this.updateCrossLines();
    }

    protected getLabelStyles(
        params: { value: string; depth?: number },
        additionalStyles?: AgBaseAxisLabelStyleOptions
    ) {
        const { label } = this;
        const defaultStyle: AgBaseAxisLabelStyleOptions = {
            color: label.color,
            spacing: label.spacing,
            fontFamily: label.fontFamily,
            fontSize: label.fontSize,
            fontStyle: label.fontStyle,
            fontWeight: label.fontWeight,
        };
        let stylerOutput: AgBaseAxisLabelStyleOptions | undefined;
        if (label.itemStyler) {
            stylerOutput = this.moduleCtx.callbackCache.call(this, label.itemStyler, {
                ...params,
                ...defaultStyle,
            });
        }
        const {
            color: fill,
            fontFamily,
            fontSize,
            fontStyle,
            fontWeight,
            spacing,
        } = mergeDefaults(stylerOutput, additionalStyles, defaultStyle);
        return { fill, fontFamily, fontSize, fontStyle, fontWeight, spacing };
    }

    protected getTickSize() {
        return this.tick.enabled ? this.tick.size : 0;
    }

    processData() {
        const { includeInvisibleDomains, boundSeries, direction } = this;
        const visibleSeries = includeInvisibleDomains ? boundSeries : boundSeries.filter((s) => s.isEnabled());
        const domains = visibleSeries.map((series) => series.getDomain(direction) as D[]);
        this.setDomains(...domains);
    }

    protected animatable = true;
    setDomains(...domains: D[][]) {
        let domain: D[];
        let animatable: boolean;
        if (domains.length > 0) {
            ({ domain, animatable } = this.scale.normalizeDomains(...domains));
        } else {
            // Series (or all series in a group) hidden
            // There could be multiple axes, so we still consider this to be animatable
            domain = [];
            animatable = true;
        }

        this.dataDomain = this.normaliseDataDomain(domain);

        if (this.reverse) {
            this.dataDomain.domain.reverse();
        }

        this.animatable = animatable;
    }

    _scaleNiceDomainInputDomain: D[] | undefined = undefined;
    _scaleNiceDomainRangeExtent: number = NaN;
    calculateLayout(initialPrimaryTickCount?: number): {
        primaryTickCount?: number;
        bbox?: BBox;
        niceDomain?: unknown[];
    } {
        const { scale, label, visibleRange, nice } = this;

        this.updateScale();

        const rangeExtent = findRangeExtent(this.range);

        const domain = this.dataDomain.domain;
        let tickLayoutDomain: D[] | undefined;
        if (visibleRange[0] === 0 && visibleRange[1] === 1) {
            tickLayoutDomain = undefined;
        } else if (!nice) {
            tickLayoutDomain = domain;
        } else if (this._scaleNiceDomainInputDomain === domain && this._scaleNiceDomainRangeExtent === rangeExtent) {
            tickLayoutDomain = this.scale.domain;
        } else {
            tickLayoutDomain = this.calculateTickLayout(domain, NiceMode.TickAndDomain, [0, 1]).niceDomain;
        }

        let niceMode: NiceMode;
        if (!nice) {
            niceMode = NiceMode.Off;
        } else if (tickLayoutDomain == null) {
            niceMode = NiceMode.TickAndDomain;
        } else {
            niceMode = NiceMode.TicksOnly;
        }
        const { niceDomain, primaryTickCount, ticks, tickDomain, fractionDigits, bbox } = this.calculateTickLayout(
            tickLayoutDomain ?? domain,
            niceMode,
            visibleRange,
            initialPrimaryTickCount
        );

        this.scale.domain = niceDomain;

        this._scaleNiceDomainInputDomain = nice ? domain : undefined;
        this._scaleNiceDomainRangeExtent = nice ? rangeExtent : NaN;

        const specifier = label.format;
        this.labelFormatter =
            scale.tickFormatter({ domain: tickDomain, specifier, ticks, fractionDigits }) ??
            ((value: unknown) => this.defaultLabelFormatter(value, fractionDigits));
        this.datumFormatter =
            scale.datumFormatter({ domain: tickDomain, specifier, ticks, fractionDigits }) ??
            ((value: unknown) => this.defaultDatumFormatter(value, fractionDigits));
        this.scaleFormatterParams = { domain: tickDomain, ticks, fractionDigits };

        this.layout.label = {
            fractionDigits: fractionDigits,
            spacing: this.label.spacing,
            format: this.label.format,
        };

        const sideFlag = label.getSideFlag();
        const anySeriesActive = this.isAnySeriesActive();
        const { rotation, parallelFlipRotation, regularFlipRotation } = this.calculateRotations();

        this.crossLines.forEach((crossLine) => {
            crossLine.sideFlag = -sideFlag as ChartAxisLabelFlipFlag;
            crossLine.direction = rotation === -Math.PI / 2 ? ChartAxisDirection.X : ChartAxisDirection.Y;
            if (crossLine instanceof CartesianCrossLine) {
                crossLine.label.parallel ??= label.parallel;
            }
            crossLine.parallelFlipRotation = parallelFlipRotation;
            crossLine.regularFlipRotation = regularFlipRotation;
            crossLine.calculateLayout?.(anySeriesActive, this.reverse);
        });

        return { primaryTickCount, bbox };
    }

    abstract calculateTickLayout(
        domain: D[],
        niceMode: NiceMode,
        visibleRange: [number, number],
        primaryTickCount?: number
    ): {
        niceDomain: D[];
        primaryTickCount?: number;
        tickDomain: D[];
        ticks: D[];
        fractionDigits: number;
        bbox?: BBox;
    };

    protected calculateRotations() {
        const rotation = toRadians(this.rotation);
        // When labels are parallel to the axis line, the `parallelFlipFlag` is used to
        // flip the labels to avoid upside-down text, when the axis is rotated
        // such that it is in the right hemisphere, i.e. the angle of rotation
        // is in the [0, π] interval.
        // The rotation angle is normalized, so that we have an easier time checking
        // if it's in the said interval. Since the axis is always rendered vertically
        // and then rotated, zero rotation means 12 (not 3) o-clock.
        // -1 = flip
        //  1 = don't flip (default)
        const parallelFlipRotation = normalizeAngle360(rotation);
        const regularFlipRotation = normalizeAngle360(rotation - Math.PI / 2);
        return { rotation, parallelFlipRotation, regularFlipRotation };
    }

    protected updateCrossLines() {
        const anySeriesActive = this.isAnySeriesActive();
        this.crossLines.forEach((crossLine) => {
            crossLine.update(anySeriesActive);
        });
    }

    protected updateTickLines() {
        const { tick, label } = this;
        const sideFlag = label.getSideFlag();
        this.tickLineGroupSelection.each((line, datum: any) => {
            line.strokeWidth = datum.tickWidth ?? tick.width;
            line.stroke = datum.tickStroke ?? tick.stroke;
            line.x1 = sideFlag * (datum.tickSize ?? this.getTickSize());
            line.x2 = 0;
        });
    }

    protected getAxisTransform() {
        return {
            rotation: toRadians(this.rotation),
            translationX: Math.floor(this.translation.x),
            translationY: Math.floor(this.translation.y),
        };
    }

    protected updatePosition() {
        const { crossLineRangeGroup, crossLineLineGroup, crossLineLabelGroup, gridGroup, translation } = this;
        const { rotation } = this.calculateRotations();
        const translationX = Math.floor(translation.x);
        const translationY = Math.floor(translation.y);

        gridGroup.setProperties({ translationX, translationY });
        crossLineRangeGroup.setProperties({ rotation, translationX, translationY });
        crossLineLineGroup.setProperties({ rotation, translationX, translationY });
        crossLineLabelGroup.setProperties({ rotation, translationX, translationY });
    }

    protected abstract updateSelections(): void;

    protected updateGridLines() {
        const sideFlag = this.label.getSideFlag();
        const {
            gridLine: { style, width },
            gridPadding,
            gridLength,
        } = this;

        if (gridLength === 0 || style.length === 0) {
            return;
        }
        this.gridLineGroupSelection.each((line, _, index) => {
            const { stroke, lineDash } = style[index % style.length];
            line.setProperties({
                x1: gridPadding,
                x2: -sideFlag * gridLength + gridPadding,
                stroke,
                strokeWidth: width,
                lineDash,
            });
        });
    }

    protected abstract updateLabels(): void;

    // For formatting (nice rounded) tick values.
    formatTick(
        value: unknown,
        index: number,
        domain: D[],
        fractionDigits?: number,
        defaultFormatter?: (datum: unknown) => string
    ): string {
        const {
            labelFormatter,
            label: { formatter },
            moduleCtx: { callbackCache },
        } = this;

        let result: string | undefined;
        if (formatter) {
            const boundSeries = this.getFormatterBoundSeries();
            result = callbackCache.call(this, formatter, { value, index, domain, fractionDigits, boundSeries });
        } else if (defaultFormatter) {
            result = defaultFormatter(value);
        } else if (labelFormatter) {
            result = labelFormatter(value);
        }
        return String(result ?? value);
    }

    // For formatting arbitrary values between the ticks.
    formatDatum(value: unknown): string {
        const {
            label: { formatter },
            moduleCtx: { callbackCache },
            datumFormatter: valueFormatter = this.labelFormatter,
        } = this;

        let result: string | undefined;
        if (formatter) {
            const { domain } = this.scale;
            const boundSeries = this.getFormatterBoundSeries();
            result = callbackCache.call(this, formatter, { value: value, index: NaN, domain, boundSeries });
        } else if (valueFormatter) {
            result = callbackCache.call(this, valueFormatter, value);
        } else if (isArray(value)) {
            // Handle grouped categories value.
            result = value.filter(Boolean).join(' - ');
        }
        return String(result ?? value);
    }

    private getScaleValueFormatter(format?: string): (value: unknown) => string {
        const { scaleFormatterParams } = this;

        let formatter: ((value: unknown) => string) | undefined;
        try {
            if (format != null && scaleFormatterParams != null) {
                formatter = this.scale.tickFormatter({ ...scaleFormatterParams, specifier: format });
            }
        } catch {
            Logger.warnOnce(`the format string ${format} is invalid, ignoring.`);
        }

        formatter ??= (value: unknown) => this.formatDatum(value);

        return formatter;
    }

    getBBox(): BBox {
        return this.axisGroup.getBBox();
    }

    private initCrossLine(crossLine: CrossLine) {
        crossLine.scale = this.scale;
        crossLine.gridLength = this.gridLength;
    }

    private isAnySeriesActive() {
        return this.boundSeries.some((s) => this.includeInvisibleDomains || s.isEnabled());
    }

    clipTickLines(x: number, y: number, width: number, height: number) {
        this.tickLineGroup.setClipRect(new BBox(x, y, width, height));
    }

    clipGrid(x: number, y: number, width: number, height: number) {
        this.gridGroup.setClipRect(new BBox(x, y, width, height));
    }

    private getFormatterBoundSeries() {
        const { direction } = this;
        const boundSeries: AgAxisBoundSeries[] = [];
        for (const series of this.boundSeries) {
            const keys = series.getKeys(direction);
            const names = series.getNames(direction);
            for (let idx = 0; idx < keys.length; idx++) {
                boundSeries.push({ key: keys[idx], name: names[idx] });
            }
        }
        return boundSeries;
    }

    protected getTitleFormatterParams(domain: D[]) {
        const { direction } = this;
        const boundSeries = this.getFormatterBoundSeries();
        return { domain, direction, boundSeries, defaultValue: this.title?.text };
    }

    protected normaliseDataDomain(d: D[]): { domain: D[]; clipped: boolean } {
        return { domain: [...d], clipped: false };
    }

    getLayoutState(): AxisLayout {
        return {
            id: this.id,
            rect: this.getBBox(),
            gridPadding: this.gridPadding,
            seriesAreaPadding: this.seriesAreaPadding,
            tickSize: this.getTickSize(),
            direction: this.direction,
            domain: this.dataDomain.domain,
            scale: this.scale,
            ...this.layout,
        };
    }

    private readonly moduleMap: AxisModuleMap = new ModuleMap();

    getModuleMap(): AxisModuleMap {
        return this.moduleMap;
    }

    createModuleContext(): ModuleContextWithParent<AxisContext> {
        this.axisContext ??= this.createAxisContext();
        return { ...this.moduleCtx, parent: this.axisContext };
    }

    createAxisContext(): AxisContext {
        const { scale } = this;
        return {
            axisId: this.id,
            scale: this.scale,
            direction: this.direction,
            continuous: ContinuousScale.is(scale) || OrdinalTimeScale.is(scale),
            getCanvasBounds: () => {
                return Transformable.toCanvas(this.axisGroup);
            },
            seriesKeyProperties: () =>
                this.boundSeries.reduce((keys, series) => {
                    const seriesKeys = series.getKeyProperties(this.direction);
                    seriesKeys.forEach((key) => keys.add(key));
                    return keys;
                }, new Set<string>()),
            seriesIds: () => this.boundSeries.map((series) => series.id),
            scaleValueFormatter: (specifier?: string) => this.getScaleValueFormatter(specifier),
            scaleInvert: (val) => scale.invert(val, true),
            scaleInvertNearest: (val) => scale.invert(val, true),
            attachLabel: (node: Node) => this.attachLabel(node),
            inRange: (value, tolerance) => this.inRange(value, tolerance),
            getRangeOverflow: (value) => this.getRangeOverflow(value),
        };
    }

    isReversed() {
        return this.reverse;
    }
}
