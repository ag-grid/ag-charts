import {
    type NormalisedSeriesTooltipOptions,
    callWithContext,
    isDate,
    isNumber,
    isString,
    mergeDefaults,
    toTextString,
} from 'ag-charts-core';
import type { AgTooltipRendererResult, Renderer } from 'ag-charts-types';

import type { LegendLine, LegendMarker, LegendSymbolOptions } from '../legend/legendSymbol';
import type { TooltipContent, TooltipStructuredContent } from '../tooltip/tooltip';

const OVERRIDE_KEYS = ['heading', 'title', 'data'] as const;

export type TooltipRenderer<P> = Renderer<P, AgTooltipRendererResult>;

function buildLineWithMarkerDefaults(
    line:
        | { enabled?: boolean; stroke?: string; strokeWidth?: number; strokeOpacity?: number; lineDash?: number[] }
        | undefined,
    marker: LegendMarker | undefined
): LegendLine | undefined {
    if (line == null) return undefined;

    return {
        enabled: line.enabled ?? true,
        stroke: (line.stroke ?? marker?.stroke ?? 'transparent') as string,
        strokeWidth: line.strokeWidth ?? marker?.strokeWidth ?? 1,
        strokeOpacity: line.strokeOpacity ?? marker?.strokeOpacity ?? 1,
        lineDash: line.lineDash ?? (marker?.lineDash as number[]) ?? [],
    };
}

/** Applies the series tooltip `renderer` (if any) over the series-built `content`. */
export function formatSeriesTooltip<P>(
    tooltip: NormalisedSeriesTooltipOptions<P>,
    callers: Array<{ context?: unknown }>,
    content: TooltipStructuredContent,
    params: P
): TooltipContent {
    const overrides = tooltip.renderer == null ? undefined : callWithContext(callers, tooltip.renderer, params);
    if (isString(overrides) || isNumber(overrides) || isDate(overrides)) {
        return { type: 'raw', rawHtmlString: toTextString(overrides) };
    }
    if (overrides != null) {
        const mergedMarker = mergeDefaults(overrides.symbol?.marker, content.symbol?.marker);
        const mergedLineInput =
            (overrides.symbol?.line ?? content.symbol?.line)
                ? mergeDefaults(overrides.symbol?.line, content.symbol?.line)
                : undefined;

        const symbol: LegendSymbolOptions | undefined =
            content.symbol || overrides.symbol
                ? {
                      marker: mergedMarker,
                      line: buildLineWithMarkerDefaults(mergedLineInput, mergedMarker),
                  }
                : undefined;

        const result: TooltipContent = { type: 'structured', ...content, symbol };
        for (const key of OVERRIDE_KEYS) {
            if (key in overrides) {
                Object.assign(result, { [key]: overrides[key] });
            }
        }
        return result;
    }
    return { type: 'structured', ...content };
}
