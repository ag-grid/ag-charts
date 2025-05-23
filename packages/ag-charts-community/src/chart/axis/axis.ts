import { type AnyFn, CleanupRegistry, createId } from 'ag-charts-core';
import type {
    AgAxisBoundSeries,
    AgBaseAxisLabelStyleOptions,
    AnyFormatterSource,
    CssColor,
    DateFormatterStyle,
    FontFamily,
    FontSize,
    FontStyle,
    FontWeight,
    FormatterParams,
    TimeInterval,
    TimeIntervalUnit,
} from 'ag-charts-types';

import type { AxisContext, AxisFormattableLabel } from '../../module/axisContext';
import type { AxisOptionModule } from '../../module/axisOptionModule';
import type { ModuleInstance } from '../../module/baseModule';
import type { ModuleContext, ModuleContextWithParent } from '../../module/moduleContext';
import { ModuleMap } from '../../module/moduleMap';
import { ContinuousScale } from '../../scale/continuousScale';
import { DiscreteTimeScale } from '../../scale/discreteTimeScale';
import type { Scale, ScaleFormatParams } from '../../scale/scale';
import { TimeScale } from '../../scale/timeScale';
import { BBox } from '../../scene/bbox';
import { Group, TransformableGroup, TranslatableGroup } from '../../scene/group';
import type { Node } from '../../scene/node';
import { Selection } from '../../scene/selection';
import { Line } from '../../scene/shape/line';
import { TransformableText } from '../../scene/shape/text';
import { Transformable, Translatable } from '../../scene/transformable';
import { formatValue } from '../../util/format.util';
import { findMinMax, findRangeExtent } from '../../util/number';
import { mergeDefaults } from '../../util/object';
import type { Padding } from '../../util/padding';
import { Property } from '../../util/properties';
import { ObserveChanges } from '../../util/proxy';
import type { AxisPrimaryTickCount } from '../../util/secondaryAxisTicks';
import { intervalUnit } from '../../util/time';
import type { ChartAnimationPhase } from '../chartAnimationPhase';
import type { AxisGroups, ChartAxis, FormatDatumParams } from '../chartAxis';
import { ChartAxisDirection } from '../chartAxisDirection';
import { CartesianCrossLine } from '../crossline/cartesianCrossLine';
import type { CrossLine } from '../crossline/crossLine';
import { labelSpecifier } from '../label';
import type { AxisLayout } from '../layout/layoutManager';
import type { ISeries } from '../series/seriesTypes';
import { ZIndexMap } from '../zIndexMap';
import { AxisGridLine } from './axisGridLine';
import { AxisInterval } from './axisInterval';
import { AxisLabel } from './axisLabel';
import { AxisLine } from './axisLine';
import { AxisTick, type TickInterval } from './axisTick';
import type { AnyTimeInterval } from './axisTickGenerator';
import { AxisTitle } from './axisTitle';
import { NiceMode } from './axisUtil';
import { deriveTimeSpecifier } from './timeFormatUtil';

export interface LabelNodeDatum {
    tickId: string;
    fill?: CssColor;
    fontFamily?: FontFamily;
    fontSize: FontSize;
    fontStyle?: FontStyle;
    fontWeight?: FontWeight;
    rotation: number;
    text: string;
    textAlign?: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
    visible: boolean;
    x: number;
    y: number;
    rotationCenterX: number;
    rotationCenterY: number;
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

export type AxisTickFormatParams = {
    type: 'number' | 'date' | 'category';
    fractionDigits?: number;
    unit?: TimeIntervalUnit;
    includeYear?: boolean;
};

const additionalFractionDigits: Record<AnyFormatterSource, number> = {
    axis: 0,
    crosshair: 1,
    tooltip: 1,
    'series-label': 0,
};

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

    protected tickLabelGroupSelection = Selection.select<TransformableText, TickLabelDatum>(
        this.tickLabelGroup,
        TransformableText,
        false
    );

    get labelNodes() {
        return this.tickLabelGroupSelection.nodes();
    }

    readonly line = new AxisLine();
    readonly tick = new AxisTick();
    readonly gridLine = new AxisGridLine();
    readonly label = this.createLabel();

    protected get primaryLabel(): AxisLabel | undefined {
        return undefined;
    }

    protected get primaryTick(): AxisTick | undefined {
        return undefined;
    }

    defaultTickMinSpacing: number = Axis.defaultTickMinSpacing;

    readonly translation = { x: 0, y: 0 };

    protected readonly layout: Pick<AxisLayout, 'label'> = {
        label: {
            fractionDigits: 0,
            spacing: this.label.spacing,
            format: this.label.format,
        },
    };

    protected axisContext: AxisContext | undefined = undefined;

    private datumFormatter: ((datum: unknown) => string) | undefined = undefined;

    protected readonly cleanup = new CleanupRegistry();

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
        this.cleanup.flush();
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

    protected onGridLengthChange(value: number, prevValue: number) {
        // Was visible and now invisible, or was invisible and now visible.
        if (prevValue ^ value) {
            this.onGridVisibilityChange();
        }
        this.crossLines.forEach((crossLine) => this.initCrossLine(crossLine));
    }

    protected onGridVisibilityChange() {}

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
        this.updateCrossLines();
    }

    protected getLabelStyles(
        params: { value: string | undefined; depth?: number },
        additionalStyles?: AgBaseAxisLabelStyleOptions,
        label: AxisLabel = this.label
    ) {
        const defaultStyle = {
            color: label.color,
            spacing: label.spacing,
            fontFamily: label.fontFamily,
            fontSize: label.fontSize,
            fontStyle: label.fontStyle,
            fontWeight: label.fontWeight,
        };
        let stylerOutput: AgBaseAxisLabelStyleOptions | undefined;
        if (label.itemStyler) {
            stylerOutput = this.callWithContext(label.itemStyler, {
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

    protected getTickSize(tick: AxisTick = this.tick) {
        return tick.enabled ? tick.size : 0;
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

    protected chartPadding?: Padding;

    _cachedUnzoomedInputDomain: D[] | undefined = undefined;
    _cachedUnzoomedRangeExtent: number = NaN;
    _cachedUnzoomedTickCount: number = 0;
    calculateLayout(
        initialPrimaryTickCount?: AxisPrimaryTickCount,
        chartPadding?: Padding
    ): {
        primaryTickCount?: AxisPrimaryTickCount;
        bbox?: BBox;
    } {
        const { scale, label, visibleRange, nice } = this;

        this.chartPadding = chartPadding;
        this.updateScale();

        const rangeExtent = findRangeExtent(this.range);

        const domain = this.dataDomain.domain;
        let tickLayoutDomain: D[] | undefined;
        let unzoomedTickCount: number | undefined;
        if (visibleRange[0] === 0 && visibleRange[1] === 1) {
            tickLayoutDomain = undefined;
            unzoomedTickCount = undefined;
        } else if (this._cachedUnzoomedInputDomain === domain && this._cachedUnzoomedRangeExtent === rangeExtent) {
            tickLayoutDomain = this.scale.domain;
            unzoomedTickCount = this._cachedUnzoomedTickCount;
        } else {
            const unzoomedTickLayout = this.calculateTickLayout(
                domain,
                nice ? NiceMode.TickAndDomain : NiceMode.Off,
                [0, 1]
            );
            tickLayoutDomain = unzoomedTickLayout.niceDomain;
            unzoomedTickCount = unzoomedTickLayout.rawTickCount ?? 0;
        }

        let niceMode: NiceMode;
        if (!nice) {
            niceMode = NiceMode.Off;
        } else if (tickLayoutDomain == null) {
            niceMode = NiceMode.TickAndDomain;
        } else {
            niceMode = NiceMode.TicksOnly;
        }
        const {
            niceDomain,
            ticks,
            rawTickCount = 0,
            tickDomain,
            fractionDigits,
            bbox,
        } = this.calculateTickLayout(tickLayoutDomain ?? domain, niceMode, visibleRange, initialPrimaryTickCount);
        unzoomedTickCount ??= rawTickCount;

        const primaryTickCount: AxisPrimaryTickCount | undefined =
            rawTickCount !== 0 && unzoomedTickCount !== 0
                ? { zoomed: rawTickCount, unzoomed: unzoomedTickCount }
                : undefined;

        const timeInterval = TimeScale.is(scale) ? scale.interval : undefined;

        this.scale.domain = niceDomain;

        this._cachedUnzoomedInputDomain = domain;
        this._cachedUnzoomedRangeExtent = rangeExtent;
        this._cachedUnzoomedTickCount = unzoomedTickCount;

        const specifier = labelSpecifier(
            timeInterval != null && label.format != null
                ? deriveTimeSpecifier(label.format, intervalUnit(timeInterval))
                : label.format,
            timeInterval
        );
        this.datumFormatter =
            scale.datumFormatter({ domain: tickDomain, specifier, ticks, fractionDigits }) ??
            ((value: unknown) => this.defaultDatumFormatter(value, fractionDigits));

        this.layout.label = {
            fractionDigits: fractionDigits,
            spacing: this.label.spacing,
            format: this.label.format,
        };

        this.layoutCrossLines();

        return { primaryTickCount, bbox };
    }

    abstract layoutCrossLines(): void;

    abstract calculateTickLayout(
        domain: D[],
        niceMode: NiceMode,
        visibleRange: [number, number],
        primaryTickCount?: AxisPrimaryTickCount
    ): {
        niceDomain: D[];
        tickDomain: D[];
        ticks: D[];
        rawTickCount: number | undefined;
        fractionDigits: number;
        timeInterval: AnyTimeInterval | undefined;
        bbox?: BBox;
    };

    protected updateCrossLines() {
        const anySeriesActive = this.isAnySeriesActive();
        this.crossLines.forEach((crossLine) => {
            crossLine.update(anySeriesActive);
        });
    }

    protected updatePosition() {
        const { crossLineRangeGroup, crossLineLineGroup, crossLineLabelGroup, gridGroup, translation } = this;
        const translationX = Math.floor(translation.x);
        const translationY = Math.floor(translation.y);

        gridGroup.setProperties({ translationX, translationY });
        crossLineRangeGroup.setProperties({ translationX, translationY });
        crossLineLineGroup.setProperties({ translationX, translationY });
        crossLineLabelGroup.setProperties({ translationX, translationY });
    }

    protected abstract updateSelections(): void;

    protected abstract updateLabels(): void;

    abstract tickFormatParams(
        domain: D[],
        ticks: D[],
        fractionDigits: number | undefined,
        timeInterval: TimeInterval | TimeIntervalUnit | undefined
    ): AxisTickFormatParams;

    abstract datumFormatParams(
        value: any,
        params: FormatDatumParams,
        fractionDigits: number | undefined,
        timeInterval: TimeInterval | TimeIntervalUnit | undefined,
        timeStyle: 'long' | 'component'
    ): FormatterParams<any, any>;

    // For formatting (nice rounded) tick values.
    tickFormatter(
        domain: D[],
        ticks: D[],
        primary: boolean,
        inputFractionDigits?: number,
        inputTimeInterval?: TimeInterval | TimeIntervalUnit,
        timeStyle: DateFormatterStyle = 'long'
    ): (value: any, index: number) => string {
        const { moduleCtx } = this;
        const { formatManager } = moduleCtx;
        const label = primary ? this.primaryLabel ?? this.label : this.label;

        const formatParams = this.tickFormatParams(domain, ticks, inputFractionDigits, inputTimeInterval);
        const boundSeries = this.getFormatterBoundSeries();

        return (value: any, index: number): string => {
            const { type, fractionDigits, unit, includeYear = true } = formatParams;

            const labelValue = label.formatValue(
                this.callWithContext.bind(this),
                type,
                value,
                index,
                domain,
                boundSeries,
                fractionDigits,
                unit,
                !includeYear && timeStyle === 'long' ? 'fixed-year-long' : timeStyle
            );
            if (labelValue != null) return String(labelValue);

            const params: FormatDatumParams = {
                datum: undefined,
                key: undefined,
                source: 'axis',
                property: this.direction,
            };

            return (
                formatManager.format(this.datumFormatParams(value, params, fractionDigits, unit, timeStyle)) ??
                this.defaultLabelFormatter(value, fractionDigits ?? 0)
            );
        };
    }

    // For formatting arbitrary values between the ticks.
    formatDatum(value: any, source: 'axis' | 'crosshair'): string;
    formatDatum(value: any, source: 'tooltip' | 'series-label', datum: any, key: string): string;
    formatDatum<Params extends object>(
        value: any,
        source: 'axis' | 'crosshair',
        datum: undefined,
        key: undefined,
        label: AxisFormattableLabel<Params>,
        labelParams: Params
    ): string;
    formatDatum<Params extends object>(
        value: any,
        source: 'tooltip' | 'series-label',
        datum: any,
        key: string,
        label: AxisFormattableLabel<Params>,
        labelParams: Params
    ): string;
    formatDatum(
        value: any,
        source: AnyFormatterSource,
        datum?: any,
        key?: string,
        label?: AxisFormattableLabel<any>,
        params?: any,
        formatInContext: (
            fn: (params: any) => string | undefined,
            params: any
        ) => string | undefined = this.callWithContext.bind(this)
    ): string {
        if (value == null) return '';

        let fractionDigits = this.layout.label.fractionDigits;
        if (fractionDigits !== 0) {
            fractionDigits += additionalFractionDigits[source];
        }

        const { moduleCtx, direction, scale } = this;
        const { formatManager } = moduleCtx;
        const { domain } = scale;
        const boundSeries = this.getFormatterBoundSeries();
        const formatParams = this.datumFormatParams(
            value,
            { source, datum, key, property: direction },
            fractionDigits,
            undefined,
            'long'
        );
        const unit = formatParams.type === 'date' ? formatParams.unit : undefined;
        return (
            label?.formatValue(formatInContext, formatParams.type, value, params) ??
            this.label.formatValue(
                formatInContext,
                formatParams.type,
                value,
                NaN,
                domain,
                boundSeries,
                fractionDigits,
                unit,
                'long'
            ) ??
            formatManager.format(formatParams) ??
            this.datumFormatter?.(value) ??
            this.defaultLabelFormatter(value, fractionDigits)
        );
    }

    getBBox(): BBox {
        return this.axisGroup.getBBox();
    }

    private initCrossLine(crossLine: CrossLine) {
        crossLine.scale = this.scale;
        crossLine.gridLength = this.gridLength;
    }

    protected isAnySeriesActive() {
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
            continuous: ContinuousScale.is(scale) || DiscreteTimeScale.is(scale),
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
            scaleInvert: (val) => scale.invert(val, true),
            scaleInvertNearest: (val) => scale.invert(val, true),
            formatScaleValue: (value, source, label) =>
                this.formatDatum(value, source, undefined, undefined, label!, undefined!),
            attachLabel: (node: Node) => this.attachLabel(node),
            inRange: (value, tolerance) => this.inRange(value, tolerance),
            getRangeOverflow: (value) => this.getRangeOverflow(value),
        };
    }

    isReversed() {
        return this.reverse;
    }

    protected callWithContext<F extends AnyFn>(fn: F, ...params: Parameters<F>): ReturnType<F> | undefined {
        const { callbackCache, chartService } = this.moduleCtx;
        return callbackCache.call([this, chartService], fn, ...params);
    }
}
