import { Logger, normalisedExtentWithMetadata } from 'ag-charts-core';

import type { ModuleContext } from '../../module/moduleContext';
import { LogScale } from '../../scale/logScale';
import { NumberAxis } from './numberAxis';

export class LogAxis extends NumberAxis {
    static override readonly className = 'LogAxis';
    static override readonly type = 'log' as const;

    override normaliseDataDomain(d: number[]) {
        const { min, max } = this;
        const { extent, clipped } = normalisedExtentWithMetadata(d, min, max);

        if ((extent[0] < 0 && extent[1] > 0) || (d[0] < 0 && d[1] > 0)) {
            Logger.warn(
                `The log axis domain crosses zero, the chart data cannot be rendered. See log axis documentation for more information.`
            );
            return { domain: [], clipped };
        } else if (extent[0] === 0 || extent[1] === 0 || d[0] === 0 || d[1] === 0) {
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
