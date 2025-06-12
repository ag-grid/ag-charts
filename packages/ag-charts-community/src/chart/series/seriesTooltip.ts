import type { RequireOptional } from 'ag-charts-core';
import type {
    AgSeriesTooltipRendererParams,
    AgTooltipRendererResult,
    InteractionRange,
    TContextDefault,
    TDatumDefault,
} from 'ag-charts-types';

import { callWithContext } from '../../util/callbackCache';
import { BaseProperties } from '../../util/properties';
import { Property } from '../../util/properties';
import { type TooltipContent, TooltipPosition, type TooltipStructuredContent } from '../tooltip/tooltip';

type TooltipRenderer<P> = (params: P) => string | AgTooltipRendererResult;

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
        if (overrides != null) return { type: 'structured', ...content, ...overrides };
        return { type: 'structured', ...content };
    }
}

export function makeSeriesTooltip<P extends AgSeriesTooltipRendererParams<TDatumDefault, TContextDefault>>() {
    return new SeriesTooltip<Omit<P, 'context'>>();
}
