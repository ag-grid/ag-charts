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

/** Offset of a text box's left edge from its anchor, as a fraction of the box's width. */
const ANCHOR_OFFSET_FRACTION: Partial<Record<CanvasTextAlign, number>> = { left: 0, center: 0.5, right: 1 };

export interface LabelExtent {
    x0: number;
    x1: number;
    y0: number;
    y1: number;
}

export interface LabelBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Extent of a label's glyph box relative to its anchor, once the label's own rotation about that
 * anchor is applied. `box` must be the untransformed, anchor-positioned glyph box, so that the
 * node's own rotation is not folded in twice.
 */
export function getRotatedLabelExtent(box: LabelBox, anchorX: number, anchorY: number, rotation: number): LabelExtent {
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    const left = box.x - anchorX;
    const right = left + box.width;
    const top = box.y - anchorY;
    const bottom = top + box.height;

    const extent: LabelExtent = { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity };
    for (const [x, y] of [
        [left, top],
        [right, top],
        [right, bottom],
        [left, bottom],
    ]) {
        const rx = x * cos - y * sin;
        const ry = x * sin + y * cos;
        extent.x0 = Math.min(extent.x0, rx);
        extent.x1 = Math.max(extent.x1, rx);
        extent.y0 = Math.min(extent.y0, ry);
        extent.y1 = Math.max(extent.y1, ry);
    }
    return extent;
}

/**
 * Horizontal shift that takes a text box measured under `from` to where `to` would place it. Both
 * alignments anchor the same glyphs, so the box only slides along its own width.
 */
export function getTextAlignShift(width: number, from: CanvasTextAlign, to: CanvasTextAlign): number {
    return ((ANCHOR_OFFSET_FRACTION[from] ?? 0) - (ANCHOR_OFFSET_FRACTION[to] ?? 0)) * width;
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
