import type { AgNumericValue, FormatterParams } from 'ag-charts-types';

import { normalisedExtentWithMetadata } from '../data/extent';
import type { DomainWithMetadata } from '../types/scales';

interface NumberAxisDomainOptions {
    min?: AgNumericValue;
    max?: AgNumericValue;
    preferredMin?: AgNumericValue;
    preferredMax?: AgNumericValue;
}

export function normaliseNumberAxisDomain(
    d: DomainWithMetadata<AgNumericValue>,
    { min, max, preferredMin, preferredMax }: NumberAxisDomainOptions
) {
    const { extent, clipped } = normalisedExtentWithMetadata(
        d.domain,
        min,
        max,
        preferredMin,
        preferredMax,
        undefined,
        d.sortMetadata?.sortOrder
    );

    return { domain: extent, clipped };
}

export function numberAxisVisibleDomain(domain: AgNumericValue[], [r0, r1]: [number, number]): [number, number] {
    // Narrow to Number: a bigint domain reaches here as formatter-context metadata only — the tick
    // label itself carries the exact bigint value, so this range context can narrow safely.
    const d0 = Number(domain[0]);
    const d1 = Number(domain[1]);
    const length = d1 - d0;
    return [d0 + r0 * length, d1 - (1 - r1) * length];
}

export function numberAxisDatumFormatParams(
    value: any,
    params: Omit<FormatterParams<any>, 'type' | 'value'>,
    visibleDomain: [number, number],
    fractionDigits: number | undefined
): FormatterParams<any> {
    const { datum, seriesId, legendItemName, key, source, property, domain, boundSeries } = params;
    return {
        type: 'number',
        value,
        datum,
        seriesId,
        legendItemName,
        key,
        source,
        property,
        domain,
        visibleDomain,
        boundSeries,
        fractionDigits,
    };
}
