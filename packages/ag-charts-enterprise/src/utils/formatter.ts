import type { Formatter, RichFormatter, TextValue } from 'ag-charts-community';
import { type NormalisedTextOrSegments, callWithContext } from 'ag-charts-core';

interface Ctx {
    chartService: { context?: unknown };
}

export function formatWithContext<P>(ctx: Ctx, formatter: Formatter<P>, params: P): TextValue | undefined;
export function formatWithContext<P>(
    ctx: Ctx,
    formatter: RichFormatter<P>,
    params: P
): NormalisedTextOrSegments | undefined;
export function formatWithContext<P>(
    ctx: Ctx,
    formatter: Formatter<P> | RichFormatter<P>,
    params: P
): NormalisedTextOrSegments | undefined {
    return callWithContext(ctx.chartService, formatter, params);
}
