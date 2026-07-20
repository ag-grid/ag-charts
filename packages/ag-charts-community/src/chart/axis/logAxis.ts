import type { AxisID, DomainWithMetadata, DynamicContext, NormalisedNumberAxisOptions } from 'ag-charts-core';
import { narrowToNumber, normalisedExtentWithMetadata, zeroLike } from 'ag-charts-core';
import type { AgNumericValue } from 'ag-charts-types';

import type { ChartRegistry } from '../../module/moduleContext';
import { LogScale } from '../../scale/logScale';
import { NumberAxis } from './numberAxis';

export class LogAxis extends NumberAxis {
    static override readonly className = 'LogAxis';
    static override readonly type = 'log' as const;

    protected override getVisibleDomain(domain: AgNumericValue[]): [number, number] {
        // Narrow to Number before any Math.* call — log scales narrow bigint anyway (see LogScale),
        // and Math.log/Math.min throw a TypeError when handed a bigint.
        const d0 = narrowToNumber(domain[0]);
        const d1 = narrowToNumber(domain[1]);
        const [r0, r1] = this.visibleRange;

        if (domain.length < 2) {
            return [d0, d1];
        }

        const min = Math.min(d0, d1);
        const max = Math.max(d0, d1);
        if (min >= 0) {
            const log0 = Math.log(d0);
            const log1 = Math.log(d1);
            const span = log1 - log0;
            return [Math.exp(log0 + r0 * span), Math.exp(log0 + r1 * span)];
        }
        if (max <= 0) {
            const log0 = -Math.log(-d0);
            const log1 = -Math.log(-d1);
            const span = log1 - log0;
            return [-Math.exp(-(log0 + r0 * span)), -Math.exp(-(log0 + r1 * span))];
        }

        return [Number.NaN, Number.NaN];
    }

    override normaliseDataDomain(d: DomainWithMetadata<AgNumericValue>) {
        const { min, max, preferredMin, preferredMax } = this.options;
        const { extent, clipped } = normalisedExtentWithMetadata(
            d.domain,
            min,
            max,
            preferredMin,
            preferredMax,
            undefined,
            d.sortMetadata?.sortOrder
        );

        if ((extent[0] < 0 && extent[1] > 0) || (d.domain[0] < 0 && d.domain[1] > 0)) {
            this.moduleCtx.logger.warn(
                `The log axis domain crosses zero, the chart data cannot be rendered. See log axis documentation for more information.`
            );
            return { domain: [], clipped };
        } else if (
            // zeroLike: 0n === 0 is false, so a strict comparison would miss bigint zero.
            extent[0] === zeroLike(extent[0]) ||
            extent[1] === zeroLike(extent[1]) ||
            d.domain[0] === zeroLike(d.domain[0]) ||
            d.domain[1] === zeroLike(d.domain[1])
        ) {
            this.moduleCtx.logger.warn(
                `The log axis domain contains a value of 0, the chart data cannot be rendered. See log axis documentation for more information.`
            );
            return { domain: [], clipped };
        }

        return { domain: extent, clipped };
    }

    get base(): number {
        return this.optionsBase ?? (this.scale as LogScale).base;
    }

    private get optionsBase(): number | undefined {
        return (this.options as { base?: number }).base;
    }

    constructor(moduleCtx: DynamicContext<ChartRegistry>, id: AxisID, options: NormalisedNumberAxisOptions) {
        super(moduleCtx, id, new LogScale(), options);
        this.syncScaleBase();
    }

    private syncScaleBase(): void {
        const base = this.optionsBase;
        if (base != null) {
            (this.scale as LogScale).base = base;
        }
    }

    protected override updateScale(): void {
        this.syncScaleBase();
        super.updateScale();
    }
}
