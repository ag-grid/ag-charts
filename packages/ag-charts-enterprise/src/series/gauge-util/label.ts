import type { AgChartLabelFormatterParams, RichFormatter, _ModuleSupport } from 'ag-charts-community';
import { type NormalisedTextOrSegments, isArray } from 'ag-charts-core';
import type { AgNumericValue } from 'ag-charts-types';

import { formatWithContext } from '../../utils/formatter';

interface GaugeLabelDatum {
    value: AgNumericValue;
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

export function formatLabel(value: AgNumericValue | undefined, scale: { min: AgNumericValue; max: AgNumericValue }) {
    if (value == null) return '';

    // bigint is exact and integral; render full-precision and skip decimal-place estimation.
    if (typeof value === 'bigint') {
        return value.toLocaleString();
    }

    const min = Number(scale.min);
    const max = Number(scale.max);
    const minLog10 = min === 0 ? 0 : Math.ceil(Math.log10(Math.abs(min)));
    const maxLog10 = max === 0 ? 0 : Math.ceil(Math.log10(Math.abs(max)));
    const dp = Math.max(2 - Math.max(minLog10, maxLog10), 0);
    return value.toFixed(dp);
}

export function getLabelText(seriesId: string, ctx: Ctx, datum: GaugeLabelDatum, valueOverride?: AgNumericValue) {
    if (datum.text != null) return datum.text;

    const value = valueOverride ?? datum.value;
    let labelFormat: NormalisedTextOrSegments | undefined;
    if (datum?.formatter != null) {
        labelFormat = formatWithContext(ctx, datum.formatter, { seriesId, datum: undefined, value });
    }
    return labelFormat == null || isArray(labelFormat) ? labelFormat : String(labelFormat);
}
