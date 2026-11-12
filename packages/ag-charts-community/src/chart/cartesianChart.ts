import type {
    AxisPrimaryTickCount,
    BBox,
    CanvasPoint,
    ChartAnimationPhase,
    RequireOptional,
    RequiredRange,
    SeriesChangeType,
    Size,
} from 'ag-charts-core';
import { ChartAxisDirection, clampArray, entries, findMinMax, fromPairs, groupBy } from 'ag-charts-core';
import type {
    AgCartesianAxisPosition,
    AgChartOptions,
    AgCoordinates,
    AgMiniChartSeriesOptions,
    SeriesType,
} from 'ag-charts-types';

import type { ChartOptions } from '../module/optionsModule';
import { staticFromToMotion } from '../motion/fromToMotion';
import { CartesianAxis } from './axis/cartesianAxis';
import { stackCartesianSeries } from './cartesianUtil';
import { CartesianChartAxes, ChartAxes } from './chartAxes';
import { ChartAxesComponent } from './chartAxesComponent';
import type { ChartTypeHost, ChartTypeInstance, SeriesAxesHost } from './chartTypeEnv';
import type { LayoutContext, ScrollbarLayoutMap, SeriesInsetMap } from './layout/layoutManager';
import { deriveMiniChartOptions, filterMiniChartSeries } from './miniChartOptions';
import { CartesianSeries } from './series/cartesian/cartesianSeries';

type Dimension = 'x' | 'y';
type Direction = -1 | 1;
type AreaWidthMap = Map<AgCartesianAxisPosition, number>;

interface State {
    axisAreaWidths: AreaWidthMap;
    clipSeries: boolean;
    overflows: boolean;
}

const directions: AgCartesianAxisPosition[] = ['top', 'right', 'bottom', 'left'];

/** Share of the space left over by the axes that cross-line labels may claim on one dimension. */
const CROSS_LINE_PADDING_SLACK_RATIO = 0.5;

/** Scales an opposing pair of paddings down proportionally, so the series area survives any label length. */
function clampPaddingPair(
    padding: Record<'top' | 'right' | 'bottom' | 'left', number>,
    low: 'left' | 'top',
    high: 'right' | 'bottom',
    slack: number
) {
    const total = padding[low] + padding[high];
    const budget = Math.max(slack, 0) * CROSS_LINE_PADDING_SLACK_RATIO;
    if (total <= budget) return;

    const scale = total > 0 ? budget / total : 0;
    padding[low] *= scale;
    padding[high] *= scale;
}

export class CartesianChartType implements ChartTypeInstance {
    static readonly type = 'cartesian' as const;
    readonly type = CartesianChartType.type;

    private readonly axesComponent: ChartAxesComponent<CartesianChartAxes>;

    private lastAreaWidths?: AreaWidthMap;

    private _requiredRange = 0;
    private _requiredRangeDirection = ChartAxisDirection.X;

    constructor(private readonly host: ChartTypeHost) {
        this.axesComponent = new ChartAxesComponent(
            host.ctx,
            this.type,
            () => new CartesianChartAxes(),
            (newValue, oldValue) => this.onAxisChange(newValue, oldValue)
        );
    }

    get axes() {
        return this.axesComponent.axes;
    }

    private get ctx() {
        return this.host.ctx;
    }

    private get series() {
        return this.host.series;
    }

    private onAxisChange(newValue: CartesianAxis[], oldValue: CartesianAxis[] | undefined) {
        this.syncAxisChanges(newValue, oldValue);

        this.ctx.zoomManager?.setAxes(newValue.filter((axis) => axis.zoomable));
    }

    applyAxisOptions(
        options: AgChartOptions,
        chartOptions: ChartOptions,
        seriesStatus: SeriesChangeType,
        axesChanged: boolean
    ) {
        this.axesComponent.applyAxes(this.axesComponent, options, chartOptions, seriesStatus, axesChanged);
    }

    supportsLayoutOnlyDelta() {
        return this.axes.length > 0;
    }

    getResizeUpdateType() {
        return this.axesComponent.getResizeUpdateType();
    }

    resetAnimations(phase: ChartAnimationPhase) {
        this.axesComponent.resetAnimations(phase);
    }

    destroy() {
        this.axesComponent.destroy();
    }

    processRanges() {
        const seriesRanges: Record<string, number[]> = {};
        const chartRanges: Record<string, number> = {};
        const seriesTypes = new Map();

        this._requiredRangeDirection = this.getDomainDirection();

        // First apply the minimum range from each series by type.
        for (const series of this.series) {
            if (!series.visible) continue;
            seriesRanges[series.type] ??= [];
            series.getMinimumRangeSeries(seriesRanges[series.type]);
            if (!seriesTypes.has(series.type)) {
                seriesTypes.set(series.type, series);
            }
        }

        // Then apply the minimum range required by a group of series by type. For example, bar series have padding
        // between each series which should only be applied once and is calculated from the width of the bars.
        for (const [type, firstSeries] of seriesTypes) {
            chartRanges[type] = firstSeries.getMinimumRangeChart(seriesRanges[type]);
        }

        if (Object.keys(chartRanges).length === 0) {
            this._requiredRange = 0;
        } else {
            // Set only during PROCESS_RANGE: zoomManager's oscillation guard needs this stable across
            // re-layouts to tell option changes from layout-triggered dimension changes.
            this._requiredRange = Math.ceil(Math.max(...Object.values(chartRanges)));
        }

        for (const axis of this.axes) {
            axis.requiredRange = this._requiredRange;
        }
    }

    getRequiredRange(seriesRect: BBox): RequiredRange {
        const { _requiredRange } = this;
        const dimension = this._requiredRangeDirection === ChartAxisDirection.X ? seriesRect.width : seriesRect.height;
        const rangeRatio = _requiredRange / dimension;
        const requiredRangeRatio = Number.isNaN(rangeRatio) ? 0 : rangeRatio; // In case it's NaN, return 0.

        return {
            requiredRangeRatio,
            requiredRangeDirection: this._requiredRangeDirection,
            requiredRange: _requiredRange,
        };
    }

    applyChartTypeOptions(newOpts: AgChartOptions, oldOpts: AgChartOptions & { type?: SeriesType }) {
        const miniChart = this.ctx.navigatorManager?.miniChart;
        const miniChartSeries =
            (newOpts.navigator?.miniChart?.series as Required<AgMiniChartSeriesOptions>[]) ?? newOpts.series;
        if (miniChart?.enabled === true && miniChartSeries != null) {
            this.applyMiniChartOptions(miniChart, miniChartSeries, newOpts, oldOpts);
        } else if (miniChart?.enabled === false) {
            miniChart.setSeries([]);
            miniChart.setAxes(new ChartAxes());
        }
    }

    private getDomainDirection() {
        const flipped = this.series.some(
            (s) => s.visible && s.resolveKeyDirection(ChartAxisDirection.X) === ChartAxisDirection.Y
        );
        return flipped ? ChartAxisDirection.Y : ChartAxisDirection.X;
    }

    private applyMiniChartOptions(
        miniChart: SeriesAxesHost,
        miniChartSeries: NonNullable<AgChartOptions['series']>,
        completeOptions: AgChartOptions,
        oldOpts: AgChartOptions & { type?: SeriesType }
    ) {
        const oldSeries =
            (oldOpts?.navigator?.miniChart?.series as Required<AgMiniChartSeriesOptions>[]) ?? oldOpts?.series;
        const miniChartSeriesStatus = this.host.applySeries(
            miniChart,
            filterMiniChartSeries(miniChartSeries),
            filterMiniChartSeries(oldSeries)
        );
        const derivedOptions = deriveMiniChartOptions(completeOptions);
        this.axesComponent.applyAxes(miniChart, derivedOptions, this.host.chartOptions, miniChartSeriesStatus);

        // The navigator overlay derives from the main domain-direction axis after `nice` rounding, so the
        // matching mini-chart axis must inherit `nice` or the handles drift; cross axes keep `nice = false`.
        const domainDirection = this.getDomainDirection();
        const mainDomainAxis = this.axes.find((axis) => axis.direction === domainDirection);
        for (const axis of miniChart.axes) {
            axis.nice = axis.direction === domainDirection ? (mainDomainAxis?.nice ?? true) : false;
            axis.interactionEnabled = false;
        }
    }

    onSeriesDestroyed() {
        this.lastLayoutWidth = Number.NaN;
        this.lastLayoutHeight = Number.NaN;
    }

    toAgCoordinates(point: CanvasPoint): AgCoordinates {
        const result: AgCoordinates = {};
        for (const axis of this.axes) {
            const pick = axis.pickValue(point);
            if (pick) {
                // `Rules` compile-time checks the broadcast object against the public AgAxisCoordinates shape.
                type Rules = RequireOptional<NonNullable<(typeof result)[keyof typeof result]>>;
                const { boundSeries, depth, direction, domain, groupPercentage, index, value } = pick;
                const axisResult: Rules = { boundSeries, depth, direction, domain, groupPercentage, index, value };
                result[pick.axisId] = axisResult;
            } else {
                // Key present regardless, so the shape tracks `axes` and not series visibility.
                result[axis.userKey] = undefined;
            }
        }
        return result;
    }

    private setRootClipRects(clipRect: BBox | undefined) {
        const { seriesRoot, annotationRoot } = this.host;
        seriesRoot.setClipRect(clipRect);
        annotationRoot.setClipRect(clipRect);
        this.applySeriesBandClips();
    }

    private lastUpdateClipRect: BBox | undefined = undefined;

    private seriesBands = new Map<object, BBox>();
    private bandClippedSeries = new Set<object>();

    private updateSeriesBands(seriesRect: BBox, seriesPaddedRect: BBox, enableClip: boolean) {
        const bands = new Map<object, BBox>();
        for (const axis of this.axes) {
            if (axis.lengthRatio == null || axis.lineRange == null) continue;

            const isHorizontal = axis.position === 'top' || axis.position === 'bottom';
            const [rectStart, rectLength, paddedStart, paddedLength] = isHorizontal
                ? [seriesRect.x, seriesRect.width, seriesPaddedRect.x, seriesPaddedRect.width]
                : [seriesRect.y, seriesRect.height, seriesPaddedRect.y, seriesPaddedRect.height];
            const [bandStart, bandEnd] = findMinMax(axis.lineRange);
            // Band ends on the series area edge keep the series area padding, as the root clip does.
            const start = bandStart <= 0 ? paddedStart : rectStart + bandStart;
            const end = bandEnd >= rectLength - 1e-6 ? paddedStart + paddedLength : rectStart + bandEnd;
            for (const series of axis.boundSeries) {
                // Bands clip with the series area, but a profile tiles half a step past its outer levels so always clips.
                if (!enableClip && !series.isProfile?.()) continue;
                const band = bands.get(series) ?? seriesPaddedRect.clone();
                if (isHorizontal) {
                    band.x = start;
                    band.width = end - start;
                } else {
                    band.y = start;
                    band.height = end - start;
                }
                bands.set(series, band);
            }
        }
        for (const series of this.series) {
            series.interactionBand = bands.get(series);
        }
        this.seriesBands = bands;
    }

    // Applied alongside the root clip so it tracks the animated series-root translation.
    private applySeriesBandClips() {
        const { seriesBands, bandClippedSeries } = this;
        if (seriesBands.size === 0 && bandClippedSeries.size === 0) return;

        for (const series of this.series) {
            const band = seriesBands.get(series);
            if (band == null && !bandClippedSeries.has(series)) continue;

            for (const group of series.getRenderGroups()) {
                group.setClipRect(band);
            }
        }
        this.bandClippedSeries = new Set(seriesBands.keys());
    }

    beforeProcessData() {
        const { series } = this;
        if (!series.some((s) => s.canHaveAxes)) return;
        this.axesComponent.assignAxesToSeries(series);
        this.axesComponent.assignSeriesToAxes(series);
    }

    afterProcessData() {
        if (this.host.syncStatus === 'init') {
            this.host.syncStatus = 'domains-calculated';
        }

        this.ctx.eventsHub.emit('update:process-data', { series: { shouldFlipXY: this.shouldFlipXY() } });
    }

    beforeSeriesDomains() {
        this.axesComponent.processDomains();
    }

    async afterSeriesDomains() {
        for (const axis of this.axes) {
            const syncedDomain = await this.ctx.syncManager.getSyncedDomain(axis);

            if (syncedDomain == null) {
                this.warnIfUnused(axis);
            } else {
                axis.setDomains({ domain: syncedDomain });
            }
        }
    }

    private readonly warnedUnusedAxes = new WeakSet<CartesianAxis>();

    /** Axes that sync covers are left alone, as a sibling chart can supply their domain. */
    private warnIfUnused(axis: CartesianAxis) {
        if (this.series.length === 0 || axis.boundSeries.length > 0 || this.warnedUnusedAxes.has(axis)) return;

        this.warnedUnusedAxes.add(axis);
        this.ctx.logger.warn(`\`axes.${axis.userKey}\` is not used by any series.`);
    }

    private lastLayoutWidth = Number.NaN;
    private lastLayoutHeight = Number.NaN;
    layout(ctx: LayoutContext) {
        const { seriesRoot, annotationRoot, seriesArea, id } = this.host;
        const { clipSeries, seriesRect, visible } = this.updateAxes(ctx);

        seriesRoot.visible = visible;
        this.host.setLayoutRects(seriesRect, ctx.layoutBox);

        const { x, y } = seriesRect;
        if (ctx.width !== this.lastLayoutWidth || ctx.height !== this.lastLayoutHeight) {
            // For initial rendering, don't animate.
            for (const group of [seriesRoot, annotationRoot]) {
                group.translationX = Math.floor(x);
                group.translationY = Math.floor(y);
            }
        } else {
            // Animate seriesRect movements - typically caused by axis size changes.
            const { translationX, translationY } = seriesRoot;
            staticFromToMotion(
                id,
                'seriesRect',
                this.ctx.animationManager,
                [seriesRoot, annotationRoot],
                { translationX, translationY },
                { translationX: Math.floor(x), translationY: Math.floor(y) },
                { phase: 'update' }
            );
        }

        this.lastLayoutWidth = ctx.width;
        this.lastLayoutHeight = ctx.height;

        const seriesPaddedRect = seriesRect.clone().grow(this.host.getSeriesAreaPadding());

        const alwaysClip = this.series.some((s) => s.alwaysClip);
        const enableClip = alwaysClip || (seriesArea.clip ?? false) || clipSeries;
        const clipRect = enableClip ? seriesPaddedRect : undefined;
        this.updateSeriesBands(seriesRect, seriesPaddedRect, enableClip);
        const { lastUpdateClipRect } = this;
        this.lastUpdateClipRect = clipRect;

        if (this.ctx.animationManager.isBlocking() && lastUpdateClipRect != null) {
            this.ctx.animationManager.animate({
                id,
                groupId: 'clip-rect',
                phase: 'update',
                from: lastUpdateClipRect,
                to: seriesPaddedRect,
                onUpdate: (interpolatedClipRect) => this.setRootClipRects(interpolatedClipRect),
                onStop: () => this.setRootClipRects(clipRect),
                onComplete: () => this.setRootClipRects(clipRect),
            });
        } else {
            this.setRootClipRects(clipRect);
        }

        // Update the series area modules and always clip them to the series padded rect area.
        seriesArea.update(seriesRect, seriesPaddedRect);

        this.ctx.layoutManager.emitLayoutComplete(ctx, {
            axes: fromPairs(this.axes.map((axis) => [axis.id, axis.getLayoutState()])),
            series: {
                visible,
                rect: seriesRect,
                paddedRect: seriesPaddedRect,
            },
            clipSeries,
            layoutBox: ctx.layoutBox,
        });

        stackCartesianSeries(this.series);
    }

    updateAxes(layoutContext: LayoutContext) {
        const { layoutBox, scrollbars, seriesInsets } = layoutContext;
        const { clipSeries, seriesRect, overflows } = this.resolveAxesLayout(layoutBox, scrollbars, seriesInsets);

        for (const axis of this.axes) {
            axis.seriesAreaVisible = !overflows;
            axis.update();

            this.clipAxis(axis, seriesRect, layoutBox);
        }

        return { clipSeries, seriesRect, visible: !overflows };
    }

    // X axis width affects Y axis range and vice-versa, so the fit has to be found iteratively.
    private resolveAxesLayout(layoutBox: BBox, scrollbars: ScrollbarLayoutMap, seriesInsets: SeriesInsetMap) {
        let newState;
        let prevState;
        let iterations = 0;
        const maxIterations = 10;

        // Axes that have `crossAt` configured
        const crossAtAxes = this.axes.filter((axis) => axis.options.crossAt?.value != null);

        do {
            // Start with a good approximation from the last update.
            // This should mean that in many resize cases that only a single pass is needed.
            prevState = newState ?? this.getDefaultState(seriesInsets);
            newState = this.updateAxesPass(
                new Map(prevState.axisAreaWidths),
                layoutBox.clone(),
                crossAtAxes,
                scrollbars,
                seriesInsets
            );

            if (iterations++ > maxIterations) {
                this.ctx.logger.warn('Max iterations reached. Unable to stabilize axes layout.');
                break;
            }
        } while (!this.isLayoutStable(newState, prevState));

        this.lastAreaWidths = newState.axisAreaWidths;

        return newState;
    }

    private updateAxesPass(
        axisAreaWidths: AreaWidthMap,
        axisAreaBound: BBox,
        crossAtAxes: CartesianAxis[],
        scrollbars: ScrollbarLayoutMap,
        seriesInsets: SeriesInsetMap
    ) {
        const axisWidths: Map<string, number> = new Map();
        const primaryTickCounts: Partial<Record<ChartAxisDirection, AxisPrimaryTickCount>> = {};

        let overflows = false;
        let clipSeries = false;
        const seriesAreaPadding = this.host.getSeriesAreaPadding();
        const outerSpace: AreaWidthMap = new Map(axisAreaWidths);

        for (const dir of directions) {
            const padding = seriesAreaPadding[dir] ?? 0;
            const axis = this.axes.findLast((a) => a.position === dir);

            if (axis) {
                axis.seriesAreaPadding = padding;
            } else {
                axisAreaBound.shrink(padding, dir);
                outerSpace.set(dir, (outerSpace.get(dir) ?? 0) + padding);
            }
        }

        const totalWidth = (axisAreaWidths.get('left') ?? 0) + (axisAreaWidths.get('right') ?? 0);
        const totalHeight = (axisAreaWidths.get('top') ?? 0) + (axisAreaWidths.get('bottom') ?? 0);
        const pluginPadding = this.buildAxisPluginPadding(outerSpace);

        if (axisAreaBound.width <= totalWidth || axisAreaBound.height <= totalHeight) {
            // Not enough space for rendering
            overflows = true;
        } else {
            clampPaddingPair(pluginPadding, 'left', 'right', axisAreaBound.width - totalWidth);
            clampPaddingPair(pluginPadding, 'top', 'bottom', axisAreaBound.height - totalHeight);
            axisAreaBound.shrink(pluginPadding);
        }

        const { scene } = this.ctx;
        const seriesRect = axisAreaBound.clone().shrink(Object.fromEntries(axisAreaWidths));

        // Step 1) Calculate individual axis widths.
        for (const axis of this.axes) {
            const { position = 'left', direction } = axis;
            const isVertical = direction === ChartAxisDirection.Y;
            let axisWidth: number;

            this.sizeAxis(axis, seriesRect, position);

            const { thickness, maxThicknessRatio } = axis.options;
            if (thickness == null) {
                const availableSize = getSize(isVertical, scene);
                axisWidth = availableSize * maxThicknessRatio;
            } else {
                axisWidth = thickness;
            }

            const chartLayout = {
                sizeLimit: axisWidth - axis.options.label.spacing,
                padding: this.ctx.chartState.getValue('options', 'padding'),
                scrollbars,
            };

            const { primaryTickCount, bbox } = axis.calculateLayout(
                axis.nice ? primaryTickCounts[direction] : undefined,
                chartLayout
            );

            primaryTickCounts[direction] ??= primaryTickCount;
            clipSeries ||= axis.dataDomain.clipped || axis.visibleRange[0] > 0 || axis.visibleRange[1] < 1;

            if (axis.options.thickness == null) {
                axisWidth = Math.min(getSize(isVertical, bbox) ?? 0, axisWidth);
            }
            axisWidths.set(axis.id, Math.ceil(axisWidth));
        }

        // adjust axis widths for crossAt axes and calculate cross positions
        const crossPositions = this.calculateAxesCrossPositions(axisWidths, seriesRect, crossAtAxes);

        const axisGroups = groupBy(this.axes, (axis) => axis.position ?? 'left');

        // Step 2) calculate axis offsets and total depth for each position.
        const newAxisAreaWidths: AreaWidthMap = new Map();
        const axisOffsets = new Map<string, number>();

        for (const position of directions) {
            const inset = Math.ceil(seriesInsets[position] ?? 0);
            if (inset > 0 && axisGroups[position] == null) newAxisAreaWidths.set(position, inset);
        }

        for (const [position, axes] of entries(axisGroups)) {
            // Snap the axis-area depth to the device grid only at fractional DPR, keyed off the resize-invariant outer bound so the offset never cycles as the container resizes.
            const isHorizontalAxis = position === 'top' || position === 'bottom';
            const boundDepthOrigin = isHorizontalAxis ? axisAreaBound.y : axisAreaBound.x;
            let currentOffset = scene.pixelRatio % 1 === 0 ? 0 : boundDepthOrigin % scene.pixelRatio;
            let totalAxisWidth = 0;

            for (const axis of axes ?? []) {
                axisOffsets.set(axis.id, currentOffset);

                const axisThickness = axisWidths.get(axis.id) ?? 0;
                totalAxisWidth = Math.max(totalAxisWidth, currentOffset + axisThickness);
                currentOffset += axisThickness + axis.options.spacing;
            }

            // The inset sits between the innermost axis and the series area, so it widens the area after the axes.
            newAxisAreaWidths.set(position, Math.ceil(totalAxisWidth) + Math.ceil(seriesInsets[position] ?? 0));
        }

        // Step 3) position all axes taking adjacent positions into account.
        for (const [position, axes] of entries(axisGroups)) {
            this.positionAxes({
                axes: axes ?? [],
                position,
                axisWidths,
                axisOffsets,
                axisAreaWidths: newAxisAreaWidths,
                axisBound: axisAreaBound,
                seriesRect,
            });
        }

        this.applyAxisCrossing(seriesRect, crossPositions);

        return { clipSeries, seriesRect, axisAreaWidths: newAxisAreaWidths, overflows };
    }

    private calculateAxesCrossPositions(
        axisWidths: Map<string, number>,
        seriesRect: BBox,
        crossAtAxes: CartesianAxis[]
    ): Map<string, number> {
        const crossPositions = new Map<string, number>();

        for (const axis of crossAtAxes) {
            const { crossPosition, visible } = this.calculateAxisCrossPosition(axis);

            axis.setAxisVisible(visible);

            this.adjustAxisWidth(axis, axisWidths, crossPosition, seriesRect, visible);

            if (crossPosition == undefined) continue;

            crossPositions.set(axis.id, crossPosition);
        }

        return crossPositions;
    }

    private calculateAxisCrossPosition(axis: CartesianAxis): { crossPosition: number | undefined; visible: boolean } {
        const perpendicularAxis = this.axes.perpendicular(axis);
        const {
            scale: { domain, bandwidth },
            range,
        } = perpendicularAxis;
        const halfBandwidth = (bandwidth ?? 0) / 2;

        const { crossAt } = axis.options;
        const crossPosition = perpendicularAxis.scale.convert(crossAt?.value, { clamp: false }) + halfBandwidth;

        if (perpendicularAxis.inRange(crossPosition)) return { crossPosition, visible: true };

        if (crossAt?.sticky === false) {
            return { crossPosition: undefined, visible: false };
        }

        const clampedPosition = Number.isNaN(crossPosition) ? range[domain[0]] : clampArray(crossPosition, range);

        return { crossPosition: clampedPosition, visible: true };
    }

    private adjustAxisWidth(
        axis: CartesianAxis,
        axisWidths: Map<string, number>,
        crossPosition: number | undefined,
        seriesRect: BBox,
        visible: boolean
    ): void {
        const hasAnnotations = this.ctx.annotationManager?.createMemento().some((annotation) => {
            switch (annotation.type) {
                case 'vertical-line':
                    return axis.direction === ChartAxisDirection.X;
                case 'horizontal-line':
                    return axis.direction === ChartAxisDirection.Y;
            }
        });
        if (hasAnnotations) return;

        const currentWidth = axisWidths.get(axis.id) ?? 0;
        const adjustedWidth = visible
            ? this.calculateCrossAtAxisWidth(axis, currentWidth, crossPosition, seriesRect)
            : 0;
        axisWidths.set(axis.id, adjustedWidth);
    }

    private calculateCrossAtAxisWidth(
        axis: CartesianAxis,
        currentWidth: number,
        crossPosition: number | undefined,
        seriesRect: BBox
    ): number {
        if (!axis.isTitleAtEdge() && !axis.isLabelsAtEdge() && !axis.crosshairLabelNeedsEdgeSpace()) {
            return this.calculateAxisBleedingWidth(axis, currentWidth, crossPosition, seriesRect);
        }

        // Whichever component stays at the crossing still needs room when the crossing is near the edge or clamped by `sticky`.
        const { atEdge, atCrossing } = axis.getCrossAtThicknesses();
        const bleed = this.calculateAxisBleedingWidth(
            axis,
            Math.min(atCrossing, currentWidth),
            crossPosition,
            seriesRect
        );

        return Math.ceil(Math.max(atEdge, bleed));
    }

    private calculateAxisBleedingWidth(
        axis: CartesianAxis,
        actualWidth: number,
        crossPosition: number | undefined,
        seriesRect: BBox
    ): number {
        if (crossPosition == null) return actualWidth;

        switch (axis.position) {
            case 'left':
            case 'top':
                return Math.max(0, actualWidth - crossPosition);
            case 'right':
                return Math.max(0, crossPosition + actualWidth - seriesRect.width);
            case 'bottom':
                return Math.max(0, crossPosition + actualWidth - seriesRect.height);
            default:
                return actualWidth;
        }
    }

    private applyAxisCrossing(seriesRect: BBox, crossPositions: Map<string, number>) {
        for (const axis of this.axes) {
            const crossPosition = crossPositions.get(axis.id);
            if (crossPosition == null) {
                axis.crossAxisTranslation.x = 0;
                axis.crossAxisTranslation.y = 0;
                // A `crossAt` axis without a cross position was hidden by `sticky: false`.
                if (axis.options.crossAt?.value == null) {
                    axis.setAxisVisible(true);
                }
                continue;
            }

            const isXDirection = axis.direction === ChartAxisDirection.X;
            axis.crossAxisTranslation.x = isXDirection ? 0 : seriesRect.x + crossPosition - axis.translation.x;
            axis.crossAxisTranslation.y = isXDirection ? seriesRect.y + crossPosition - axis.translation.y : 0;
        }
    }

    private buildAxisPluginPadding(outerSpace: AreaWidthMap) {
        const pluginPadding = { top: 0, right: 0, bottom: 0, left: 0 };

        for (const axis of this.axes) {
            axis.collectPluginPadding(pluginPadding);
        }
        // Reduce plugin padding to account for overlap with axes and series area padding.
        for (const [side, padding = 0] of entries(pluginPadding)) {
            pluginPadding[side] = Math.max(padding - (outerSpace.get(side) ?? 0), 0);
        }

        return pluginPadding;
    }

    private clampToOutsideSeriesRect(seriesRect: BBox, value: number, dimension: Dimension, direction: Direction) {
        const bound = dimension === 'x' ? seriesRect.x : seriesRect.y;
        const size = dimension === 'x' ? seriesRect.width : seriesRect.height;

        return direction === 1 ? Math.min(value, bound + size) : Math.max(value, bound);
    }

    private syncAxisChanges(newValue: CartesianAxis[], oldValue: CartesianAxis[] | undefined) {
        const removed = new Set(oldValue ?? []);
        for (const axis of newValue) {
            removed.delete(axis);
        }
        this.ctx.syncManager.removeAxes(removed);
    }

    private sizeAxis(axis: CartesianAxis, seriesRect: BBox, position: AgCartesianAxisPosition) {
        const isNumberAxis = axis.scale.type === 'number' || axis.scale.type === 'log';
        const isLeftRight = position === 'left' || position === 'right';

        const { width, height } = seriesRect;
        const fullLength = isLeftRight ? height : width;
        const [bandStart, bandEnd] = this.axisBand(axis, position).map((ratio) => ratio * fullLength);
        const bandLength = bandEnd - bandStart;

        // Per-axis zoom is axis-local — secondary axes in independent-axes mode diverge from their
        // direction primary. Read directly from the axis rather than the central chart state.
        let { min, max } = axis.getZoom();

        const { width: axisWidth, unit, align } = axis.layoutConstraints;
        const size = unit === 'px' ? axisWidth : (bandLength * axisWidth) / 100;

        let start = bandStart;
        let end = bandStart + size;
        if (align === 'end') {
            start = bandEnd - size;
            end = bandEnd;
        } else if (align === 'center') {
            start = bandStart + (bandLength - size) / 2;
            end = start + size;
        } else if (align === 'justify') {
            end = bandEnd;
        }

        if (isLeftRight) {
            if (isNumberAxis) {
                [start, end] = [end, start];
            } else {
                [min, max] = [1 - max, 1 - min];
            }
        }

        axis.range = [start, end];
        axis.visibleRange = [min, max];
        axis.gridLength = isLeftRight ? width : height;
        axis.lineRange = isLeftRight ? [bandEnd, bandStart] : [bandStart, bandEnd];
    }

    /** The part of the series area length the axis is laid out in, as `[start, end]` ratios. */
    private axisBand(axis: CartesianAxis, position: AgCartesianAxisPosition): [number, number] {
        const { lengthRatio } = axis;
        if (lengthRatio == null) return [0, 1];

        const isNumberAxis = axis.scale.type === 'number' || axis.scale.type === 'log';
        const minAtEnd = (position === 'left' || position === 'right') && isNumberAxis;
        return minAtEnd === axis.options.reverse ? [0, lengthRatio] : [1 - lengthRatio, 1];
    }

    private positionAxes(opts: {
        axes: CartesianAxis[];
        position: AgCartesianAxisPosition;
        axisBound: BBox;
        axisWidths: Map<string, number>;
        axisOffsets: Map<string, number>;
        axisAreaWidths: AreaWidthMap;
        seriesRect: BBox;
    }) {
        const { axes, axisBound, axisWidths, axisOffsets, axisAreaWidths, seriesRect, position } = opts;
        const axisAreaWidth = axisAreaWidths.get(position) ?? 0;

        let mainDimension: Dimension = 'x';
        let minorDimension: Dimension = 'y';
        let direction: Direction = 1;

        if (position === 'top' || position === 'bottom') {
            mainDimension = 'y';
            minorDimension = 'x';
        }

        let axisBoundMainOffset = axisBound[mainDimension];

        if (position === 'right' || position === 'bottom') {
            direction = -1;
            axisBoundMainOffset += mainDimension === 'x' ? axisBound.width : axisBound.height;
        }

        for (const axis of axes) {
            const minorOffset = axisAreaWidths.get(minorDimension === 'x' ? 'left' : 'top') ?? 0;
            const axisThickness = axisWidths.get(axis.id) ?? 0;
            const axisOffset = axisOffsets.get(axis.id) ?? 0;

            axis.gridPadding = axisAreaWidth - axisOffset - axisThickness;
            axis.translation[minorDimension] = axisBound[minorDimension] + minorOffset;
            axis.translation[mainDimension] = this.clampToOutsideSeriesRect(
                seriesRect,
                axisBoundMainOffset + direction * (axisOffset + axisThickness),
                mainDimension,
                direction
            );
        }
    }

    private shouldFlipXY() {
        // Only flip the xy axes if all the series agree on flipping
        return this.series.every((series) => series instanceof CartesianSeries && series.shouldFlipXY());
    }

    private getDefaultState(seriesInsets: SeriesInsetMap): State {
        const axisAreaWidths: AreaWidthMap = new Map();

        if (this.lastAreaWidths) {
            // Clean any positions which aren't valid with the current axis status,
            // Otherwise we end up never being able to find a stable result.
            for (const { position = 'left' } of this.axes) {
                const areaWidth = this.lastAreaWidths.get(position);
                if (areaWidth != null) {
                    axisAreaWidths.set(position, areaWidth);
                }
            }
            // An inset reserves its position even when no axis does.
            for (const position of directions) {
                const areaWidth = this.lastAreaWidths.get(position);
                if (areaWidth != null && (seriesInsets[position] ?? 0) > 0) {
                    axisAreaWidths.set(position, areaWidth);
                }
            }
        }

        return { axisAreaWidths, clipSeries: false, overflows: false };
    }

    private isLayoutStable(newState: State, prevState: State) {
        if (prevState.overflows !== newState.overflows || prevState.clipSeries !== newState.clipSeries) {
            return false;
        }
        // Check for new axis positions.
        for (const key of newState.axisAreaWidths.keys()) {
            if (!prevState.axisAreaWidths.has(key)) {
                return false;
            }
        }
        // Check for existing axis positions and equality.
        for (const [p, w] of prevState.axisAreaWidths.entries()) {
            const otherW = newState.axisAreaWidths.get(p);
            if ((w != null || otherW != null) && w !== otherW) {
                return false;
            }
        }
        return true;
    }

    private clipAxis(axis: CartesianAxis, seriesRect: BBox, layoutBBox: BBox) {
        const gridLinePadding = Math.ceil(axis.options.gridLine.width);
        const axisLinePadding = Math.ceil(axis.options.line.strokeWidth);

        let { width, height } = seriesRect;

        width += axis.direction === ChartAxisDirection.X ? gridLinePadding : axisLinePadding;
        height += axis.direction === ChartAxisDirection.Y ? gridLinePadding : axisLinePadding;

        axis.clipGrid(seriesRect.x, seriesRect.y, width, height);

        switch (axis.position) {
            case 'left':
            case 'right':
                axis.clipTickLines(
                    layoutBBox.x,
                    seriesRect.y - gridLinePadding,
                    layoutBBox.width + gridLinePadding,
                    seriesRect.height + gridLinePadding * 2
                );
                break;
            case 'top':
            case 'bottom':
                axis.clipTickLines(
                    seriesRect.x - gridLinePadding,
                    layoutBBox.y,
                    seriesRect.width + gridLinePadding * 2,
                    layoutBBox.height + gridLinePadding
                );
                break;
        }
    }
}

function getSize(isVertical: boolean, bounds: Size): number;
function getSize(isVertical: boolean, bounds?: Size): number | undefined;
function getSize(isVertical: boolean, bounds?: Size) {
    return isVertical ? bounds?.width : bounds?.height;
}
