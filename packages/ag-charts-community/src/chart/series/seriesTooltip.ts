import {
    BaseProperties,
    Property,
    type RequireOptional,
    callWithContext,
    isDate,
    isNumber,
    isString,
    mergeDefaults,
    toTextString,
} from 'ag-charts-core';
import type {
    AgSeriesTooltipRendererParams,
    AgTooltipRendererResult,
    ContextDefault,
    DatumDefault,
    InteractionRange,
} from 'ag-charts-types';

import type { LegendLine, LegendMarker, LegendSymbolOptions } from '../legend/legendSymbol';
import { type TooltipContent, TooltipPosition, type TooltipStructuredContent } from '../tooltip/tooltip';

export type TooltipRenderer<P> = (params: P) => string | AgTooltipRendererResult;

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

class SeriesTooltipInteraction extends BaseProperties {
    @Property
    enabled: boolean = false;
}

export class SeriesTooltip<P extends AgSeriesTooltipRendererParams<any>> extends BaseProperties {
    @Property
    enabled?: boolean;

    @Property
    showArrow?: boolean;

    @Property
    renderer?: TooltipRenderer<RequireOptional<P>>;

    @Property
    readonly interaction = new SeriesTooltipInteraction();

    @Property
    readonly position = new TooltipPosition();

    @Property
    range?: InteractionRange = undefined;

    @Property
    class?: string = undefined;

    public formatTooltip(
        callers: Array<{ context?: unknown }>,
        content: TooltipStructuredContent,
        params: RequireOptional<P>
    ): TooltipContent {
        const overrides = this.renderer == null ? undefined : callWithContext(callers, this.renderer, params);
        if (isString(overrides) || isNumber(overrides) || isDate(overrides)) {
            return { type: 'raw', rawHtmlString: toTextString(overrides) };
        }
        if (overrides != null) {
            const mergedMarker = mergeDefaults(overrides.symbol?.marker, content.symbol?.marker);
            const mergedLineInput =
                overrides.symbol?.line ?? content.symbol?.line
                    ? mergeDefaults(overrides.symbol?.line, content.symbol?.line)
                    : undefined;

            const symbol: LegendSymbolOptions | undefined =
                content.symbol || overrides.symbol
                    ? {
                          marker: mergedMarker,
                          line: buildLineWithMarkerDefaults(mergedLineInput, mergedMarker),
                      }
                    : undefined;

            return { type: 'structured', ...content, ...overrides, symbol };
        }
        return { type: 'structured', ...content };
    }
}

export function makeSeriesTooltip<P extends AgSeriesTooltipRendererParams<DatumDefault, ContextDefault>>() {
    return new SeriesTooltip<Omit<P, 'context'>>();
}
