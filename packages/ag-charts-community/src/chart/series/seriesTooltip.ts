import type { RequireOptional } from 'ag-charts-core';
import type { AgSeriesTooltipRendererParams, AgTooltipRendererResult, InteractionRange } from 'ag-charts-types';

import { callWithContext } from '../../util/callbackCache';
import { BaseProperties } from '../../util/properties';
import { BOOLEAN, FUNCTION, INTERACTION_RANGE, OBJECT, STRING, TempValidate } from '../../util/validation';
import { type TooltipContent, TooltipPosition, type TooltipStructuredContent } from '../tooltip/tooltip';

type TooltipRenderer<P> = (params: P) => string | AgTooltipRendererResult;

class SeriesTooltipInteraction extends BaseProperties {
    @TempValidate(BOOLEAN)
    enabled: boolean = false;
}

export class SeriesTooltip<P extends AgSeriesTooltipRendererParams<any>> extends BaseProperties {
    @TempValidate(BOOLEAN, { optional: true })
    enabled?: boolean;

    @TempValidate(BOOLEAN, { optional: true })
    showArrow?: boolean;

    @TempValidate(FUNCTION, { optional: true })
    renderer?: TooltipRenderer<RequireOptional<P>>;

    @TempValidate(OBJECT)
    readonly interaction = new SeriesTooltipInteraction();

    @TempValidate(OBJECT)
    readonly position = new TooltipPosition();

    @TempValidate(INTERACTION_RANGE, { optional: true })
    range?: InteractionRange = undefined;

    @TempValidate(STRING, { optional: true })
    class?: string = undefined;

    public formatTooltip(
        caller1: { context?: unknown },
        caller2: { context?: unknown },
        content: TooltipStructuredContent,
        params: RequireOptional<P>
    ): TooltipContent {
        const overrides =
            this.renderer == null ? undefined : callWithContext(caller1, caller2, this.renderer, [params]);
        if (typeof overrides === 'string') return { type: 'raw', rawHtmlString: overrides };
        if (overrides != null) return { type: 'structured', ...content, ...overrides };
        return { type: 'structured', ...content };
    }
}
