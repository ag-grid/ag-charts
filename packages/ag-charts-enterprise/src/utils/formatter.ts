import type { Formatter, RichFormatter, TextOrSegments } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';

interface Ctx {
    chartService: { context?: unknown };
}

export function formatWithContext<P>(ctx: Ctx, formatter: Formatter<P>, params: P): string | undefined;
export function formatWithContext<P>(ctx: Ctx, formatter: RichFormatter<P>, params: P): TextOrSegments | undefined;
export function formatWithContext<P>(
    ctx: Ctx,
    formatter: Formatter<P> | RichFormatter<P>,
    params: P
): TextOrSegments | undefined {
    return _ModuleSupport.callWithContext(ctx.chartService, formatter, params);
}
