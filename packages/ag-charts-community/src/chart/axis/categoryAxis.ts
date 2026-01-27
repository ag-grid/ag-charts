import type { DomainWithMetadata } from 'ag-charts-core';
import { ActionOnSet, Property, ProxyPropertyOnWrite, isFiniteNumber } from 'ag-charts-core';
import type { AgTimeInterval, AgTimeIntervalUnit, DateFormatterStyle, FormatterParams } from 'ag-charts-types';

import type { ModuleContext } from '../../module/moduleContext';
import { CategoryScale } from '../../scale/categoryScale';
import type { OrdinalTimeScale } from '../../scale/ordinalTimeScale';
import type { UnitTimeScale } from '../../scale/unitTimeScale';
import type { FormatDatumParams } from '../chartAxis';
import type { AxisTickFormatParams } from './axis';
import type { AxisFillDatum, AxisLineDatum, TickDatum } from './axisUtil';
import { CartesianAxis, type GridLineStyleTickDatum } from './cartesianAxis';

export class CategoryAxis<
    S extends CategoryScale<string | object> | UnitTimeScale | OrdinalTimeScale = CategoryScale<string | object>,
> extends CartesianAxis<S> {
    static override is(this: void, value: unknown): value is CategoryAxis<any> {
        return value instanceof CategoryAxis;
    }

    static readonly className: string = 'CategoryAxis';
    static readonly type: 'category' | 'grouped-category' | 'unit-time' | 'ordinal-time' = 'category';

    @Property
    groupPaddingInner: number = 0.1;

    @Property
    paddingInner?: number;

    @Property
    paddingOuter?: number;

    @ProxyPropertyOnWrite('layoutConstraints', 'align')
    bandAlignment?: 'justify' | 'start' | 'center' | 'end';

    @ActionOnSet<CategoryAxis>({
        newValue(value?: number) {
            if (value == null || value <= 0) {
                this.layoutConstraints.width = 100;
                this.layoutConstraints.unit = 'percent';
            } else {
                this.layoutConstraints.width = value;
                this.layoutConstraints.unit = 'px';
                this.animationManager.skipCurrentBatch();
            }
        },
    })
    override requiredWidth?: number;

    constructor(
        moduleCtx: ModuleContext,
        scale = new CategoryScale<string | object>() as S,
        includeInvisibleDomains: boolean = true
    ) {
        super(moduleCtx, scale);

        this.includeInvisibleDomains = includeInvisibleDomains;
        // Has no effect and can speed up tick generation
        this.nice = false;
    }

    override isCategoryLike(): boolean {
        return true;
    }

    override hasDefinedDomain(): boolean {
        return false;
    }

    override normaliseDataDomain(d: DomainWithMetadata<string | object>) {
        return { domain: d.domain, clipped: false };
    }

    protected override updateScale() {
        super.updateScale();

        let { paddingInner, paddingOuter } = this;
        if (!isFiniteNumber(paddingInner) || !isFiniteNumber(paddingOuter)) {
            const padding = this.reduceBandScalePadding();
            paddingInner ??= padding.inner;
            paddingOuter ??= padding.outer;
        }
        this.scale.paddingInner = paddingInner ?? 0;
        this.scale.paddingOuter = paddingOuter ?? 0;
    }

    protected override calculateGridLines(ticks: GridLineStyleTickDatum[], p1: number, p2: number): AxisLineDatum[] {
        const gridLines = super.calculateGridLines(ticks, p1, p2);

        if (this.interval.placement === 'between' && ticks.length > 0) {
            gridLines.push(
                super.calculateGridLine(
                    {
                        index: ticks.at(-1)!.index + 1,
                        tickId: `after:${ticks.at(-1)!.tickId}`,
                        translation: this.range[1],
                    },
                    ticks.length,
                    p1,
                    p2,
                    ticks
                )
            );
        }

        return gridLines;
    }

    protected override calculateGridLine(
        { index: tickIndex, tickId, translation }: GridLineStyleTickDatum,
        index: number,
        p1: number,
        p2: number,
        ticks: GridLineStyleTickDatum[]
    ): AxisLineDatum {
        const { gridLine, horizontal, interval, scale } = this;

        if (interval.placement !== 'between') {
            return super.calculateGridLine({ index: tickIndex, tickId, translation }, index, p1, p2, ticks);
        }

        const halfStep = translation < scale.step ? Math.floor(scale.step / 2) : scale.step / 2;
        const offset = translation - halfStep;
        const [x1, y1, x2, y2] = horizontal
            ? [offset, Math.max(p1, p2), offset, Math.min(p1, p2)]
            : [Math.min(p1, p2), offset, Math.max(p1, p2), offset];
        const { style } = gridLine;
        const { stroke, strokeWidth = 0, lineDash } = style[tickIndex % style.length] ?? {};

        return { tickId, offset, x1, y1, x2, y2, stroke, strokeWidth, lineDash };
    }

    protected override calculateGridFills(ticks: GridLineStyleTickDatum[], p1: number, p2: number): AxisFillDatum[] {
        const { horizontal, range, scale } = this;

        if (this.interval.placement !== 'between') {
            return super.calculateGridFills(ticks, p1, p2);
        }

        const gridFills: AxisFillDatum[] = [];
        if (ticks.length == 0) return gridFills;

        const firstTick = ticks[0];
        const firstFillOffCanvas = firstTick.translation > range[0] + scale.step / 2;

        const lastTick = ticks.at(-1)!;
        const lastFillOffCanvas = horizontal && lastTick.translation < range[1] - scale.step / 2;

        if (firstFillOffCanvas) {
            const tick = { tickId: `before:${firstTick.tickId}`, translation: firstTick.translation - scale.step };
            gridFills.push(this.calculateGridFill(tick, -1, firstTick.index - 1, p1, p2, ticks));
        }

        gridFills.push(...ticks.map((tick, index) => this.calculateGridFill(tick, index, tick.index, p1, p2, ticks)));

        if (lastFillOffCanvas) {
            const tick = { tickId: `after:${lastTick.tickId}`, translation: lastTick.translation + scale.step };
            gridFills.push(this.calculateGridFill(tick, ticks.length, lastTick.index + 1, p1, p2, ticks));
        }

        return gridFills;
    }

    protected override calculateGridFill(
        { tickId, translation }: Pick<GridLineStyleTickDatum, 'tickId' | 'translation'>,
        index: number,
        gridFillIndex: number,
        p1: number,
        p2: number,
        ticks: GridLineStyleTickDatum[]
    ): AxisFillDatum {
        const { gridLine, horizontal, interval, scale } = this;

        if (interval.placement !== 'between') {
            return super.calculateGridFill({ tickId, translation }, index, gridFillIndex, p1, p2, ticks);
        }

        const startOffset = translation - scale.step / 2;
        const endOffset = translation + scale.step / 2;

        const [x1, y1, x2, y2] = horizontal
            ? [startOffset, Math.max(p1, p2), endOffset, Math.min(p1, p2)]
            : [Math.min(p1, p2), startOffset, Math.max(p1, p2), endOffset];
        const { fill, fillOpacity } = gridLine.style[gridFillIndex % gridLine.style.length] ?? {};

        return { tickId, x1, y1, x2, y2, fill, fillOpacity };
    }

    protected override calculateTickLines(
        ticks: TickDatum[],
        direction: number,
        scrollbarThickness: number = 0
    ): AxisLineDatum[] {
        const tickLines = super.calculateTickLines(ticks, direction, scrollbarThickness);

        if (this.interval.placement === 'between' && ticks.length > 0) {
            tickLines.push(
                super.calculateTickLine(
                    { isPrimary: false, tickId: `after:${ticks.at(-1)?.tickId}`, translation: this.range[1] },
                    ticks.length,
                    direction,
                    ticks,
                    scrollbarThickness
                )
            );
        }

        return tickLines;
    }

    protected override calculateTickLine(
        { isPrimary, tickId, translation }: Pick<TickDatum, 'tickId' | 'translation' | 'isPrimary'>,
        index: number,
        direction: number,
        ticks: TickDatum[],
        scrollbarThickness: number = 0
    ): AxisLineDatum {
        const { horizontal, interval, primaryTick, scale, tick } = this;

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
        const halfStep = translation < scale.step ? Math.floor(scale.step / 2) : scale.step / 2;
        const offset = translation - halfStep;
        const tickOffset = -direction * (scrollbarThickness + this.getTickSpacing(datumTick));
        const [x1, y1, x2, y2] = horizontal
            ? [offset, tickOffset, offset, tickOffset + h]
            : [tickOffset, offset, tickOffset + h, offset];
        const { stroke, width: strokeWidth } = datumTick;
        const lineDash = undefined;

        return { tickId, offset, x1, y1, x2, y2, stroke, strokeWidth, lineDash };
    }

    private reduceBandScalePadding() {
        return this.boundSeries.reduce(
            (result, series) => {
                const padding = series.getBandScalePadding?.();
                if (padding) {
                    if (result.inner > padding.inner) {
                        result.inner = padding.inner;
                    }
                    if (result.outer < padding.outer) {
                        result.outer = padding.outer;
                    }
                }
                return result;
            },
            { inner: Infinity, outer: -Infinity }
        );
    }

    override tickFormatParams(
        _domain: any[],
        _ticks: any[],
        _fractionDigits?: number,
        _timeInterval?: AgTimeInterval | AgTimeIntervalUnit
    ): AxisTickFormatParams {
        return { type: 'category' };
    }

    override datumFormatParams(
        value: any,
        params: FormatDatumParams,
        _fractionDigits: number | undefined,
        _timeInterval: AgTimeInterval | AgTimeIntervalUnit | undefined,
        _style: DateFormatterStyle
    ): FormatterParams<any> {
        const { datum, seriesId, legendItemName, key, source, property, domain, boundSeries } = params;
        if (Array.isArray(value) && value.some((v) => typeof v !== 'string')) {
            value = value.map(String);
        }
        return { type: 'category', value, datum, seriesId, legendItemName, key, source, property, domain, boundSeries };
    }
}
