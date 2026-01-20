import type { DomainWithMetadata } from 'ag-charts-core';
import { Logger, normalisedExtentWithMetadata } from 'ag-charts-core';

import type { ModuleContext } from '../../module/moduleContext';
import { LogScale } from '../../scale/logScale';
import { NumberAxis } from './numberAxis';

export class LogAxis extends NumberAxis {
    static override readonly className = 'LogAxis';
    static override readonly type = 'log' as const;

    protected override getVisibleDomain(domain: number[]): [number, number] {
        const [d0, d1] = domain;
        const [r0, r1] = this.visibleRange;

        if (domain.length < 2) {
            return [d0, d1] as [number, number];
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

    override normaliseDataDomain(d: DomainWithMetadata<number>) {
        const { min, max, preferredMin, preferredMax } = this;
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
            Logger.warn(
                `The log axis domain crosses zero, the chart data cannot be rendered. See log axis documentation for more information.`
            );
            return { domain: [], clipped };
        } else if (extent[0] === 0 || extent[1] === 0 || d.domain[0] === 0 || d.domain[1] === 0) {
            Logger.warn(
                `The log axis domain contains a value of 0, the chart data cannot be rendered. See log axis documentation for more information.`
            );
            return { domain: [], clipped };
        }

        return { domain: extent, clipped };
    }

    set base(value: number) {
        (this.scale as LogScale).base = value;
    }
    get base(): number {
        return (this.scale as LogScale).base;
    }

    constructor(moduleCtx: ModuleContext) {
        super(moduleCtx, new LogScale());
    }
}
