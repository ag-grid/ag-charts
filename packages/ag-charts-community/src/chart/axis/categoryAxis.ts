import { isFiniteNumber } from 'ag-charts-core';
import type { AgTimeInterval, AgTimeIntervalUnit, DateFormatterStyle, FormatterParams } from 'ag-charts-types';

import type { ModuleContext } from '../../module/moduleContext';
import { CategoryScale } from '../../scale/categoryScale';
import type { OrdinalTimeScale } from '../../scale/ordinalTimeScale';
import type { UnitTimeScale } from '../../scale/unitTimeScale';
import { Property } from '../../util/properties';
import type { FormatDatumParams } from '../chartAxis';
import type { AxisTickFormatParams } from './axis';
import { CartesianAxis } from './cartesianAxis';

export class CategoryAxis<
    S extends CategoryScale<string | object> | UnitTimeScale | OrdinalTimeScale = CategoryScale<string | object>,
> extends CartesianAxis<S> {
    static override is(this: void, value: unknown): value is CategoryAxis<any> {
        return value instanceof CategoryAxis;
    }

    static readonly className: string = 'CategoryAxis';
    static readonly type: 'category' | 'grouped-category' | 'unit-time' | 'ordinal-time' = 'category';

    constructor(moduleCtx: ModuleContext, scale = new CategoryScale<string | object>() as S) {
        super(moduleCtx, scale);

        this.includeInvisibleDomains = true;
        // Has no effect and can speed up tick generation
        this.nice = false;
    }

    @Property
    groupPaddingInner: number = 0.1;

    @Property
    paddingInner?: number;

    @Property
    paddingOuter?: number;

    override normaliseDataDomain(domain: Array<string | object>) {
        return { domain, clipped: false };
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
        const { datum, seriesId, key, source, property, domain, boundSeries } = params;
        if (Array.isArray(value) && value.some((v) => typeof v !== 'string')) {
            value = value.map(String);
        } else if (
            !Array.isArray(value) &&
            typeof value !== 'string' &&
            typeof value !== 'number' &&
            !(value instanceof Date)
        ) {
            value = String(value);
        }
        return { type: 'category', value, datum, seriesId, key, source, property, domain, boundSeries };
    }
}
