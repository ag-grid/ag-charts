import type { AgChartLabelFormatterParams, RichFormatter, _ModuleSupport } from 'ag-charts-community';
import { type NormalisedTextOrSegments, isArray } from 'ag-charts-core';

import { formatWithContext } from '../../utils/formatter';

interface GaugeLabelDatum {
    value: number | bigint;
    text?: NormalisedTextOrSegments;
    formatter?: RichFormatter<AgChartLabelFormatterParams<any>>;
}

interface Ctx {
    chartService: { context?: unknown };
}

export const fadeInFns: _ModuleSupport.FromToFns<_ModuleSupport.Node, any, any> = {
    fromFn: () => ({ opacity: 0, phase: 'initial' }),
    toFn: () => ({ opacity: 1 }),
};

export function formatLabel(value: number | bigint | undefined, scale: { min: number | bigint; max: number | bigint }) {
    if (value == null) return '';

    // A bigint value is exact and integral, so render it full-precision and skip the decimal-place
    // estimation entirely (AG-16608 AC #11).
    if (typeof value === 'bigint') {
        return value.toLocaleString();
    }

    // Narrow the bounds to Number purely to estimate decimal places — precision loss here only affects
    // how many fraction digits a (Number) value is rounded to, not the value text itself.
    const min = Number(scale.min);
    const max = Number(scale.max);
    const minLog10 = min === 0 ? 0 : Math.ceil(Math.log10(Math.abs(min)));
    const maxLog10 = max === 0 ? 0 : Math.ceil(Math.log10(Math.abs(max)));
    const dp = Math.max(2 - Math.max(minLog10, maxLog10), 0);
    return value.toFixed(dp);
}

export function getLabelText(seriesId: string, ctx: Ctx, datum: GaugeLabelDatum, valueOverride?: number | bigint) {
    if (datum.text != null) return datum.text;

    const value = valueOverride ?? datum.value;
    let labelFormat: NormalisedTextOrSegments | undefined;
    if (datum?.formatter != null) {
        labelFormat = formatWithContext(ctx, datum.formatter, { seriesId, datum: undefined, value });
    }
    return labelFormat == null || isArray(labelFormat) ? labelFormat : String(labelFormat);
}
