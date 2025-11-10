import { BaseProperties, Property, type RequireOptional, callWithContext, mergeDefaults } from 'ag-charts-core';
import type {
    AgSeriesTooltipRendererParams,
    AgTooltipRendererResult,
    ContextDefault,
    DatumDefault,
    InteractionRange,
} from 'ag-charts-types';

import type { LegendSymbolOptions } from '../legend/legendSymbol';
import { type TooltipContent, TooltipPosition, type TooltipStructuredContent } from '../tooltip/tooltip';

export type TooltipRenderer<P> = (params: P) => string | AgTooltipRendererResult;

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
        if (typeof overrides === 'string') return { type: 'raw', rawHtmlString: overrides };
        if (overrides != null) {
            const symbol: LegendSymbolOptions | undefined =
                content.symbol || overrides.symbol
                    ? {
                          marker: mergeDefaults(overrides.symbol?.marker, content.symbol?.marker),
                          line: content.symbol?.line
                              ? mergeDefaults(overrides.symbol?.line, content.symbol.line)
                              : undefined,
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
