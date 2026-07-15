import type {
    AxisID,
    AxisPluginModuleInstance,
    Callback,
    CallbackParam,
    ChartAnimationPhase,
    DomainWithMetadata,
    DynamicContext,
    Normalised,
    NormalisedAxisTickOptions,
    NormalisedBaseAxisLabelOptions,
    NormalisedBaseAxisOptions,
    NormalisedTextOrSegments,
    Point,
    Scale,
} from 'ag-charts-core';
import {
    ChartAxisDirection,
    ChartUpdateType,
    CleanupRegistry,
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
    AgAxisDomain,
    AgAxisValue,
    AgBaseAxisLabelStyleOptions,
    AgContextMenuGetItemsParamsAlways,
    AgContextMenuGetItemsParamsAxis,
    AgTimeAxisFormattableLabelUnitFormat,
    AgTimeInterval,
    AgTimeIntervalUnit,
    AnyFormatterSource,
    CssColor,
    DateFormatterStyle,
    FormatterParams,
    FormatterPropertyType,
} from 'ag-charts-types';

import type { AxisLayout } from '../../core/eventsHub';
import type {
    AxisBandDatum,
    AxisBandMeasurement,
    AxisContext,
    AxisFormattableLabel,
    AxisValuePick,
} from '../../module/axisContext';
import type { ChartAxisRegistry, ChartRegistry } from '../../module/moduleContext';
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
import { Caption } from '../caption';
import type { AxisGroups, ChartAxis, ChartLayout, FormatDatumParams } from '../chartAxis';
import type { CrossLine } from '../crossline/crossLine';
import { FormatManager } from '../formatter/formatManager';
import type { ISeries, ISeriesProperties, SeriesNodeDatum } from '../series/seriesTypes';
import { type AxisLabelFormatterCache, createAxisLabelFormatterCache, formatAxisLabelValue } from './axisLabelUtil';
import type { TickInterval } from './axisTick';
import { type AxisGroupDatumTranslation, NiceMode } from './axisUtil';
import type { AnyTimeInterval } from './generateTicksUtils';

export interface LabelNodeDatum extends TextSizeProperties, TextBoxingProperties {
    color?: CssColor;
    tickId: string;
    rotation: number;
    text: NormalisedTextOrSegments;
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
    scrollbarKey: string;
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
        a.scrollbarKey === b.scrollbarKey &&
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

function unsafeInvert(scale: Scale<unknown, unknown, unknown>, value: number): AgAxisValue {
    const result = scale.invert(value, true);
    return result as AgAxisValue;
}

function unsafeDomain(scale: Scale<unknown, unknown, unknown>): AgAxisDomain {
    return scale.domain as AgAxisDomain;
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
    TOptions extends NormalisedBaseAxisOptions = NormalisedBaseAxisOptions,
> implements ChartAxis<TOptions> {
    static readonly defaultTickMinSpacing = 50;

    readonly id: AxisID = 'unknown' as AxisID;

    /**
     * User pass-through option for callback resolution. Declared via `declare`
     * (not initialised) so the property is absent on instances that did not
     * receive a `context` option — `callbackCache.maybeSetContext` relies on
     * the `'context' in axis` check to decide whether to fall back to the
     * chartService's context.
     */
    declare context?: unknown;

    /**
     * `nice` is user-facing only on continuous axis types (`AgContinuousAxisOptions`),
     * but every axis subclass reads it (e.g. via `getDomainExtentsNice`). Treated as
     * an internal axis-instance field initialised from `options.nice` in the base
     * constructor; mini-chart and `CategoryAxis` mutate it directly.
     */
    nice: boolean = true;

    options: TOptions;

    /**
     * Internal axis state derived from `position` (cartesian) or layout direction
     * (gradient-legend). Not user-facing — absent from `ag-charts-types`. See I2.
     */
    mirrored: boolean = false;
    parallel: boolean = false;

    dataDomain: { domain: D[]; clipped: boolean } = { domain: [], clipped: false };
    private allowNull = false;

    readonly caption = new Caption();

    /**
     * The length of the grid. The grid is only visible in case of a non-zero value.
     * Use {@link setGridLength} to update so the grid-visibility callback fires.
     */
    private _gridLength: number = 0;

    get gridLength(): number {
        return this._gridLength;
    }

    set gridLength(value: number) {
        const previous = this._gridLength;
        this._gridLength = value;
        if (previous !== value) {
            this.onGridLengthChange(value, previous);
        }
    }

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

    /**
     * Backing field for {@link layoutConstraints}. Mutated in-place by the
     * `requiredRange` setter on {@link CategoryAxis}. Subclasses (notably
     * `CategoryAxis`) may override the getter to project `bandAlignment` onto
     * `align` without changing the stored object.
     */
    protected _layoutConstraints: ChartAxis['layoutConstraints'] = {
        stacked: true,
        align: 'justify',
        width: 100,
        unit: 'percent',
    };

    get layoutConstraints(): ChartAxis['layoutConstraints'] {
        return this._layoutConstraints;
    }

    /**
     * Backing field for the `requiredRange` accessor. Subclasses (notably
     * `CategoryAxis`) override the setter to react to changes; the base
     * implementation just stores the value.
     */
    protected _requiredRange?: number;

    get requiredRange(): number | undefined {
        return this._requiredRange;
    }

    set requiredRange(value: number | undefined) {
        this._requiredRange = value;
    }

    boundSeries: ISeries<SeriesNodeDatum, ISeriesProperties>[] = [];
    includeInvisibleDomains: boolean = false;

    interactionEnabled = true;

    protected readonly axisGroup = new Group({ name: `${this.id}-axis` });

    // Order is important to apply the correct z-index.
    protected readonly tickLineGroup = this.axisGroup.appendChild(
        new TransformableGroup<AxisGroupDatumTranslation>({
            name: `${this.id}-Axis-tick-lines`,
            zIndex: AxisGroupZIndexMap.TickLines,
        })
    );
    protected readonly tickLabelGroup = this.axisGroup.appendChild(
        new TransformableGroup<AxisGroupDatumTranslation>({
            name: `${this.id}-Axis-tick-labels`,
            zIndex: AxisGroupZIndexMap.TickLabels,
        })
    );
    protected readonly labelGroup = new Group({
        name: `${this.id}-Labels`,
        zIndex: ZIndexMap.SERIES_ANNOTATION,
    });

    readonly gridGroup = new TranslatableGroup({ name: `${this.id}-Axis-grid`, zIndex: ZIndexMap.AXIS_GRID });
    protected readonly gridFillGroup = this.gridGroup.appendChild(new Group({ name: `${this.id}-gridFills` }));
    protected readonly gridLineGroup = this.gridGroup.appendChild(new Group({ name: `${this.id}-gridLines` }));

    /**
     * Three z-index-ordered overlay container groups attached to the chart-level overlay zones
     * via {@link attachAxis}. Plugins (currently only the cross-lines plugin) anchor their per-axis
     * scene-graph contributions into these groups via {@link AxisContext.attachAxisOverlay}, which
     * keeps overlay rendering scoped to the axis's host chart (main chart vs navigator mini-chart)
     * without the axis itself knowing what gets drawn.
     */
    private readonly overlayLowGroup = new TransformableGroup<never>({
        name: `${this.id}-Overlay-Low`,
        zIndex: ZIndexMap.SERIES_CROSSLINE_RANGE,
    });
    private readonly overlayMidGroup = new TransformableGroup<never>({
        name: `${this.id}-Overlay-Mid`,
        zIndex: ZIndexMap.SERIES_CROSSLINE_LINE,
    });
    private readonly overlayHighGroup = new TransformableGroup<never>({
        name: `${this.id}-Overlay-High`,
        zIndex: ZIndexMap.SERIES_LABEL,
    });

    protected tickLabelGroupSelection = Selection.select<TransformableText<LabelNodeDatum>>(
        this.tickLabelGroup,
        TransformableText,
        false
    );

    protected readonly formatterCache: AxisLabelFormatterCache = createAxisLabelFormatterCache();

    protected get primaryLabel():
        | (NormalisedBaseAxisLabelOptions & {
              format?: string | Record<string, string> | AgTimeAxisFormattableLabelUnitFormat;
          })
        | undefined {
        return undefined;
    }

    protected get primaryTick(): NormalisedAxisTickOptions | undefined {
        return undefined;
    }

    /**
     * Returns the user-supplied label `format` specifier, or `undefined` if the axis's
     * label type does not carry one. Only formattable label subtypes (numeric, time,
     * formattable angle) declare `format` in `ag-charts-types`; per invariant I2 it is
     * not part of the base label type. Subclasses with format-bearing labels override
     * this hook; the base default is `undefined`.
     */
    protected getLabelFormat(): string | Record<string, string> | undefined {
        return undefined;
    }

    /**
     * Sibling of {@link getLabelFormat} for {@link primaryLabel}, used by axes with a
     * parent-level label tier (time-like axes). Default is `undefined`.
     */
    protected getPrimaryLabelFormat(): string | Record<string, string> | undefined {
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
            spacing: 5,
            format: undefined,
        },
        labelThickness: 0,
    };

    protected axisContext: AxisContext | undefined = undefined;
    private moduleContext?: DynamicContext<ChartAxisRegistry<AxisContext>>;

    protected readonly cleanup = new CleanupRegistry();

    constructor(
        protected readonly moduleCtx: DynamicContext<ChartRegistry>,
        id: AxisID,
        readonly scale: S,
        options: TOptions
    ) {
        this.id = id;
        this.options = options;
        // Only assign `context` when the user supplied one — a missing key
        // must leave the property absent so `'context' in axis` returns
        // `false` and chart-level context can fall through. See the field
        // declaration above.
        const userContext = (options as { context?: unknown }).context;
        if (userContext !== undefined) {
            this.context = userContext;
        }
        this.syncOptionDerivedState(options);
        this.range = this.scale.range.slice() as [number, number];
        this.cleanup.register(
            this.moduleCtx.widgets.containerWidget.addListener('mousemove', (e) => this.onMouseMove(e)),
            this.moduleCtx.widgets.containerWidget.addListener('mouseleave', () => this.endHovering())
        );
    }

    /**
     * Replace the axis options reference and re-derive any constructor-time
     * fields that depend on options. Called by `Chart.applyAxes` on the
     * matching-types update path so reactive `chart.update()` invocations
     * pick up changes to fields like `nice` and `layoutConstraints` instead
     * of using values frozen at axis construction.
     */
    applyOptions(options: TOptions): void {
        this.options = options;
        this.syncOptionDerivedState(options);
        // Tick layouts are cached by domain/range/nice, none of which capture label or tick option
        // changes; drop the cache so an updated configuration regenerates ticks and labels.
        this.invalidateLayoutCache();
    }

    private syncOptionDerivedState(options: TOptions): void {
        this.nice = (options as { nice?: boolean }).nice ?? true;
        const userLayoutConstraints = (options as { layoutConstraints?: Partial<ChartAxis['layoutConstraints']> })
            .layoutConstraints;
        if (userLayoutConstraints) {
            this._layoutConstraints = { ...this._layoutConstraints, ...userLayoutConstraints };
        }
    }

    resetAnimation(_phase: ChartAnimationPhase) {
        // Override in classes
    }

    // AG-15360 Avoid calling removeTooltip() if no tooltip is shown. This avoid a laggy tooltips caused by interference
    // with SeriesAreaManager's tooltip updates.
    private isHovering = false;

    private onMouseMove(event: MouseWidgetEvent<'mousemove'>) {
        const node = this.tickLabelGroup.pickNode(event.currentX, event.currentY);
        const datum: LabelNodeDatum | undefined = node?.unsafeDatum;
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

    destroy() {
        this.moduleMap.destroy();
        this.moduleContext?.destroy();
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
        this.setScaleRange(this.visibleRange);
        this.notifyAxisPlugins('onScaleChange');
    }

    attachAxis(groups: AxisGroups) {
        groups.gridNode.appendChild(this.gridGroup);
        groups.axisNode.appendChild(this.axisGroup);
        groups.labelNode.appendChild(this.labelGroup);
        groups.overlayLowNode.appendChild(this.overlayLowGroup);
        groups.overlayMidNode.appendChild(this.overlayMidGroup);
        groups.overlayHighNode.appendChild(this.overlayHighGroup);
    }

    detachAxis() {
        this.gridGroup.remove();
        this.axisGroup.remove();
        this.labelGroup.remove();
        this.overlayLowGroup.remove();
        this.overlayMidGroup.remove();
        this.overlayHighGroup.remove();
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
        this.notifyAxisPlugins('onGridChange');
    }

    protected onGridVisibilityChange() {}

    /**
     * Creates/removes/updates the scene graph nodes that constitute the axis.
     */
    update() {
        this.formatterBoundSeries.clear();

        this.updatePosition();
        this.updateSelections();

        this.gridLineGroup.visible = this.options.gridLine.enabled;

        this.updateLabels();
        this.notifyAxisPlugins('onAxisUpdate');
    }

    protected getLabelStyles(
        params: { value: number; formattedValue: NormalisedTextOrSegments | undefined; depth?: number },
        additionalStyles?: AgBaseAxisLabelStyleOptions,
        label: NormalisedBaseAxisLabelOptions = this.options.label
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
        } satisfies Normalised<AgBaseAxisLabelStyleOptions, 'fontSize' | 'fontFamily' | 'spacing'>;
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
        } satisfies Normalised<AgBaseAxisLabelStyleOptions, 'fontSize' | 'fontFamily' | 'spacing'>;
    }

    protected getTickSize(tick: { enabled: boolean; size: number } = this.options.tick) {
        return tick.enabled ? tick.size : 0;
    }

    protected getTickSpacing(tick: { enabled: boolean } = this.options.tick) {
        if (!tick.enabled) return 0;

        const scrollbar = this.chartLayout?.scrollbars?.[this.id];
        if (!scrollbar?.enabled || scrollbar.placement !== 'inner') return 0;

        return scrollbar.tickSpacing ?? 0;
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
        this.allowNull = this.dataDomain.domain.some(function (v) {
            return v == null;
        });

        if (this.options.reverse) {
            this.dataDomain = { ...this.dataDomain, domain: this.dataDomain.domain.toReversed() };
        }

        this.animatable = animatable;
    }

    protected chartLayout?: ChartLayout;
    private unzoomedTickLayoutCache: TickLayoutCache<D, TickLayoutMeta> | undefined;
    calculateDomain(initialPrimaryTickCount?: AxisPrimaryTickCount, scrollbarKey: string = 'none') {
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
                scrollbarKey,
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
                scrollbarKey,
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
        const scrollbarKey = this.getScrollbarLayoutCacheKey(chartLayout);

        const { visibleRange } = this;
        const unzoomed = visibleRange[0] === 0 && visibleRange[1] === 1;
        const { unzoomedTickLayout, domain } = this.calculateDomain(initialPrimaryTickCount, scrollbarKey);

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
                    scrollbarKey,
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
                    scrollbarKey,
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
            spacing: this.options.label.spacing,
            format: this.getLabelFormat(),
        };

        this.notifyAxisPlugins('onAxisLayout');

        return { primaryTickCount, bbox };
    }

    private invalidateLayoutCache() {
        this.unzoomedTickLayoutCache = undefined;
        this.tickLayoutCache = undefined;
        this.tickLayout = undefined;
    }

    private getScrollbarLayoutCacheKey(chartLayout?: ChartLayout): string {
        const scrollbar = chartLayout?.scrollbars?.[this.id];
        if (!scrollbar?.enabled) return 'none';
        return `${scrollbar.placement}:${scrollbar.spacing}:${scrollbar.thickness}:${scrollbar.tickSpacing}`;
    }

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

    protected updatePosition() {
        const { gridGroup, overlayLowGroup, overlayMidGroup, overlayHighGroup, translation } = this;
        const translationX = Math.floor(translation.x);
        const translationY = Math.floor(translation.y);

        gridGroup.setProperties({ translationX, translationY });
        overlayLowGroup.setProperties({ translationX, translationY });
        overlayMidGroup.setProperties({ translationX, translationY });
        overlayHighGroup.setProperties({ translationX, translationY });
    }

    private getOverlayGroup(slot: 'low' | 'mid' | 'high'): TransformableGroup<never> {
        if (slot === 'low') return this.overlayLowGroup;
        if (slot === 'mid') return this.overlayMidGroup;
        return this.overlayHighGroup;
    }

    /**
     * Generic dispatch that fans an axis-lifecycle phase out to every {@link AxisPluginModuleInstance}
     * registered in the module map. Plugins read whatever live state they need from {@link AxisContext}.
     */
    protected notifyAxisPlugins(method: 'onAxisUpdate' | 'onAxisLayout' | 'onScaleChange' | 'onGridChange') {
        for (const module of this.moduleMap.modules()) {
            (module as Partial<AxisPluginModuleInstance>)[method]?.();
        }
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
    ): (value: any, index: number) => NormalisedTextOrSegments {
        const { moduleCtx } = this;
        const label = this.options.label;
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
        const labelFormat = this.getLabelFormat();
        const specifier = primary ? labelFormat : undefined;

        // Allow null formatting if the domain contains null values (implies allowNullKeys was set on a series)
        const { allowNull } = this;

        const options = {
            specifier: FormatManager.mergeSpecifiers(this.getPrimaryLabelFormat(), labelFormat),
            truncateDate,
            allowNull,
        };

        const formatterCache = this.formatterCache;
        return (value: any, index: number): NormalisedTextOrSegments => {
            const formatParams = this.datumFormatParams(value, params, fractionDigits, timeInterval, dateStyle);
            // For time axis, the datum is aligned. However, for ticks, we don't want to align the datum.
            formatParams.value = value;

            return (
                formatAxisLabelValue(currentLabel, formatterCache, f, formatParams, index, {
                    specifier,
                    dateStyle,
                    truncateDate,
                }) ??
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
        label?: AxisFormattableLabel<Params, FormatterParams<any>>,
        params?: undefined,
        allowNull?: boolean
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
        params?: any,
        allowNull?: boolean
    ): NormalisedTextOrSegments {
        // Handle null/undefined values with empty string unless allowNull is true (for formatter access)
        if (input == null && !allowNull) return '';

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
            formatManager.format(f, formatParams, { allowNull }) ??
            formatAxisLabelValue(this.options.label, this.formatterCache, f, formatParams, Number.NaN) ??
            formatManager.defaultFormat(formatParams);

        return isArray(result) ? result : String(result);
    }

    getBBox(): BBox {
        return this.axisGroup.getBBox();
    }

    hasVisibleSeries() {
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
        const title = (this.options as { title?: { text?: string } }).title;
        return { domain, direction, boundSeries, defaultValue: title?.text };
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

    getUpdateTypeOnResize() {
        return ChartUpdateType.PERFORM_LAYOUT;
    }

    createModuleContext(): DynamicContext<ChartAxisRegistry<AxisContext>> {
        this.axisContext ??= this.createAxisContext();
        // `crossLine` is declared on the typed registry but not registered here — it's installed
        // later by the owning cross-lines module's `register` hook (`CrossLinesModule` on cartesian
        // axes, `PolarCrossLinesModule` on polar axes) before the cross-lines plugin's first read.
        // The type just reserves the slot.
        this.moduleContext ??= this.moduleCtx
            .child<{ parent: AxisContext; crossLine: CrossLine }>()
            .constant('parent', this.axisContext);
        return this.moduleContext;
    }

    createAxisContext(): AxisContext {
        const axis = this;
        const { scale } = this;
        return {
            axisId: this.id,
            axisType: this.type,
            scale: this.scale,
            direction: this.direction,
            continuous: ContinuousScale.is(scale) || DiscreteTimeScale.is(scale),
            get mirrored() {
                return axis.mirrored;
            },
            get reverse() {
                return axis.options.reverse;
            },
            get gridLength() {
                return axis.gridLength;
            },
            get gridPadding() {
                return axis.gridPadding;
            },
            get range() {
                return axis.range;
            },
            hasDefinedDomain: () => this.hasDefinedDomain(),
            hasVisibleSeries: () => this.hasVisibleSeries(),
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
            formatScaleValue: (value, source, label) => {
                const { allowNull } = this;
                return this.formatDatum(
                    undefined,
                    value,
                    source,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    label,
                    undefined,
                    allowNull
                );
            },
            attachLabel: (node: Node) => this.attachLabel(node),
            attachAxisOverlay: (group, slot) => this.getOverlayGroup(slot).appendChild(group),
            inRange: (value, tolerance) => this.inRange(value, tolerance),
            getRangeOverflow: (value) => this.getRangeOverflow(value),
            pickValue: (point) => this.pickValue(point),
            pickBand: (point) => this.pickBand(point),
            measureBand: (value) => this.measureBand(value),
        };
    }

    pickValue(point: { currentX: number; currentY: number }): AxisValuePick | undefined {
        const position = this.isVertical() ? point.currentY : point.currentX;

        const value = unsafeInvert(this.scale, position);
        const domain = unsafeDomain(this.scale);
        if (value == null || domain == null) {
            return undefined;
        }

        // Dynamically extract properties of `AgContextMenuGetItemsParamsAxis` that are not present in the base
        // `AgContextMenuGetItemsParamsAlways` (and also add `caller` so that we can run the context-menu callbacks
        // `callWithContext`).
        type Rules = Omit<AgContextMenuGetItemsParamsAxis, keyof AgContextMenuGetItemsParamsAlways> &
            Pick<AxisValuePick, 'caller'>;
        this.direction;
        this.formatterBoundSeries.get;
        const result: AxisValuePick = {
            caller: this,
            axisId: this.id,
            value,
            direction: this.direction,
            boundSeries: this.formatterBoundSeries.get(),
            domain,
        } satisfies Rules;

        return result;
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
        return this.options.reverse;
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
