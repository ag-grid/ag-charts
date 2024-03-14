import type { InteractionRange } from '../../options/agChartOptions';
import type { AgSeriesTooltipRendererParams, AgTooltipRendererResult } from '../../options/chart/tooltipOptions';
import { BaseProperties } from '../../util/properties';
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

    @Validate(INTERACTION_RANGE)
    range: InteractionRange = 'nearest';

    @Validate(OBJECT)
    readonly position = new TooltipPosition();

    toTooltipHtml(defaults: AgTooltipRendererResult, params: P) {
        if (this.renderer) {
            return toTooltipHtml(this.renderer(params), defaults);
        }
        return toTooltipHtml(defaults);
    }
}
