import {
    type NormalisedSeriesTooltipOptions,
    callWithContext,
    isDate,
    isLineDashName,
    isNumber,
    isString,
    mergeDefaults,
    scaleLineDashName,
    toTextString,
} from 'ag-charts-core';
import type {
    AgLineDashName,
    AgTooltipRendererResult,
    AgTooltipRendererSymbolLine,
    PixelSize,
    Renderer,
} from 'ag-charts-types';

import type { LegendLine, LegendMarker, LegendSymbolOptions } from '../legend/legendSymbol';
import type { TooltipContent, TooltipStructuredContent } from '../tooltip/tooltip';

const OVERRIDE_KEYS = ['heading', 'title', 'data'] as const;

export type TooltipRenderer<P> = Renderer<P, AgTooltipRendererResult>;

/** A renderer sets a stock dash name, which scales by the `strokeWidth` of the symbol; the series builds arrays. */
function resolveLineDash(lineDash: PixelSize[] | AgLineDashName | undefined, strokeWidth: number | undefined) {
    return isLineDashName(lineDash) ? scaleLineDashName(lineDash, strokeWidth) : lineDash;
}

function buildLineWithMarkerDefaults(
    line: AgTooltipRendererSymbolLine | undefined,
    marker: LegendMarker | undefined
): LegendLine | undefined {
    if (line == null) return undefined;

    const strokeWidth = line.strokeWidth ?? marker?.strokeWidth ?? 1;
    return {
        enabled: line.enabled ?? true,
        stroke: (line.stroke ?? marker?.stroke ?? 'transparent') as string,
        strokeWidth,
        strokeOpacity: line.strokeOpacity ?? marker?.strokeOpacity ?? 1,
        lineDash: resolveLineDash(line.lineDash ?? marker?.lineDash, strokeWidth) ?? [],
    };
}

/** The marker with a stock dash name from the renderer resolved to its array. */
function resolveMarkerLineDash<M extends { lineDash?: PixelSize[] | AgLineDashName; strokeWidth?: number }>(
    marker: M | undefined
) {
    if (marker == null) return marker;
    const lineDash = resolveLineDash(marker.lineDash, marker.strokeWidth);
    return lineDash === marker.lineDash ? marker : { ...marker, lineDash };
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
                      marker: resolveMarkerLineDash(mergedMarker),
                      // Built from the unresolved `mergedMarker` on purpose: a name that the line inherits
                      // scales by the line's width, not the marker's.
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
