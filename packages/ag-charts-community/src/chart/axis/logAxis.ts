import type { DomainWithMetadata } from 'ag-charts-core';
import { Logger, normalisedExtentWithMetadata } from 'ag-charts-core';

import type { ModuleContext } from '../../module/moduleContext';
import { LogScale } from '../../scale/logScale';
import { NumberAxis } from './numberAxis';

export class LogAxis extends NumberAxis {
    static override readonly className = 'LogAxis';
    static override readonly type = 'log' as const;

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
