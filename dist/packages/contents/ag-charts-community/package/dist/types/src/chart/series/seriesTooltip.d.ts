import type { AgSeriesTooltipRendererParams, AgTooltipRendererResult, InteractionRange } from 'ag-charts-types';
import { BaseProperties } from '../../util/properties';
import type { RequireOptional } from '../../util/types';
import { TooltipPosition } from '../tooltip/tooltip';
type TooltipRenderer<P> = (params: P) => string | AgTooltipRendererResult;
declare class SeriesTooltipInteraction extends BaseProperties {
    enabled: boolean;
}
export declare class SeriesTooltip<P extends AgSeriesTooltipRendererParams<any>> extends BaseProperties {
    enabled: boolean;
    showArrow?: boolean;
    renderer?: TooltipRenderer<P>;
    readonly interaction: SeriesTooltipInteraction;
    readonly position: TooltipPosition;
    range?: InteractionRange;
    toTooltipHtml(defaults: AgTooltipRendererResult, params: RequireOptional<P>): import("../tooltip/tooltip").TooltipContent;
}
export {};
