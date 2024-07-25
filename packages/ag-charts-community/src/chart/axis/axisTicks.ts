import type { AgChartLegendPosition, CssColor, FontFamily, FontSize, FontStyle, FontWeight } from 'ag-charts-types';

import { LinearScale } from '../../scale/linearScale';
import { BBox } from '../../scene/bbox';
import { Group } from '../../scene/group';
import type { Node } from '../../scene/node';
import { Selection } from '../../scene/selection';
import { Text } from '../../scene/shape/text';
import { createId } from '../../util/id';
import { countFractionDigits, findMinMax, findRangeExtent, round } from '../../util/number';
import { createIdsGenerator } from '../../util/tempUtils';
import { CachedTextMeasurerPool } from '../../util/textMeasurer';
import { estimateTickCount } from '../../util/ticks';
import { isNumber } from '../../util/type-guards';
import { Layers } from '../layers';
import { AxisInterval } from './axisInterval';
import { AxisLabel } from './axisLabel';

interface LabelParams {
    x: number;
    y: number;
    textAlign: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
}

interface TickDatum {
    tick: any;
    tickId: string;
    tickLabel: string;
    translate: number;
}

interface LabelNodeDatum {
    visible: boolean;
    tickId: string;
    x: number;
    y: number;
    fill?: CssColor;
    fontFamily?: FontFamily;
    fontSize?: FontSize;
    fontStyle?: FontStyle;
    fontWeight?: FontWeight;
    text: string;
    textAlign: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
    rotation: number;
    rotationCenterX: number;
}

export class AxisTicks {
    static readonly DefaultTickCount = 5;
    static readonly DefaultMinSpacing = 50;

    readonly id = createId(this);

    protected readonly axisGroup = new Group({ name: `${this.id}-AxisTicks`, zIndex: Layers.AXIS_ZINDEX });
    protected readonly labelSelection = Selection.select<Text, LabelNodeDatum>(this.axisGroup, Text, false);

    readonly interval = new AxisInterval();
    readonly label = new AxisLabel();
    readonly scale = new LinearScale();

    position: AgChartLegendPosition = 'bottom';
    translationX: number = 0;
    translationY: number = 0;

    attachAxis(axisNode: Node) {
        axisNode.appendChild(this.axisGroup);
    }

    calculateLayout(): BBox {
        this.scale.interval = this.interval.step;

        const boxes: BBox[] = [];
        const tickData = this.generateTicks();
        const { translationX, translationY } = this;

        this.labelSelection.update(
            tickData.ticks.map((d) => this.createLabelDatum(d)),
            (group) => group.appendChild(new Text()),
            (datum) => datum.tickId
        );

        this.labelSelection.each((node, datum) => {
            node.setProperties(datum);

            if (datum.visible) {
                boxes.push(node.computeBBox());
            }
        });

        this.axisGroup.setProperties({ translationX, translationY });

        return BBox.merge(boxes);
    }

    private getLabelParams(datum: TickDatum): LabelParams {
        const { padding } = this;
        const { translate } = datum;

        switch (this.position) {
            case 'top':
            case 'bottom':
                return {
                    x: translate,
                    y: padding,
                    textAlign: 'center',
                    textBaseline: 'top',
                };
            case 'left':
            case 'right':
                return {
                    x: padding,
                    y: translate,
                    textAlign: 'start',
                    textBaseline: 'middle',
                };
        }
    }

    private inRange(x: number, tolerance = 0.001): boolean {
        const [min, max] = findMinMax(this.scale.range);
        return x >= min - tolerance && x <= max + tolerance;
    }

    public padding: number = 0;

    private createLabelDatum(datum: TickDatum): LabelNodeDatum {
        const { x, y, textBaseline, textAlign } = this.getLabelParams(datum);
        return {
            visible: Boolean(datum.tickLabel),
            tickId: datum.tickId,
            fill: this.label.color,
            fontFamily: this.label.fontFamily,
            fontSize: this.label.fontSize,
            fontStyle: this.label.fontStyle,
            fontWeight: this.label.fontWeight,
            rotation: 0,
            rotationCenterX: 0,
            text: datum.tickLabel,
            textAlign,
            textBaseline,
            x,
            y,
        };
    }

    private generateTicks() {
        const { minSpacing, maxSpacing } = this.interval;
        const extentWithBleed = round(findRangeExtent(this.scale.range), 2);
        const { maxTickCount, minTickCount, tickCount } = estimateTickCount(
            extentWithBleed,
            minSpacing,
            maxSpacing,
            AxisTicks.DefaultTickCount,
            AxisTicks.DefaultMinSpacing
        );

        if (tickCount) {
            this.scale.tickCount = tickCount;
            this.scale.minTickCount = minTickCount;
            this.scale.maxTickCount = maxTickCount;
        }

        const tickData = this.getTicksData();

        if (this.position === 'bottom' || this.position === 'top') {
            const measurer = CachedTextMeasurerPool.getMeasurer({ font: this.label });

            let lastTickPosition = -Infinity;
            tickData.ticks = tickData.ticks.filter((data) => {
                if (lastTickPosition < data.translate) {
                    lastTickPosition = data.translate + measurer.textWidth(data.tickLabel, true);
                    return true;
                }
            });
        }

        return tickData;
    }

    private getTicksData() {
        const ticks: TickDatum[] = [];
        const rawTicks = this.scale.ticks();
        const fractionDigits = rawTicks.reduce((max, tick) => Math.max(max, countFractionDigits(tick)), 0);
        const idGenerator = createIdsGenerator();

        const labelFormatter = this.label.format
            ? this.scale.tickFormat({ ticks: rawTicks, specifier: this.label.format })
            : (x: unknown) => (isNumber(x) ? x.toFixed(fractionDigits) : String(x));

        for (let index = 0; index < rawTicks.length; index++) {
            const tick = rawTicks[index];
            const translate = this.scale.convert(tick);

            if (!this.inRange(translate)) continue;

            const tickLabel = this.label.formatter?.({ value: tick, index, fractionDigits }) ?? labelFormatter(tick);
            const tickId = idGenerator(tickLabel);

            ticks.push({ tick, tickId, tickLabel, translate });
        }

        return { rawTicks, fractionDigits, ticks };
    }
}
