import type { AxisID, ChartAnimationPhase, DomainWithMetadata, Scale } from 'ag-charts-core';
import {
    type Callback,
    type CallbackParam,
    ChartAxisDirection,
    CleanupRegistry,
    ObserveChanges,
    type Point,
    Property,
    type RequireOptional,
    WeakCache,
    ZIndexMap,
    callWithContext,
    clampArray,
    deepFreeze,
    findMinMax,
    findRangeExtent,
    isArray,
    mergeDefaults,
} from 'ag-charts-core';
import type {
    AgAxisBoundSeries,
    AgBaseAxisLabelStyleOptions,
    AgTimeInterval,
    AgTimeIntervalUnit,
    AnyFormatterSource,
    CssColor,
    DateFormatterStyle,
    FormatterParams,
    FormatterPropertyType,
    TextOrSegments,
} from 'ag-charts-types';

import type { AxisLayout } from '../../core/eventsHub';
import type { AxisBandDatum, AxisBandMeasurement, AxisContext, AxisFormattableLabel } from '../../module/axisContext';
import type { ModuleContext, ModuleContextWithParent } from '../../module/moduleContext';
import { ModuleMap } from '../../module/moduleMap';
import { BandScale } from '../../scale/bandScale';
import { ContinuousScale } from '../../scale/continuousScale';
import { DiscreteTimeScale } from '../../scale/discreteTimeScale';
import { BBox } from '../../scene/bbox';
import { Group, TransformableGroup, TranslatableGroup } from '../../scene/group';
import type { Node } from '../../scene/node';
import { Selection } from '../../scene/selection';
import { type TextBoxingProperties, type TextSizeProperties, TransformableText } from '../../scene/shape/text';
import { Transformable } from '../../scene/transformable';
import type { AxisPrimaryTickCount } from '../../util/secondaryAxisTicks';
import type { MouseWidgetEvent } from '../../widget/widgetEvents';
import type { AxisGroups, ChartAxis, ChartLayout, FormatDatumParams } from '../chartAxis';
import { CartesianCrossLine } from '../crossline/cartesianCrossLine';
import type { CrossLine } from '../crossline/crossLine';
import { FormatManager } from '../formatter/formatManager';
import type { DatumIndexType, IProperties, ISeries } from '../series/seriesTypes';
import { AxisGridLine } from './axisGridLine';
import { AxisInterval } from './axisInterval';
import { AxisLabel } from './axisLabel';
import { AxisLine } from './axisLine';
import { AxisTick, type TickInterval } from './axisTick';
import { AxisTitle } from './axisTitle';
import { NiceMode } from './axisUtil';
import type { AnyTimeInterval } from './generateTicksUtils';

export interface LabelNodeDatum extends TextSizeProperties, TextBoxingProperties {
    color?: CssColor;
    tickId: string;
    rotation: number;
    text: TextOrSegments;
    textBaseline: CanvasTextBaseline;
    textUntruncated?: string;
    visible: boolean;
    x: number;
    y: number;
    rotationCenterX: number;
    rotationCenterY: number;
    range: number[];
}

export enum AxisGroupZIndexMap {
    TickLines,
    // eslint-disable-next-line @typescript-eslint/no-shadow
    AxisLine,
    TickLabels,
}

export type AxisTickFormatParams =
    | {
          type: 'number';
          fractionDigits: number | undefined;
          visibleDomain?: [number, number];
      }
    | {
          type: 'date';
          unit: AgTimeIntervalUnit;
          step: number;
          epoch: Date | undefined;
          truncateDate?: 'year' | 'month' | 'day';
      }
    | {
          type: 'category';
      };

interface TickLayout<D, TickLayoutMeta> {
    niceDomain: D[];
    tickDomain: D[];
    ticks: D[];
    rawTickCount: number | undefined;
    fractionDigits: number;
    timeInterval: AnyTimeInterval | undefined;
    bbox?: BBox;
    layout?: TickLayoutMeta;
}

interface TickLayoutCache<D, TickLayoutMeta> {
    domain: D[];
    rangeExtent: number;
    nice: [boolean, boolean];
    gridLength: number;
    visibleRange: [number, number];
    initialPrimaryTickCount: AxisPrimaryTickCount | undefined;
    tickLayout: TickLayout<D, TickLayoutMeta>;
}

function tickLayoutCacheValid<D, TickLayoutMeta>(
    a: TickLayoutCache<D, TickLayoutMeta>,
    b: Omit<TickLayoutCache<D, TickLayoutMeta>, 'tickLayout'>
): boolean {
    return (
        a.domain === b.domain &&
        a.rangeExtent === b.rangeExtent &&
        a.nice[0] === b.nice[0] &&
        a.nice[1] === b.nice[1] &&
        a.gridLength === b.gridLength &&
        a.visibleRange[0] === b.visibleRange[0] &&
        a.visibleRange[1] === b.visibleRange[1] &&
        a.initialPrimaryTickCount?.unzoomed === b.initialPrimaryTickCount?.unzoomed &&
        a.initialPrimaryTickCount?.zoomed === b.initialPrimaryTickCount?.zoomed
    );
}

function computeBand<D, I>(
    scale: BandScale<D, I>,
    range: readonly [number, number],
    value: D
): [number, number, number] {
    const bandwidth = scale.bandwidth ?? 0;
    const step = scale.step ?? 0;
    const offset = (step - bandwidth) / 2;

    const position = scale.convert(value);

    const start = position - offset;
    const end = position + bandwidth + offset;

    return [position, clampArray(start, range), clampArray(end, range)];
}

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
    TickLayoutMeta = any,
> implements ChartAxis
{
    static readonly defaultTickMinSpacing = 50;

    protected static CrossLineConstructor: new () => CrossLine<any> = CartesianCrossLine;

    id: AxisID = 'unknown' as AxisID;

    private _crossLines: CrossLine[] = [];
    set crossLines(value: CrossLine[]) {
        const { CrossLineConstructor } = this.constructor as typeof Axis;
        for (const crossLine of this._crossLines) {
            this.detachCrossLine(crossLine);
        }
        this._crossLines = value.map((crossLine) => {
            const instance = new CrossLineConstructor();
            instance.set(crossLine);
            return instance;
        });
        for (const crossLine of this._crossLines) {
            this.attachCrossLine(crossLine);
            this.initCrossLine(crossLine);
        }
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

    boundSeries: ISeries<DatumIndexType, unknown, IProperties>[] = [];
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
    protected readonly gridFillGroup = this.gridGroup.appendChild(new Group({ name: `${this.id}-gridFills` }));
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

    protected tickLabelGroupSelection = Selection.select<TransformableText, LabelNodeDatum>(
        this.tickLabelGroup,
        TransformableText,
        false
    );

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

    isCategoryLike(): boolean {
        return false;
    }

    defaultTickMinSpacing: number = Axis.defaultTickMinSpacing;

    readonly translation = { x: 0, y: 0 };

    protected readonly layout: Pick<AxisLayout, 'label'> & Partial<Pick<AxisLayout, 'labelThickness' | 'scrollbar'>> = {
        label: {
            fractionDigits: 0,
            spacing: this.label.spacing,
            format: this.label.format,
        },
        labelThickness: 0,
    };

    protected axisContext: AxisContext | undefined = undefined;

    protected readonly cleanup = new CleanupRegistry();

    constructor(
        protected readonly moduleCtx: ModuleContext,
        readonly scale: S
    ) {
        this.range = this.scale.range.slice() as [number, number];
        for (const crossLine of this.crossLines) {
            this.initCrossLine(crossLine);
        }
        this.cleanup.register(
            this.moduleCtx.widgets.containerWidget.addListener('mousemove', (e) => this.onMouseMove(e)),
            this.moduleCtx.widgets.containerWidget.addListener('mouseleave', () => this.endHovering())
        );
    }

    resetAnimation(_phase: ChartAnimationPhase) {
        // Override in classes
    }

    // AG-15360 Avoid calling removeTooltip() if no tooltip is shown. This avoid a laggy tooltips caused by interference
    // with SeriesAreaManager's tooltip updates.
    private isHovering = false;

    private onMouseMove(event: MouseWidgetEvent<'mousemove'>) {
        const node = this.tickLabelGroup.pickNode(event.currentX, event.currentY);
        const datum: LabelNodeDatum | undefined = node?.datum;
        const { textUntruncated: title = undefined } = datum ?? {};

        if (title) {
            this.moduleCtx.tooltipManager.updateTooltip(
                this.id,
                { canvasX: event.currentX, canvasY: event.currentY, showArrow: false },
                [{ type: 'structured', title }]
            );
            this.isHovering = true;
        } else {
            this.endHovering();
        }
    }

    private endHovering() {
        if (this.isHovering) {
            this.moduleCtx.tooltipManager.removeTooltip(this.id, undefined, true); // true = delayed
            this.isHovering = false;
        }
    }

    private attachCrossLine(crossLine: CrossLine) {
        this.crossLineRangeGroup.appendChild(crossLine.rangeGroup);
        this.crossLineLineGroup.appendChild(crossLine.lineGroup);
        this.crossLineLabelGroup.appendChild(crossLine.labelGroup);
    }

    private detachCrossLine(crossLine: CrossLine) {
        crossLine.rangeGroup.remove();
        crossLine.lineGroup.remove();
        crossLine.labelGroup.remove();
    }

    destroy() {
        this.moduleMap.destroy();
        this.cleanup.flush();
    }

    private setScaleRange(visibleRange: [number, number]) {
        const { range: rr, scale } = this;
        const span = (rr[1] - rr[0]) / (visibleRange[1] - visibleRange[0]);
        const shift = span * visibleRange[0];
        const start = rr[0] - shift;

        scale.range = [start, start + span];
    }

    protected updateScale() {
        const {
            range: [r0, r1],
        } = this;

        this.setScaleRange(this.visibleRange);
        for (const crossLine of this.crossLines) {
            crossLine.clippedRange = [r0, r1];
        }
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

    detachAxis() {
        this.gridGroup.remove();
        this.axisGroup.remove();
        this.labelGroup.remove();
        this.crossLineRangeGroup.remove();
        this.crossLineLineGroup.remove();
        this.crossLineLabelGroup.remove();
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

    protected onGridLengthChange(value: number, prevValue: number) {
        // Was visible and now invisible, or was invisible and now visible.
        if (prevValue ^ value) {
            this.onGridVisibilityChange();
        }
        for (const crossLine of this.crossLines) {
            this.initCrossLine(crossLine);
        }
    }

    protected onGridVisibilityChange() {}

    protected createLabel() {
        return new AxisLabel();
    }

    /**
     * Creates/removes/updates the scene graph nodes that constitute the axis.
     */
    update() {
        this.formatterBoundSeries.clear();

        this.updatePosition();
        this.updateSelections();

        this.gridLineGroup.visible = this.gridLine.enabled;

        this.updateLabels();
        this.updateCrossLines();
    }

    protected getLabelStyles(
        params: { value: number; formattedValue: TextOrSegments | undefined; depth?: number },
        additionalStyles?: AgBaseAxisLabelStyleOptions,
        label: AxisLabel = this.label
    ) {
        const defaultStyle = {
            border: label.border,
            color: label.color,
            cornerRadius: label.cornerRadius,
            fill: label.fill,
            fillOpacity: label.fillOpacity,
            fontFamily: label.fontFamily,
            fontSize: label.fontSize,
            fontStyle: label.fontStyle,
            fontWeight: label.fontWeight,
            padding: label.padding,
            spacing: label.spacing,
        } satisfies RequireOptional<AgBaseAxisLabelStyleOptions>;
        let stylerOutput: AgBaseAxisLabelStyleOptions | undefined;
        if (label.itemStyler) {
            stylerOutput = this.cachedCallWithContext(label.itemStyler, {
                ...params,
                ...defaultStyle,
            });
        }
        const merged = mergeDefaults(stylerOutput, additionalStyles, defaultStyle);
        return {
            border: merged.border,
            color: merged.color,
            cornerRadius: merged.cornerRadius,
            fill: merged.fill,
            fillOpacity: merged.fillOpacity,
            fontFamily: merged.fontFamily,
            fontSize: merged.fontSize,
            fontStyle: merged.fontStyle,
            fontWeight: merged.fontWeight,
            padding: merged.padding,
            spacing: merged.spacing,
        } satisfies RequireOptional<AgBaseAxisLabelStyleOptions>;
    }

    protected getTickSize(tick: AxisTick = this.tick) {
        return tick.enabled ? tick.size : 0;
    }

    processData() {
        // Invalidate layout cache
        this.invalidateLayoutCache();

        const { includeInvisibleDomains, boundSeries, direction } = this;
        const visibleSeries = includeInvisibleDomains ? boundSeries : boundSeries.filter((s) => s.isEnabled());
        const domains = visibleSeries.map((series) => series.getDomain(direction));
        this.setDomains(...domains);
    }

    getDomainExtentsNice(): [boolean, boolean] {
        return [this.nice, this.nice];
    }

    protected animatable = true;
    setDomains(...domains: DomainWithMetadata<D>[]) {
        let normalizedDomain: DomainWithMetadata<D>;
        let animatable: boolean;
        if (domains.length > 0) {
            const result = this.scale.normalizeDomains(...domains);
            // After normalization, ordinal time domains are always sorted ascending
            normalizedDomain = { domain: result.domain, sortMetadata: { sortOrder: 1 } };
            animatable = result.animatable;
        } else {
            // Series (or all series in a group) hidden
            // There could be multiple axes, so we still consider this to be animatable
            normalizedDomain = { domain: [] };
            animatable = true;
        }

        this.dataDomain = this.normaliseDataDomain(normalizedDomain);

        if (this.reverse) {
            this.dataDomain.domain.reverse();
        }

        this.animatable = animatable;
    }

    protected chartLayout?: ChartLayout;

    private unzoomedTickLayoutCache: TickLayoutCache<D, TickLayoutMeta> | undefined;
    calculateDomain(initialPrimaryTickCount?: AxisPrimaryTickCount) {
        const {
            dataDomain: { domain },
            range,
            scale,
            gridLength,
        } = this;
        const rangeExtent = findRangeExtent(range);
        const visibleRange = [0, 1] as [number, number];

        const nice = this.getDomainExtentsNice();

        this.updateScale();

        const { unzoomedTickLayoutCache } = this;
        let unzoomedTickLayout: TickLayout<D, TickLayoutMeta>;
        if (
            unzoomedTickLayoutCache == null ||
            !tickLayoutCacheValid(unzoomedTickLayoutCache, {
                domain,
                rangeExtent,
                nice,
                gridLength,
                visibleRange,
                initialPrimaryTickCount,
            })
        ) {
            const scaleRange = scale.range;
            this.setScaleRange([0, 1]);

            const niceMode = nice.map((n) => (n ? NiceMode.TickAndDomain : NiceMode.Off));
            unzoomedTickLayout = this.calculateTickLayout(domain, niceMode, [0, 1], initialPrimaryTickCount);

            scale.range = scaleRange;

            this.unzoomedTickLayoutCache = {
                domain,
                rangeExtent,
                nice,
                gridLength,
                visibleRange,
                initialPrimaryTickCount,
                tickLayout: unzoomedTickLayout,
            };
        } else {
            unzoomedTickLayout = unzoomedTickLayoutCache.tickLayout;
        }

        this.updateScale();

        scale.domain = unzoomedTickLayout.niceDomain;

        return { unzoomedTickLayout, domain: scale.domain };
    }

    private tickLayoutCache: TickLayoutCache<D, TickLayoutMeta> | undefined;
    protected tickLayout: TickLayoutMeta | undefined = undefined;
    calculateLayout(
        initialPrimaryTickCount?: AxisPrimaryTickCount,
        chartLayout?: ChartLayout
    ): {
        primaryTickCount?: AxisPrimaryTickCount;
        bbox?: BBox;
    } {
        this.chartLayout = chartLayout;

        const { visibleRange } = this;
        const unzoomed = visibleRange[0] === 0 && visibleRange[1] === 1;
        const { unzoomedTickLayout, domain } = this.calculateDomain(initialPrimaryTickCount);

        const nice = this.getDomainExtentsNice();

        let tickLayout: TickLayout<D, TickLayoutMeta>;
        if (unzoomed) {
            tickLayout = unzoomedTickLayout;
        } else {
            const { range, gridLength } = this;
            const rangeExtent = findRangeExtent(range);
            const niceMode = nice.map((n) => (n ? NiceMode.TicksOnly : NiceMode.Off));
            const { tickLayoutCache } = this;
            if (
                tickLayoutCache == null ||
                !tickLayoutCacheValid(tickLayoutCache, {
                    domain,
                    rangeExtent,
                    nice,
                    gridLength,
                    visibleRange,
                    initialPrimaryTickCount,
                })
            ) {
                tickLayout = this.calculateTickLayout(domain, niceMode, visibleRange, initialPrimaryTickCount);

                this.tickLayoutCache = {
                    domain,
                    rangeExtent,
                    nice,
                    gridLength,
                    visibleRange,
                    initialPrimaryTickCount,
                    tickLayout,
                };
            } else {
                tickLayout = tickLayoutCache.tickLayout;
            }
        }

        const { rawTickCount: zoomedTickCount = 0, fractionDigits, bbox } = tickLayout;
        const unzoomedTickCount = unzoomedTickLayout.rawTickCount ?? 0;

        const primaryTickCount: AxisPrimaryTickCount | undefined =
            zoomedTickCount !== 0 && unzoomedTickCount !== 0
                ? { zoomed: zoomedTickCount, unzoomed: unzoomedTickCount }
                : undefined;

        this.tickLayout = tickLayout.layout;
        this.layout.label = {
            fractionDigits: fractionDigits,
            spacing: this.label.spacing,
            format: this.label.format,
        };

        this.layoutCrossLines();

        return { primaryTickCount, bbox };
    }

    private invalidateLayoutCache() {
        this.unzoomedTickLayoutCache = undefined;
        this.tickLayoutCache = undefined;
        this.tickLayout = undefined;
    }

    abstract layoutCrossLines(): void;

    abstract calculateTickLayout(
        domain: D[],
        niceMode: NiceMode[],
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

    abstract hasDefinedDomain(): boolean;

    protected updateCrossLines() {
        const crosslinesVisible = this.hasDefinedDomain() || this.hasVisibleSeries();
        for (const crossLine of this.crossLines) {
            crossLine.update(crosslinesVisible);
        }
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
        timeInterval: AgTimeInterval | AgTimeIntervalUnit | undefined
    ): AxisTickFormatParams;

    abstract datumFormatParams(
        value: any,
        params: FormatDatumParams,
        fractionDigits: number | undefined,
        timeInterval: AgTimeInterval | AgTimeIntervalUnit | undefined,
        dateStyle: 'long' | 'component'
    ): FormatterParams<any>;

    // For formatting (nice rounded) tick values.
    tickFormatter(
        domain: D[],
        ticks: D[],
        primary: boolean,
        inputFractionDigits?: number,
        inputTimeInterval?: AgTimeInterval | AgTimeIntervalUnit,
        dateStyle: DateFormatterStyle = 'long'
    ): (value: any, index: number) => TextOrSegments {
        const { moduleCtx, label } = this;
        const { formatManager } = moduleCtx;
        const primaryLabel = primary ? this.primaryLabel : undefined;

        const tickFormatParams = this.tickFormatParams(domain, ticks, inputFractionDigits, inputTimeInterval);
        const boundSeries = this.formatterBoundSeries.get();

        let fractionDigits: number | undefined;
        let timeInterval: AgTimeInterval | undefined;
        let truncateDate: 'year' | 'month' | 'day' | undefined;
        if (tickFormatParams.type === 'number') {
            fractionDigits = tickFormatParams.fractionDigits;
        } else if (tickFormatParams.type === 'date') {
            const { unit, step, epoch } = tickFormatParams;
            timeInterval = { unit, step, epoch };
            truncateDate = tickFormatParams.truncateDate;
        }

        // The serialization required for caching is too slow for large category domains
        const f = this.uncachedCallWithContext.bind(this);

        const params: FormatDatumParams = {
            datum: undefined,
            seriesId: undefined,
            legendItemName: undefined,
            key: undefined,
            source: 'axis-label',
            property: this.getFormatterProperty(),
            domain,
            boundSeries,
        };

        const currentLabel = primaryLabel ?? label;
        const specifier = primary ? label.format : undefined;

        const options = {
            specifier: FormatManager.mergeSpecifiers(primaryLabel?.format, label.format),
            truncateDate,
        };

        return (value: any, index: number): TextOrSegments => {
            const formatParams = this.datumFormatParams(value, params, fractionDigits, timeInterval, dateStyle);
            // For time axis, the datum is aligned. However, for ticks, we don't want to align the datum.
            formatParams.value = value;

            return (
                currentLabel.formatValue(f, formatParams, index, { specifier, dateStyle, truncateDate }) ??
                formatManager.format(f, formatParams, options) ??
                formatManager.defaultFormat(formatParams, options)
            );
        };
    }

    // For formatting arbitrary values between the ticks.
    formatDatum(
        contextProvider: { context?: unknown },
        value: any,
        source: 'tooltip' | 'series-label',
        seriesId: string,
        legendItemName: string | undefined,
        datum: any,
        key: string
    ): string;
    formatDatum<Params extends object>(
        contextProvider: { context?: unknown } | undefined,
        value: any,
        source: 'crosshair' | 'annotation-label',
        seriesId: undefined,
        legendItemName: undefined,
        datum: undefined,
        key: undefined,
        domain: undefined,
        label?: AxisFormattableLabel<Params, FormatterParams<any>>
    ): string;
    formatDatum<Params extends object>(
        contextProvider: { context?: unknown } | undefined,
        value: any,
        source: 'tooltip' | 'series-label',
        seriesId: string,
        legendItemName: string | undefined,
        datum: any,
        key: string,
        domain: any[],
        label: AxisFormattableLabel<Params>,
        labelParams: Params
    ): string;
    formatDatum(
        contextProvider: { context?: unknown } | undefined,
        input: any,
        source: Exclude<AnyFormatterSource, 'axis-label' | 'gradient-legend'>,
        seriesId?: string,
        legendItemName?: string,
        datum?: any,
        key?: string,
        domain?: any[],
        label?: AxisFormattableLabel<any>,
        params?: any
    ): TextOrSegments {
        if (input == null) return '';

        const { moduleCtx, dataDomain } = this;
        domain ??= dataDomain.domain;
        const { formatManager } = moduleCtx;
        const boundSeries = this.formatterBoundSeries.get();

        let inputFractionDigits: number | undefined;
        switch (source) {
            case 'crosshair':
            case 'annotation-label':
                inputFractionDigits = this.layout.label.fractionDigits + 1;
                break;
            case 'series-label':
                inputFractionDigits = 2;
                break;
            case 'tooltip':
                inputFractionDigits = 3;
                break;
            case 'legend-label':
                inputFractionDigits = undefined;
                break;
        }

        const formatParams = this.datumFormatParams(
            input,
            {
                source,
                datum,
                seriesId,
                legendItemName,
                key,
                property: this.getFormatterProperty(),
                domain,
                boundSeries,
            },
            inputFractionDigits,
            undefined,
            'long'
        );
        const { type, value } = formatParams;

        const f = this.createCallWithContext(contextProvider);
        const result =
            label?.formatValue(f, type, value, params ?? formatParams) ??
            formatManager.format(f, formatParams) ??
            this.label.formatValue(f, formatParams, Number.NaN) ??
            formatManager.defaultFormat(formatParams);

        return isArray(result) ? result : String(result);
    }

    getBBox(): BBox {
        return this.axisGroup.getBBox();
    }

    private initCrossLine(crossLine: CrossLine) {
        crossLine.scale = this.scale;
        crossLine.gridLength = this.gridLength;
    }

    protected hasVisibleSeries() {
        return this.boundSeries.some((s) => s.isEnabled());
    }

    clipTickLines(x: number, y: number, width: number, height: number) {
        this.tickLineGroup.setClipRect(new BBox(x, y, width, height));
    }

    clipGrid(x: number, y: number, width: number, height: number) {
        this.gridGroup.setClipRect(new BBox(x, y, width, height));
    }

    private readonly formatterBoundSeries = new WeakCache<AgAxisBoundSeries[]>(() => {
        const { direction, boundSeries } = this;
        return deepFreeze(boundSeries.flatMap((series) => series.getFormatterContext(direction)));
    });

    private getFormatterProperty(): FormatterPropertyType {
        const { direction, boundSeries } = this;
        let resolvedDirection = direction;
        for (const series of boundSeries) {
            const seriesResolvedDirection = series.resolveKeyDirection(direction);
            if (seriesResolvedDirection !== direction) {
                resolvedDirection = seriesResolvedDirection;
                break;
            }
        }

        return resolvedDirection;
    }

    protected getTitleFormatterParams(domain: D[]) {
        const { direction } = this;
        const boundSeries = this.formatterBoundSeries.get();
        return { domain, direction, boundSeries, defaultValue: this.title?.text };
    }

    protected normaliseDataDomain(d: DomainWithMetadata<D>): { domain: D[]; clipped: boolean } {
        return { domain: [...d.domain], clipped: false };
    }

    protected getLayoutTranslation(): { x: number; y: number } {
        return this.translation;
    }

    getLayoutState(): AxisLayout {
        return {
            id: this.id,
            rect: this.getBBox(),
            translation: this.getLayoutTranslation(),
            gridPadding: this.gridPadding,
            seriesAreaPadding: this.seriesAreaPadding,
            tickSize: this.getTickSize(),
            direction: this.direction,
            domain: this.dataDomain.domain,
            scale: this.scale,
            ...this.layout,
        };
    }

    private readonly moduleMap = new ModuleMap();

    getModuleMap() {
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
                    for (const key of seriesKeys) {
                        keys.add(key);
                    }
                    return keys;
                }, new Set<string>()),
            seriesIds: () => this.boundSeries.map((series) => series.id),
            scaleInvert: (val) => scale.invert(val, true),
            scaleInvertNearest: (val) => scale.invert(val, true),
            formatScaleValue: (value, source, label) =>
                this.formatDatum(
                    undefined,
                    value,
                    source,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    label
                ),
            attachLabel: (node: Node) => this.attachLabel(node),
            inRange: (value, tolerance) => this.inRange(value, tolerance),
            getRangeOverflow: (value) => this.getRangeOverflow(value),
            pickBand: (point) => this.pickBand(point),
            measureBand: (value) => this.measureBand(value),
        };
    }

    pickBand(point: Point): AxisBandDatum | undefined {
        if (!BandScale.is(this.scale)) {
            return;
        }

        const { scale, range, id } = this;

        const value = scale.invert(this.isVertical() ? point.y : point.x, true);
        const [position, start, end] = computeBand(scale, range, value);
        return { id, value, band: [start, end], position };
    }

    measureBand(value: string): AxisBandMeasurement | undefined {
        if (!BandScale.is(this.scale)) {
            return;
        }

        const [, start, end] = computeBand(this.scale, this.range, value);
        return { band: [start, end] };
    }

    private isVertical() {
        return this.direction === ChartAxisDirection.Y;
    }

    isReversed() {
        return this.reverse;
    }

    protected cachedCallWithContext<F extends Callback>(fn: F, params: CallbackParam<F>): ReturnType<F> | undefined {
        const { callbackCache, chartService } = this.moduleCtx;
        return callbackCache.call([this, chartService], fn, params);
    }

    private uncachedCallWithContext<F extends Callback>(fn: F, params: CallbackParam<F>): ReturnType<F> | undefined {
        const { chartService } = this.moduleCtx;
        return callWithContext([this, chartService], fn, params);
    }

    private createCallWithContext(contextProvider: { context?: unknown } | undefined) {
        const { chartService } = this.moduleCtx;
        return <F extends Callback>(fn: F, params: CallbackParam<F>): ReturnType<F> =>
            callWithContext([contextProvider, this, chartService], fn, params);
    }
}
