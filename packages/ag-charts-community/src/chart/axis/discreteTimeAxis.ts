import type {
    CategoryScale,
    NormalisedBaseCategoryStyleAxisOptions,
    NormalisedCategoryAxisOptions,
    OrdinalTimeScale,
} from 'ag-charts-core';
import { UnitTimeScale, clampArray, findMinMax } from 'ag-charts-core';

import type { AxisFillDatum } from './axisUtil';
import type { GridLineStyleTickDatum } from './cartesianAxis';
import { CategoryAxis } from './categoryAxis';

export class DiscreteTimeAxis<
    S extends CategoryScale<string | object> | UnitTimeScale | OrdinalTimeScale = CategoryScale<string | object>,
    TOptions extends NormalisedBaseCategoryStyleAxisOptions = NormalisedCategoryAxisOptions,
> extends CategoryAxis<S, TOptions> {
    /** Each tick's fill spans its interval, from its grid line to the next one in time. */
    protected override calculateGridFills(ticks: GridLineStyleTickDatum[], p1: number, p2: number): AxisFillDatum[] {
        if (this.options.interval?.placement !== 'between') {
            return super.calculateGridFills(ticks, p1, p2);
        }
        if (ticks.length === 0) return [];

        const { horizontal, range } = this;
        const { reverse, gridLine } = this.options;
        const [rangeMin, rangeMax] = findMinMax(range);
        // A reversed axis runs time from right to left, so sort by offset to walk the edges in one direction.
        const edges = ticks
            .map((tick) => ({ tick, offset: this.betweenOffset(tick.translation) }))
            .sort((a, b) => a.offset - b.offset);
        const bounds = [rangeMin, ...edges.map(({ offset }) => offset), rangeMax];

        const { style } = gridLine;
        const gridFills: AxisFillDatum[] = [];
        const pushFill = (tickId: string, start: number, end: number, gridFillIndex: number) => {
            if (end <= start) return;
            const [x1, y1, x2, y2] = horizontal
                ? [start, Math.max(p1, p2), end, Math.min(p1, p2)]
                : [Math.min(p1, p2), start, Math.max(p1, p2), end];
            const { fill, fillOpacity } = style[((gridFillIndex % style.length) + style.length) % style.length] ?? {};
            gridFills.push({ tickId, x1, y1, x2, y2, fill, fillOpacity });
        };

        // The span before the earliest tick is the unlabelled interval before it.
        const earliest = reverse ? edges.at(-1)!.tick : edges[0].tick;
        const [beforeStart, beforeEnd] = reverse ? bounds.slice(-2) : bounds.slice(0, 2);
        pushFill(`before:${earliest.tickId}`, beforeStart, beforeEnd, earliest.index - 1);

        for (let i = 0; i < edges.length; i++) {
            const { tick } = edges[i];
            const [start, end] = reverse ? [bounds[i], bounds[i + 1]] : [bounds[i + 1], bounds[i + 2]];
            pushFill(tick.tickId, start, end, tick.index);
        }

        return gridFills;
    }

    /** The latest interval closes at the axis start when the axis is reversed. */
    protected override betweenEnd(): number {
        return this.options.reverse ? this.range[0] : this.range[1];
    }

    /** Halfway to the band before `translation` in time, the next band along a reversed axis. */
    protected override betweenOffset(translation: number): number {
        const halfStep = this.scale.step / 2;
        return clampArray(this.options.reverse ? translation + halfStep : translation - halfStep, this.range);
    }
}
