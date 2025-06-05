import type { AgChartLabelFormatterParams, Formatter } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';

interface GaugeLabelDatum {
    value: number;
    text?: string;
    formatter?: Formatter<AgChartLabelFormatterParams<any>>;
}

interface Ctx {
    chartService: { context?: unknown };
}

export const fadeInFns: _ModuleSupport.FromToFns<_ModuleSupport.Node, any, any> = {
    fromFn: () => ({ opacity: 0, phase: 'initial' }),
    toFn: () => ({ opacity: 1 }),
};

export function formatLabel(value: number | undefined, scale: { min: number; max: number }) {
    if (value == null) return '';

    const { min, max } = scale;
    const minLog10 = min !== 0 ? Math.ceil(Math.log10(Math.abs(min))) : 0;
    const maxLog10 = max !== 0 ? Math.ceil(Math.log10(Math.abs(max))) : 0;
    const dp = Math.max(2 - Math.max(minLog10, maxLog10), 0);
    return value.toFixed(dp);
}

export function getLabelText(seriesId: string, ctx: Ctx, datum: GaugeLabelDatum, valueOverride?: number) {
    if (datum.text != null) return datum.text;

    const value = valueOverride ?? datum.value;
    let labelFormat: string | undefined;
    if (datum?.formatter != null) {
        labelFormat = formatWithContext(ctx, datum.formatter, { seriesId, datum: undefined, value });
    }
    if (labelFormat != null) return String(labelFormat);
}

export function formatWithContext<P>(ctx: Ctx, formatter: Formatter<P>, params: P): string | undefined {
    return _ModuleSupport.callWithContext(ctx.chartService, formatter, params);
}
