import type { RequireOptional } from 'ag-charts-core';
import type { AgSeriesTooltipRendererParams, AgTooltipRendererResult, InteractionRange } from 'ag-charts-types';

import { BaseProperties } from '../../util/properties';
import { BOOLEAN, FUNCTION, INTERACTION_RANGE, OBJECT, STRING, Validate } from '../../util/validation';
import { type TooltipContent, TooltipPosition, type TooltipStructuredContent } from '../tooltip/tooltip';

type TooltipRenderer<P> = (params: P) => string | AgTooltipRendererResult;

class SeriesTooltipInteraction extends BaseProperties {
    @Validate(BOOLEAN)
    enabled: boolean = false;
}

export class SeriesTooltip<P extends AgSeriesTooltipRendererParams<any>> extends BaseProperties {
    @Validate(BOOLEAN)
    enabled: boolean = true;

    @Validate(BOOLEAN, { optional: true })
    showArrow?: boolean;

    @Validate(FUNCTION, { optional: true })
    renderer?: TooltipRenderer<RequireOptional<P>>;

    @Validate(OBJECT)
    readonly interaction = new SeriesTooltipInteraction();

    @Validate(OBJECT)
    readonly position = new TooltipPosition();

    @Validate(INTERACTION_RANGE, { optional: true })
    range?: InteractionRange = undefined;

    @Validate(STRING, { optional: true })
    class?: string = undefined;

    public formatTooltip(content: TooltipStructuredContent, params: RequireOptional<P>): TooltipContent {
        const overrides = this.renderer?.(params);
        if (typeof overrides === 'string') return { type: 'raw', rawHtmlString: overrides };
        if (overrides != null) return { type: 'structured', ...content, ...overrides };
        return { type: 'structured', ...content };
    }
}
