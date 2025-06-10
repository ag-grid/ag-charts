import type { Formatter } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';

interface Ctx {
    chartService: { context?: unknown };
}

export function formatWithContext<P>(ctx: Ctx, formatter: Formatter<P>, params: P): string | undefined {
    return _ModuleSupport.callWithContext(ctx.chartService, formatter, params);
}
