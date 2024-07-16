import type { AgSeriesTooltipRendererParams, AgTooltipRendererResult } from '../../options/chart/tooltipOptions';
import { BaseProperties } from '../../util/properties';
import type { RequireOptional } from '../../util/types';
import { TooltipPosition } from '../tooltip/tooltip';
type TooltipRenderer<P> = (params: P) => string | AgTooltipRendererResult;
declare class SeriesTooltipInteraction extends BaseProperties {
    enabled: boolean;
}
export declare class SeriesTooltip<P extends AgSeriesTooltipRendererParams> extends BaseProperties {
    enabled: boolean;
    showArrow?: boolean;
    renderer?: TooltipRenderer<P>;
    readonly interaction: SeriesTooltipInteraction;
    readonly position: TooltipPosition;
    toTooltipHtml(defaults: AgTooltipRendererResult, params: RequireOptional<P>): import("../tooltip/tooltip").TooltipContent;
}
export {};
