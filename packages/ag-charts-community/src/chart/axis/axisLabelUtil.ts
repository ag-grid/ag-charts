import { type NormalisedTextOrSegments, isArray, objectsEqual } from 'ag-charts-core';
import type {
    AgAxisLabelFormatterParams,
    AgBaseAxisLabelStyleOptions,
    AgTimeIntervalUnit,
    DateFormatterStyle,
    FormatterParams,
    TextAlign,
} from 'ag-charts-types';

import type { ChartAxisLabelFlipFlag } from '../chartAxis';
import { FormatManager } from '../formatter/formatManager';

export type FormatterCacheKey = `${DateFormatterStyle}:${'year' | 'month' | 'day' | 'none'}`;

export interface FormatterCache {
    type: string;
    mergedFormat: string | Record<string, string>;
    unit: AgTimeIntervalUnit | undefined;
    formatter: ((value: any, fractionDigits?: number) => string) | undefined;
}

export type AxisLabelFormatterCache = Record<FormatterCacheKey, FormatterCache | undefined>;

export function createAxisLabelFormatterCache(): AxisLabelFormatterCache {
    return {
        'component:year': undefined,
        'component:month': undefined,
        'component:day': undefined,
        'component:none': undefined,
        'long:year': undefined,
        'long:month': undefined,
        'long:day': undefined,
        'long:none': undefined,
    };
}

export function getAxisLabelSideFlag(mirrored: boolean): ChartAxisLabelFlipFlag {
    return mirrored ? 1 : -1;
}

const FAR_EDGE_FRACTION: Record<TextAlign, number> = { left: 1, center: 0.5, right: 0 };

/**
 * Offsets of a tick label's near and far edges from its anchor, along the axis. `textAlign`
 * `undefined` means the axis's own computed alignment, which is measured centre-anchored and
 * without regard to rotation.
 */
export function getTickLabelEdgeOffsets(
    width: number,
    rotation: number,
    textAlign: TextAlign | undefined
): { leading: number; trailing: number } {
    if (textAlign == null) {
        return { leading: -width / 2, trailing: width / 2 };
    }

    // The label pivots about its anchor, so its extent along the axis is the unrotated offset
    // projected onto it - a quarter-turn label reaches barely past its anchor either way.
    const projection = Math.cos(rotation);
    const far = width * FAR_EDGE_FRACTION[textAlign] * projection;
    const near = far - width * projection;
    return { leading: Math.min(near, far), trailing: Math.max(near, far) };
}

export function formatAxisLabelValue(
    label:
        | (Pick<AgBaseAxisLabelStyleOptions, never> & {
              formatter?: AgAxisLabelFormatterParams extends never
                  ? never
                  : (params: AgAxisLabelFormatterParams) => NormalisedTextOrSegments | undefined;
              format?: string | Record<string, string>;
          })
        | undefined,
    cache: AxisLabelFormatterCache,
    callWithContext: (
        formatter: (params: AgAxisLabelFormatterParams) => NormalisedTextOrSegments | undefined,
        params: AgAxisLabelFormatterParams
    ) => NormalisedTextOrSegments | undefined,
    params: FormatterParams<any>,
    index: number,
    options?: {
        specifier?: string | Record<string, string>;
        dateStyle: DateFormatterStyle;
        truncateDate: 'year' | 'month' | 'day' | undefined;
    }
): NormalisedTextOrSegments | undefined {
    const formatter = label?.formatter;
    const format = label?.format;
    const { type, value, domain, boundSeries } = params;
    const fractionDigits = params.type === 'number' ? params.fractionDigits : undefined;
    const unit = params.type === 'date' ? params.unit : undefined;

    let result: NormalisedTextOrSegments | undefined;
    if (formatter != null) {
        const step = params.type === 'date' ? params.step : undefined;
        const visibleDomain = params.type === 'number' ? params.visibleDomain : undefined;
        result = callWithContext(formatter, {
            type,
            value,
            index,
            domain,
            fractionDigits,
            unit,
            step,
            boundSeries,
            visibleDomain,
        });
    }

    if (format != null && result == null) {
        const { specifier, dateStyle = 'long', truncateDate } = options ?? {};
        const cacheKey: FormatterCacheKey = `${dateStyle}:${truncateDate ?? 'none'}`;
        let valueFormatter = cache[cacheKey];

        const mergedFormat = FormatManager.mergeSpecifiers(specifier, format);
        if (
            valueFormatter?.type !== type ||
            valueFormatter?.unit !== unit ||
            !objectsEqual(valueFormatter?.mergedFormat, mergedFormat)
        ) {
            valueFormatter = {
                type,
                mergedFormat,
                unit,
                formatter: FormatManager.getFormatter(type, mergedFormat, unit, dateStyle, { truncateDate }),
            };

            cache[cacheKey] = valueFormatter;
        }

        result = valueFormatter.formatter?.(value, fractionDigits);
    }

    return result == null || isArray(result) ? result : String(result);
}
