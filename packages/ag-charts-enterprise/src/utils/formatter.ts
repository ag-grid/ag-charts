import type { Formatter, RichFormatter, TextOrSegments, TextValue } from 'ag-charts-community';
import { callWithContext } from 'ag-charts-core';

interface Ctx {
    chartService: { context?: unknown };
}

export function formatWithContext<P>(ctx: Ctx, formatter: Formatter<P>, params: P): TextValue | undefined;
export function formatWithContext<P>(ctx: Ctx, formatter: RichFormatter<P>, params: P): TextOrSegments | undefined;
export function formatWithContext<P>(
    ctx: Ctx,
    formatter: Formatter<P> | RichFormatter<P>,
    params: P
): TextOrSegments | undefined {
    return callWithContext(ctx.chartService, formatter, params);
}
