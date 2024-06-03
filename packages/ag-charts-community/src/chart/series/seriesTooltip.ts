import type { InteractionRange } from '../../options/agChartOptions';
import type { AgSeriesTooltipRendererParams, AgTooltipRendererResult } from '../../options/chart/tooltipOptions';
import { BaseProperties } from '../../util/properties';
import type { RequireOptional } from '../../util/types';
import { BOOLEAN, FUNCTION, INTERACTION_RANGE, OBJECT, Validate } from '../../util/validation';
import { TooltipPosition, toTooltipHtml } from '../tooltip/tooltip';

type TooltipRenderer<P> = (params: P) => string | AgTooltipRendererResult;

class SeriesTooltipInteraction extends BaseProperties {
    @Validate(BOOLEAN)
    enabled: boolean = false;
}

export class SeriesTooltip<P extends AgSeriesTooltipRendererParams> extends BaseProperties {
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

    toTooltipHtml(defaults: AgTooltipRendererResult, params: RequireOptional<P>) {
        if (this.renderer) {
            return toTooltipHtml(this.renderer(params as P), defaults);
        }
        return toTooltipHtml(defaults);
    }
}
