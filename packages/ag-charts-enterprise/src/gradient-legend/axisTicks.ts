import { _ModuleSupport } from 'ag-charts-community';
import {
    type DynamicContext,
    type NormalisedGradientLegendIntervalOptions,
    type NormalisedGradientLegendLabelOptions,
    type NormalisedTextOrSegments,
    type ScaleTickParams,
    ZIndexMap,
    cachedTextMeasurer,
    countFractionDigits,
    createId,
    createIdsGenerator,
    estimateTickCount,
    findMinMax,
    findRangeExtent,
    isArray,
    measureTextSegments,
    toPlainText,
    toTextString,
} from 'ag-charts-core';
import type { AgChartLegendPlacement, FormatterParams } from 'ag-charts-types';

import { formatWithContext } from '../utils/formatter';

const { LinearScale, BBox, TranslatableGroup, Selection, Text, createAxisLabelFormatterCache, formatAxisLabelValue } =
    _ModuleSupport;

interface TickDatum {
    tick: any;
    tickId: string;
    tickLabel: NormalisedTextOrSegments;
    translation: number;
}

export class AxisTicks {
    static readonly className = 'AxisTicks';
    static readonly DefaultTickCount = 5;
    static readonly DefaultMinSpacing = 10;

    readonly id = createId(this);

    protected readonly axisGroup = new TranslatableGroup({ name: `${this.id}-AxisTicks`, zIndex: ZIndexMap.AXIS });
    protected readonly labelSelection = Selection.select<_ModuleSupport.Text<TickDatum>>(this.axisGroup, Text);

    readonly scale = new LinearScale();
    readonly formatterCache = createAxisLabelFormatterCache();

    /** Owned by the gradient legend; assigned via `applyOptions` before any layout call. */
    labelOptions: NormalisedGradientLegendLabelOptions | undefined;
    intervalOptions: NormalisedGradientLegendIntervalOptions | undefined;

    namedLabels?: _ModuleSupport.GradientLegendNamedLabel[];
    placement: AgChartLegendPlacement = 'bottom';
    translationX: number = 0;
    translationY: number = 0;

    /** Internal layout state derived from `placement`. Not user-facing — see I2. */
    mirrored: boolean = false;
    parallel: boolean = false;

    /** Bound series for formatter context — scoped to a single gradient legend item. */
    boundSeries: Array<{ seriesId: string; key: string; name?: string }> = [];

    constructor(private readonly ctx: DynamicContext<_ModuleSupport.ChartRegistry>) {
        this.scale.logger = ctx.logger;
    }

    private get horizontal(): boolean {
        return this.placement.startsWith('top') || this.placement.startsWith('bottom');
    }

    attachAxis(axisNode: _ModuleSupport.Group) {
        axisNode.appendChild(this.axisGroup);
    }

    detach() {
        this.labelSelection.clear();
        this.axisGroup.remove();
    }

    /** Shift the already-laid-out axis group by an additional offset. */
    applyOffset(dx: number, dy: number) {
        this.translationX += dx;
        this.translationY += dy;
        this.axisGroup.translationX += dx;
        this.axisGroup.translationY += dy;
    }

    calculateLayout(): _ModuleSupport.BBox | undefined {
        const { placement, translationX, translationY, horizontal, labelOptions } = this;

        function unreachable(_a: never): never {
            return undefined as never;
        }
        let textBaseline: CanvasTextBaseline;
        let textAlign: CanvasTextAlign;
        switch (placement) {
            case 'top':
            case 'top-right':
            case 'top-left':
            case 'bottom':
            case 'bottom-right':
            case 'bottom-left':
                textBaseline = 'top';
                textAlign = 'center';
                this.mirrored = false;
                this.parallel = true;
                break;
            case 'right':
            case 'right-top':
            case 'right-bottom':
            case 'left':
            case 'left-top':
            case 'left-bottom':
                textBaseline = 'middle';
                textAlign = 'left';
                this.mirrored = true;
                this.parallel = false;
                break;
            default:
                unreachable(placement);
        }

        const boxes: _ModuleSupport.BBox[] = [];

        const tickGenerationResult = this.generateTicks();
        const { ticks } = tickGenerationResult;

        this.labelSelection.update(ticks, undefined, (datum) => datum.tickId);

        this.axisGroup.setProperties({ translationX, translationY });

        this.labelSelection.each((node, datum) => {
            if (labelOptions != null) {
                node.fontFamily = labelOptions.fontFamily;
                node.fontSize = labelOptions.fontSize;
                node.fontStyle = labelOptions.fontStyle;
                node.fontWeight = labelOptions.fontWeight;
                node.fill = labelOptions.color;
            }

            node.textBaseline = textBaseline;
            node.textAlign = textAlign;

            node.text = datum.tickLabel;
            node.x = horizontal ? datum.translation : 0;
            node.y = horizontal ? 0 : datum.translation;

            boxes.push(node.getBBox());
        });

        return boxes.length > 0 ? BBox.merge(boxes).translate(translationX, translationY) : undefined;
    }

    tickFormatter(
        domain: number[],
        _ticks: number[],
        _primary: boolean,
        fractionDigits?: number
    ): (value: any, index: number) => NormalisedTextOrSegments | undefined {
        const { ctx } = this;
        const { formatManager } = ctx;
        const { boundSeries } = this;

        return (value, index): NormalisedTextOrSegments => {
            const formatParams: FormatterParams<any> = {
                type: 'number',
                value,
                datum: undefined,
                seriesId: undefined,
                legendItemName: undefined,
                key: undefined,
                source: 'gradient-legend',
                property: 'color',
                domain,
                boundSeries,
                fractionDigits,
                visibleDomain: undefined,
            };

            return (
                formatAxisLabelValue(
                    this.labelOptions,
                    this.formatterCache,
                    (fn, params) => formatWithContext(ctx, fn, params),
                    formatParams,
                    index
                ) ??
                formatManager.format((fn, params) => formatWithContext(ctx, fn, params), formatParams) ??
                formatManager.defaultFormat(formatParams)
            );
        };
    }

    inRange(x: number, tolerance = 0.001): boolean {
        const [min, max] = findMinMax(this.scale.range);
        return x >= min - tolerance && x <= max + tolerance;
    }

    public padding: number = 0;

    private generateTicks() {
        if (this.namedLabels?.length) {
            return this.generateNamedTicks(this.namedLabels);
        }

        const { minSpacing, maxSpacing, step } = this.intervalOptions ?? {};
        const { maxTickCount, minTickCount, tickCount } = estimateTickCount(
            findRangeExtent(this.scale.range),
            1,
            minSpacing,
            maxSpacing,
            AxisTicks.DefaultTickCount,
            AxisTicks.DefaultMinSpacing
        );

        const tickData = this.getTicksData({
            nice: [true, true],
            interval: step,
            tickCount,
            minTickCount,
            maxTickCount,
        });

        this.applyCollisionAvoidance(tickData.ticks);

        return tickData;
    }

    private generateNamedTicks(namedLabels: _ModuleSupport.GradientLegendNamedLabel[]) {
        const [r0, r1] = this.scale.range;
        const { domain } = this.scale;
        const reversed = domain[0] > domain[1];
        const idGenerator = createIdsGenerator();

        const ticks: TickDatum[] = namedLabels.map(({ position, label }) => {
            const t = reversed ? 1 - position : position;
            const translation = r0 + t * (r1 - r0);
            return { tick: position, tickId: idGenerator(label), tickLabel: label, translation };
        });

        this.applyCollisionAvoidance(ticks);

        return { rawTicks: ticks.map((t) => t.tick), fractionDigits: 0, ticks };
    }

    private applyCollisionAvoidance(ticks: TickDatum[]) {
        if (this.placement !== 'bottom' && this.placement !== 'top') return;
        const { labelOptions } = this;
        if (labelOptions == null) return;

        const measurer = cachedTextMeasurer(labelOptions);
        const { domain } = this.scale;
        const reversed = domain[0] > domain[1];
        const direction = reversed ? -1 : 1;
        let lastTickPosition = -Infinity * direction;

        const keep: boolean[] = ticks.map((data) => {
            if (Math.sign(data.translation - lastTickPosition) !== direction) return false;
            const { width: labelWidth } = isArray(data.tickLabel)
                ? measureTextSegments(data.tickLabel, labelOptions)
                : measurer.measureLines(toTextString(data.tickLabel));
            lastTickPosition = data.translation + labelWidth * direction;
            return true;
        });

        for (let i = ticks.length - 1; i >= 0; i--) {
            if (!keep[i]) ticks.splice(i, 1);
        }
    }

    private getTicksData(tickParams: ScaleTickParams<any>) {
        const ticks: TickDatum[] = [];
        const domain = tickParams.nice ? this.scale.niceDomain(tickParams) : this.scale.domain;
        const rawTicks = this.scale.ticks(tickParams, domain)?.ticks ?? [];
        const numericTicks = rawTicks.map(Number);
        const fractionDigits = numericTicks.reduce<number>((max, tick) => Math.max(max, countFractionDigits(tick)), 0);
        const idGenerator = createIdsGenerator();

        // Formatter context only; the per-tick label below keeps the exact value.
        const tickFormatter = this.tickFormatter(domain.map(Number), numericTicks, false, fractionDigits);

        for (let index = 0; index < rawTicks.length; index++) {
            const tick = rawTicks[index];
            const translation = this.scale.convert(tick);

            if (!this.inRange(translation)) continue;

            const tickLabel = tickFormatter(tick, index);
            if (tickLabel == null || tickLabel === '') continue;

            const tickId = idGenerator(toPlainText(tickLabel));

            ticks.push({ tick, tickId, tickLabel, translation });
        }

        return { rawTicks, fractionDigits, ticks };
    }
}
