import { type TextOrSegments, _ModuleSupport } from 'ag-charts-community';
import {
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

const { AxisInterval, AxisLabel, LinearScale, BBox, TranslatableGroup, Selection, Text } = _ModuleSupport;

interface TickDatum {
    tick: any;
    tickId: string;
    tickLabel: TextOrSegments;
    translation: number;
}

interface DataProvider {
    data: _ModuleSupport.GradientLegendDatum[];
}

export class AxisTicks {
    static readonly className = 'AxisTicks';
    static readonly DefaultTickCount = 5;
    static readonly DefaultMinSpacing = 10;

    readonly id = createId(this);

    protected readonly axisGroup = new TranslatableGroup({ name: `${this.id}-AxisTicks`, zIndex: ZIndexMap.AXIS });
    protected readonly labelSelection = Selection.select<_ModuleSupport.Text, TickDatum>(this.axisGroup, Text);

    readonly interval = new AxisInterval();
    readonly label = new AxisLabel();
    readonly scale = new LinearScale();

    placement: AgChartLegendPlacement = 'bottom';
    translationX: number = 0;
    translationY: number = 0;

    constructor(
        private readonly ctx: _ModuleSupport.ModuleContext,
        private readonly dataProvider: DataProvider
    ) {}

    private get horizontal(): boolean {
        return this.placement.startsWith('top') || this.placement.startsWith('bottom');
    }

    attachAxis(axisNode: _ModuleSupport.Group) {
        axisNode.appendChild(this.axisGroup);
    }

    calculateLayout(): _ModuleSupport.BBox | undefined {
        const { placement, translationX, translationY, horizontal, label } = this;

        function unreachable(_a: never): never {
            return undefined as never;
        }
        let textBaseline: CanvasTextBaseline;
        let textAlign: CanvasTextAlign;
        switch (placement) {
            case 'top':
            case 'top-right':
            case 'top-left':
                textBaseline = 'bottom';
                textAlign = 'center';
                label.mirrored = false;
                label.parallel = true;
                break;
            case 'bottom':
            case 'bottom-right':
            case 'bottom-left':
                textBaseline = 'top';
                textAlign = 'center';
                label.mirrored = false;
                label.parallel = true;
                break;
            case 'right':
            case 'right-top':
            case 'right-bottom':
            case 'left':
            case 'left-top':
            case 'left-bottom':
                textBaseline = 'middle';
                textAlign = 'left';
                label.mirrored = true;
                label.parallel = false;
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
            node.fontFamily = label.fontFamily;
            node.fontSize = label.fontSize;
            node.fontStyle = label.fontStyle;
            node.fontWeight = label.fontWeight;
            node.fill = label.color;

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
    ): (value: any, index: number) => TextOrSegments | undefined {
        const { ctx } = this;
        const { formatManager } = ctx;
        const boundSeries = this.dataProvider.data.flatMap((d) => d.series);

        return (value, index): TextOrSegments => {
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
                this.label.formatValue((fn, params) => formatWithContext(ctx, fn, params), formatParams, index) ??
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
        const { minSpacing, maxSpacing } = this.interval;
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
            interval: this.interval.step,
            tickCount,
            minTickCount,
            maxTickCount,
        });

        if (this.placement === 'bottom' || this.placement === 'top') {
            const measurer = cachedTextMeasurer(this.label);

            const { domain } = this.scale;
            const reversed = domain[0] > domain[1];
            const direction = reversed ? -1 : 1;
            let lastTickPosition = -Infinity * direction;
            tickData.ticks = tickData.ticks.filter((data) => {
                if (Math.sign(data.translation - lastTickPosition) !== direction) return false;
                const { width: labelWidth } = isArray(data.tickLabel)
                    ? measureTextSegments(data.tickLabel, this.label)
                    : measurer.measureLines(toTextString(data.tickLabel));
                lastTickPosition = data.translation + labelWidth * direction;
                return true;
            });
        }

        return tickData;
    }

    private getTicksData(tickParams: ScaleTickParams<any>) {
        const ticks: TickDatum[] = [];
        const domain = tickParams.nice ? this.scale.niceDomain(tickParams) : this.scale.domain;
        const rawTicks = this.scale.ticks(tickParams, domain)?.ticks ?? [];
        const fractionDigits = rawTicks.reduce((max, tick) => Math.max(max, countFractionDigits(tick)), 0);
        const idGenerator = createIdsGenerator();

        const tickFormatter = this.tickFormatter(domain, rawTicks, false, fractionDigits);

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
