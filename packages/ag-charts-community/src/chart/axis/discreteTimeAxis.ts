import type {
    CategoryScale,
    NormalisedBaseCategoryStyleAxisOptions,
    NormalisedCategoryAxisOptions,
    OrdinalTimeScale,
} from 'ag-charts-core';
import { UnitTimeScale, clampArray } from 'ag-charts-core';

import type { AxisFillDatum, AxisLineDatum, TickDatum } from './axisUtil';
import type { GridLineStyleTickDatum } from './cartesianAxis';
import { CategoryAxis } from './categoryAxis';

export class DiscreteTimeAxis<
    S extends CategoryScale<string | object> | UnitTimeScale | OrdinalTimeScale = CategoryScale<string | object>,
    TOptions extends NormalisedBaseCategoryStyleAxisOptions = NormalisedCategoryAxisOptions,
> extends CategoryAxis<S, TOptions> {
    protected override calculateGridLine(
        { index: tickIndex, tickId, translation }: GridLineStyleTickDatum,
        index: number,
        p1: number,
        p2: number,
        ticks: GridLineStyleTickDatum[]
    ): AxisLineDatum {
        const { horizontal } = this;
        const gridLine = this.options.gridLine;

        if (this.options.interval?.placement !== 'between') {
            return super.calculateGridLine({ index: tickIndex, tickId, translation }, index, p1, p2, ticks);
        }

        const offset = this.intervalStart(translation);
        const [x1, y1, x2, y2] = horizontal
            ? [offset, Math.max(p1, p2), offset, Math.min(p1, p2)]
            : [Math.min(p1, p2), offset, Math.max(p1, p2), offset];
        const { style } = gridLine;
        const { stroke, strokeWidth = 0, lineDash } = style[tickIndex % style.length] ?? {};

        return { tickId, offset, x1, y1, x2, y2, stroke, strokeWidth, lineDash };
    }

    /** One fill between each pair of neighbouring grid lines, and from each end of the axis to its nearest grid line. */
    protected override calculateGridFills(ticks: GridLineStyleTickDatum[], p1: number, p2: number): AxisFillDatum[] {
        if (this.options.interval?.placement !== 'between') {
            return super.calculateGridFills(ticks, p1, p2);
        }
        if (ticks.length === 0) return [];

        const { horizontal, range } = this;
        const { style } = this.options.gridLine;
        const [rangeMin, rangeMax] = [Math.min(...range), Math.max(...range)];
        const edges = ticks
            .map((tick) => ({ tick, offset: this.intervalStart(tick.translation) }))
            .sort((a, b) => a.offset - b.offset);
        const first = edges[0].tick;

        const gridFills: AxisFillDatum[] = [];
        const pushFill = (tickId: string, start: number, end: number, gridFillIndex: number) => {
            if (end - start <= 0) return;
            const [x1, y1, x2, y2] = horizontal
                ? [start, Math.max(p1, p2), end, Math.min(p1, p2)]
                : [Math.min(p1, p2), start, Math.max(p1, p2), end];
            const { fill, fillOpacity } = style[gridFillIndex % style.length] ?? {};
            gridFills.push({ tickId, x1, y1, x2, y2, fill, fillOpacity });
        };

        // Tick indices are consecutive, so the fill before the first edge takes the index after it for its parity.
        pushFill(`before:${first.tickId}`, rangeMin, edges[0].offset, first.index + 1);
        for (let i = 0; i < edges.length; i++) {
            const { tick, offset } = edges[i];
            pushFill(tick.tickId, offset, edges[i + 1]?.offset ?? rangeMax, tick.index);
        }

        return gridFills;
    }

    protected override calculateTickLine(
        { isPrimary, tickId, translation }: Pick<TickDatum, 'tickId' | 'translation' | 'isPrimary'>,
        index: number,
        direction: number,
        ticks: TickDatum[],
        scrollbarThickness: number = 0
    ): AxisLineDatum {
        const { horizontal, primaryTick } = this;
        const tick = this.options.tick;

        if (this.options.interval?.placement !== 'between') {
            return super.calculateTickLine(
                { isPrimary, tickId, translation },
                index,
                direction,
                ticks,
                scrollbarThickness
            );
        }

        const datumTick = isPrimary && primaryTick?.enabled ? primaryTick : tick;
        const h = -direction * this.getTickSize(datumTick);
        const offset = this.intervalStart(translation);
        const tickOffset = -direction * (scrollbarThickness + this.getTickSpacing(datumTick));
        const [x1, y1, x2, y2] = horizontal
            ? [offset, tickOffset, offset, tickOffset + h]
            : [tickOffset, offset, tickOffset + h, offset];
        const { stroke, width: strokeWidth } = datumTick;
        const lineDash = undefined;

        return { tickId, offset, x1, y1, x2, y2, stroke, strokeWidth, lineDash };
    }

    /** The `'between'` boundary halfway to the band before `translation` in time (the next band on a reversed axis). */
    private intervalStart(translation: number) {
        const halfStep = this.scale.step / 2;
        return clampArray(this.options.reverse ? translation + halfStep : translation - halfStep, this.range);
    }
}
