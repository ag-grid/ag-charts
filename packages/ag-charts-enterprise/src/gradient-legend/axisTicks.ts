import { _ModuleSupport } from 'ag-charts-community';
import { countFractionDigits, createId } from 'ag-charts-core';
import type { AgChartLegendPosition, FormatterParams } from 'ag-charts-types';

const {
    AxisInterval,
    AxisLabel,
    ZIndexMap,
    LinearScale,
    BBox,
    TranslatableGroup,
    Selection,
    Text,
    CachedTextMeasurerPool,
    createIdsGenerator,
    findMinMax,
    findRangeExtent,
    estimateTickCount,
} = _ModuleSupport;

interface TickDatum {
    tick: any;
    tickId: string;
    tickLabel: string;
    translation: number;
}

export class AxisTicks {
    static readonly DefaultTickCount = 5;
    static readonly DefaultMinSpacing = 10;

    readonly id = createId(this);

    protected readonly axisGroup = new TranslatableGroup({ name: `${this.id}-AxisTicks`, zIndex: ZIndexMap.AXIS });
    protected readonly labelSelection = Selection.select<_ModuleSupport.Text, TickDatum>(this.axisGroup, Text);

    readonly interval = new AxisInterval();
    readonly label = new AxisLabel();
    readonly scale = new LinearScale();

    position: AgChartLegendPosition = 'bottom';
    translationX: number = 0;
    translationY: number = 0;

    constructor(private readonly ctx: _ModuleSupport.ModuleContext) {}

    private get horizontal(): boolean {
        return this.position === 'top' || this.position === 'bottom';
    }

    attachAxis(axisNode: _ModuleSupport.Group) {
        axisNode.appendChild(this.axisGroup);
    }

    calculateLayout(): _ModuleSupport.BBox | undefined {
        const { position, translationX, translationY, horizontal, label } = this;

        let textBaseline: CanvasTextBaseline;
        let textAlign: CanvasTextAlign;
        switch (position) {
            case 'top':
                textBaseline = 'bottom';
                textAlign = 'center';
                label.mirrored = false;
                label.parallel = true;
                break;
            case 'bottom':
                textBaseline = 'top';
                textAlign = 'center';
                label.mirrored = false;
                label.parallel = true;
                break;
            case 'right':
                textBaseline = 'middle';
                textAlign = 'left';
                label.mirrored = true;
                label.parallel = false;
                break;
            case 'left':
                textBaseline = 'middle';
                textAlign = 'right';
                label.mirrored = true;
                label.parallel = false;
                break;
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

    private inRange(x: number, tolerance = 0.001): boolean {
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
            nice: true,
            interval: this.interval.step,
            tickCount,
            minTickCount,
            maxTickCount,
        });

        if (this.position === 'bottom' || this.position === 'top') {
            const measurer = CachedTextMeasurerPool.getMeasurer({ font: this.label });

            const { domain } = this.scale;
            const reversed = domain[0] > domain[1];
            const direction = reversed ? -1 : 1;
            let lastTickPosition = -Infinity * direction;
            tickData.ticks = tickData.ticks.filter((data) => {
                if (Math.sign(data.translation - lastTickPosition) !== direction) return false;
                lastTickPosition = data.translation + measurer.textWidth(data.tickLabel, true) * direction;
                return true;
            });
        }

        return tickData;
    }

    private getTicksData(tickParams: _ModuleSupport.ScaleTickParams<any>) {
        const { formatManager } = this.ctx;
        const ticks: TickDatum[] = [];
        const domain = tickParams.nice ? this.scale.niceDomain(tickParams) : this.scale.domain;
        const rawTicks = this.scale.ticks(tickParams, domain)?.ticks ?? [];
        const fractionDigits = rawTicks.reduce((max, tick) => Math.max(max, countFractionDigits(tick)), 0);
        const boundSeries: never[] = [];
        const idGenerator = createIdsGenerator();

        for (let index = 0; index < rawTicks.length; index++) {
            const tick = rawTicks[index];
            const translation = this.scale.convert(tick);

            if (!this.inRange(translation)) continue;

            const formatParams: FormatterParams<any> = {
                type: 'number',
                value: tick,
                datum: undefined,
                key: undefined,
                source: 'gradient-legend',
                property: 'color',
                domain,
                boundSeries,
                fractionDigits,
            };

            const tickLabel =
                this.label.formatValue(
                    (formatter, value) => formatter(value),
                    'number',
                    tick,
                    index,
                    domain,
                    boundSeries,
                    fractionDigits,
                    undefined
                ) ??
                formatManager.format(formatParams) ??
                formatManager.defaultFormat(formatParams);
            const tickId = idGenerator(tickLabel);

            ticks.push({ tick, tickId, tickLabel, translation });
        }

        return { rawTicks, fractionDigits, ticks };
    }
}
