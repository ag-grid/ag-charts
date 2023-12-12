import type { AgSeriesTooltipRendererParams, AgTooltipRendererResult } from '../../options/chart/tooltipOptions';
import { interpolate } from '../../util/string';
import { BOOLEAN, FUNCTION, STRING, Validate } from '../../util/validation';
import { TooltipPosition, toTooltipHtml } from '../tooltip/tooltip';

type TooltipRenderer<P> = (params: P) => string | AgTooltipRendererResult;
type TooltipOverrides<P> = { format?: string; renderer?: TooltipRenderer<P> };

class SeriesTooltipInteraction {
    @Validate(BOOLEAN)
    enabled = false;
}

export class SeriesTooltip<P extends AgSeriesTooltipRendererParams> {
    @Validate(BOOLEAN)
    enabled = true;

    @Validate(BOOLEAN, { optional: true })
    showArrow?: boolean = undefined;

    @Validate(STRING, { optional: true })
    format?: string = undefined;

    @Validate(FUNCTION, { optional: true })
    renderer?: TooltipRenderer<P> = undefined;

    readonly interaction = new SeriesTooltipInteraction();
    readonly position = new TooltipPosition();

    toTooltipHtml(defaults: AgTooltipRendererResult, params: P, overrides?: TooltipOverrides<P>) {
        const formatFn = overrides?.format ?? this.format;
        const rendererFn = overrides?.renderer ?? this.renderer;
        if (formatFn) {
            return toTooltipHtml({ content: interpolate(formatFn, params) }, defaults);
        }
        if (rendererFn) {
            return toTooltipHtml(rendererFn(params), defaults);
        }
        return toTooltipHtml(defaults);
    }
}
