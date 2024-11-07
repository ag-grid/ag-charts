import type { AgSeriesTooltipRendererParams, AgTooltipRendererResult, InteractionRange } from 'ag-charts-types';

import { BaseProperties } from '../../util/properties';
import type { RequireOptional } from '../../util/types';
import { BOOLEAN, FUNCTION, INTERACTION_RANGE, OBJECT, STRING, Validate } from '../../util/validation';
import { TooltipPosition, toTooltipHtml } from '../tooltip/tooltip';

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
    renderer?: TooltipRenderer<P>;

    @Validate(OBJECT)
    readonly interaction = new SeriesTooltipInteraction();

    @Validate(OBJECT)
    readonly position = new TooltipPosition();

    @Validate(INTERACTION_RANGE, { optional: true })
    range?: InteractionRange = undefined;

    @Validate(STRING, { optional: true })
    class?: string = undefined;

    toTooltipHtml(defaults: AgTooltipRendererResult, params: RequireOptional<P>) {
        const defaultsWithClass = defaults.class == null ? { ...defaults, class: this.class } : defaults;
        if (this.renderer) {
            return toTooltipHtml(this.renderer(params as P), defaultsWithClass);
        }
        return toTooltipHtml(defaultsWithClass);
    }
}
