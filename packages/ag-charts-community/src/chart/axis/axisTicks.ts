import type { AgChartLegendPosition, CssColor, FontFamily, FontSize, FontStyle, FontWeight } from 'ag-charts-types';

import { LinearScale } from '../../scale/linearScale';
import { BBox } from '../../scene/bbox';
import { Group } from '../../scene/group';
import type { Node } from '../../scene/node';
import { Selection } from '../../scene/selection';
import { Text } from '../../scene/shape/text';
import { arraysEqual } from '../../util/array';
import { createId } from '../../util/id';
import { countFractionDigits, findMinMax, findRangeExtent, round } from '../../util/number';
import { createIdsGenerator } from '../../util/tempUtils';
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
    tickLabel: string;
    tick: any;
    tickId: string;
    translate: number;
}

interface LabelNodeDatum {
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
}

interface TickData {
    rawTicks: any[];
    fractionDigits: number;
    ticks: TickDatum[];
}

export class AxisTicks {
    static readonly DefaultTickCount = 5;
    static readonly DefaultMinSpacing = 50;

    readonly id = createId(this);

    readonly interval = new AxisInterval();
    readonly label = new AxisLabel();
    readonly scale = new LinearScale();

    protected readonly axisGroup = new Group({ name: `${this.id}-AxisTicks`, zIndex: Layers.AXIS_ZINDEX });
    protected readonly labelSelection = Selection.select<Text, LabelNodeDatum>(this.axisGroup, Text, false);

    readonly translation = { x: 0, y: 0 };

    position: AgChartLegendPosition = 'bottom';

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

    attachAxis(axisNode: Node) {
        axisNode.appendChild(this.axisGroup);
    }

    /**
     * Checks if a point or an object is in range.
     * @param x A point (or object's starting point).
     * @param tolerance Expands the range on both ends by this amount.
     */
    private inRange(x: number, tolerance = 0): boolean {
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

    calculateLayout(): BBox {
        this.scale.interval = this.interval.step;

        const vertical = this.position === 'left' || this.position === 'right';
        const tickData = this.generateTicks();
        const boxes = [
            new BBox(
                vertical ? -this.padding : 0,
                vertical ? 0 : -this.padding,
                vertical ? 0 : this.translation.y,
                vertical ? this.translation.x : 0
            ),
        ];

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

        this.axisGroup.setProperties({
            translationX: this.translation.x,
            translationY: this.translation.y,
        });

        return BBox.merge(boxes);
    }

    private generateTicks(): TickData {
        const { step, values, minSpacing, maxSpacing } = this.interval;
        const extentWithBleed = round(findRangeExtent(this.scale.range), 2);
        const {
            maxTickCount,
            minTickCount,
            tickCount: estimatedTickCount,
        } = estimateTickCount(
            extentWithBleed,
            minSpacing,
            maxSpacing,
            AxisTicks.DefaultTickCount,
            AxisTicks.DefaultMinSpacing
        );

        const maxIterations = isNaN(maxTickCount) ? 10 : maxTickCount;

        let tickCount = estimatedTickCount;
        let tickData: TickData = { rawTicks: [], fractionDigits: 0, ticks: [] };

        const allowMultipleAttempts = step == null && values == null && tickCount > minTickCount;

        for (let index = 0, hasChanged = false; !hasChanged && index <= maxIterations; index++) {
            const prevTicks = tickData.rawTicks;

            tickCount = Math.max(tickCount - index, minTickCount);

            if (tickCount) {
                this.scale.tickCount = tickCount;
                this.scale.minTickCount = minTickCount;
                this.scale.maxTickCount = maxTickCount;
            }

            tickData = this.getTicksData();

            if (!allowMultipleAttempts) break;

            hasChanged = !arraysEqual(tickData.rawTicks, prevTicks);
        }

        // TODO check label overlap

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

        for (let i = 0; i < rawTicks.length; i++) {
            const tick = rawTicks[i];
            const translate = this.scale.convert(tick);

            // Do not render ticks outside the range with a small tolerance. A clip rect would trim long labels, so
            // instead hide ticks based on their translation.
            if (!this.inRange(translate, 0.001)) continue;

            const tickLabel =
                this.label.formatter?.({ value: tick, index: i, fractionDigits }) ??
                labelFormatter(tick) ??
                String(tick);
            const tickId = idGenerator(tickLabel);

            ticks.push({ tick, tickId, tickLabel, translate });
        }

        return { rawTicks, fractionDigits, ticks };
    }
}
