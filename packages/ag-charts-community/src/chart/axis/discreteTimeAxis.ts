import type { CategoryScale } from '../../scale/categoryScale';
import type { OrdinalTimeScale } from '../../scale/ordinalTimeScale';
import { UnitTimeScale } from '../../scale/unitTimeScale';
import type { AxisFillDatum, AxisLineDatum, TickDatum } from './axisUtil';
import type { GridLineStyleTickDatum } from './cartesianAxis';
import { CategoryAxis } from './categoryAxis';

export class DiscreteTimeAxis<
    S extends CategoryScale<string | object> | UnitTimeScale | OrdinalTimeScale = CategoryScale<string | object>,
> extends CategoryAxis<S> {
    protected override calculateGridLine(
        { index: tickIndex, tickId, translation }: GridLineStyleTickDatum,
        index: number,
        p1: number,
        p2: number,
        ticks: GridLineStyleTickDatum[]
    ): AxisLineDatum {
        const { gridLine, horizontal, interval, range } = this;

        if (interval.placement !== 'between') {
            return super.calculateGridLine({ index: tickIndex, tickId, translation }, index, p1, p2, ticks);
        }

        const prevTick = ticks[index - 1];
        const offset = prevTick ? translation - (translation - prevTick.translation) / 2 : range[0];
        const [x1, y1, x2, y2] = horizontal
            ? [offset, Math.max(p1, p2), offset, Math.min(p1, p2)]
            : [Math.min(p1, p2), offset, Math.max(p1, p2), offset];
        const { style } = gridLine;
        const { stroke, strokeWidth = 0, lineDash } = style[tickIndex % style.length] ?? {};

        return { tickId, offset, x1, y1, x2, y2, stroke, strokeWidth, lineDash };
    }

    protected override calculateGridFills(ticks: GridLineStyleTickDatum[], p1: number, p2: number): AxisFillDatum[] {
        if (this.interval.placement !== 'between') {
            return super.calculateGridFills(ticks, p1, p2);
        }
        return ticks.map((tick, index) => this.calculateGridFill(tick, index, tick.index, p1, p2, ticks));
    }

    protected override calculateGridFill(
        { tickId, translation }: Pick<GridLineStyleTickDatum, 'tickId' | 'translation'>,
        index: number,
        gridFillIndex: number,
        p1: number,
        p2: number,
        ticks: GridLineStyleTickDatum[]
    ): AxisFillDatum {
        const { gridLine, horizontal, interval, range } = this;

        if (interval.placement !== 'between') {
            return super.calculateGridFill({ tickId, translation }, index, gridFillIndex, p1, p2, ticks);
        }

        const prevTick = ticks[index - 1];
        const nextTick = ticks[index + 1];
        const startOffset = prevTick ? translation - (translation - prevTick.translation) / 2 : range[0];
        const endOffset = nextTick ? translation + (nextTick.translation - translation) / 2 : range[1];

        const [x1, y1, x2, y2] = horizontal
            ? [startOffset, Math.max(p1, p2), endOffset, Math.min(p1, p2)]
            : [Math.min(p1, p2), startOffset, Math.max(p1, p2), endOffset];
        const { fill, fillOpacity } = gridLine.style[gridFillIndex % gridLine.style.length] ?? {};

        return { tickId, x1, y1, x2, y2, fill, fillOpacity };
    }

    protected override calculateTickLine(
        { isPrimary, tickId, translation }: Pick<TickDatum, 'tickId' | 'translation' | 'isPrimary'>,
        index: number,
        direction: number,
        ticks: TickDatum[],
        scrollbarThickness: number = 0
    ): AxisLineDatum {
        const { horizontal, interval, primaryTick, range, tick } = this;

        if (interval.placement !== 'between') {
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
        const prevTick = ticks[index - 1];
        const offset = prevTick ? translation - (translation - prevTick.translation) / 2 : range[0];
        const tickOffset = -direction * (scrollbarThickness + this.getTickSpacing(datumTick));
        const [x1, y1, x2, y2] = horizontal
            ? [offset, tickOffset, offset, tickOffset + h]
            : [tickOffset, offset, tickOffset + h, offset];
        const { stroke, width: strokeWidth } = datumTick;
        const lineDash = undefined;

        return { tickId, offset, x1, y1, x2, y2, stroke, strokeWidth, lineDash };
    }
}
