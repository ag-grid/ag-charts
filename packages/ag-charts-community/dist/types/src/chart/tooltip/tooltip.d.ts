import type { AgTooltipRendererResult, InteractionRange, TextWrap } from '../../options/agChartOptions';
import { BaseProperties } from '../../util/properties';
import type { PointerInteractionEvent, PointerOffsets } from '../interaction/interactionManager';
export declare const DEFAULT_TOOLTIP_CLASS = "ag-chart-tooltip";
export declare const DEFAULT_TOOLTIP_DARK_CLASS = "ag-chart-dark-tooltip";
type TooltipPositionType = 'pointer' | 'node' | 'top' | 'right' | 'bottom' | 'left' | 'top-left' | 'top-right' | 'bottom-right' | 'bottom-left';
export type TooltipEventType = 'hover' | 'keyboard';
export type TooltipPointerEvent<T extends TooltipEventType> = PointerOffsets & {
    type: T;
};
export type TooltipMeta = PointerOffsets & {
    showArrow?: boolean;
    lastPointerEvent?: TooltipPointerEvent<TooltipEventType>;
    position?: {
        type?: TooltipPositionType;
        xOffset?: number;
        yOffset?: number;
    };
    enableInteraction?: boolean;
};
export type TooltipContent = {
    html: string;
    ariaLabel: string;
};
export declare const EMPTY_TOOLTIP_CONTENT: Readonly<TooltipContent>;
export declare function toTooltipHtml(input: string | AgTooltipRendererResult, defaults?: AgTooltipRendererResult): TooltipContent;
export declare class TooltipPosition extends BaseProperties {
    /** The type of positioning for the tooltip. By default, the tooltip follows the pointer. */
    type: TooltipPositionType;
    /** The horizontal offset in pixels for the position of the tooltip. */
    xOffset: number;
    /** The vertical offset in pixels for the position of the tooltip. */
    yOffset: number;
}
export declare class Tooltip extends BaseProperties {
    enabled: boolean;
    showArrow?: boolean;
    class?: string;
    delay: number;
    range: InteractionRange;
    wrapping: TextWrap;
    readonly position: TooltipPosition;
    darkTheme: boolean;
    private enableInteraction;
    private lastVisibilityChange;
    private readonly wrapTypes;
    private readonly element;
    readonly root: HTMLElement;
    private showTimeout;
    private _showArrow;
    constructor();
    destroy(): void;
    isVisible(): boolean;
    /**
     * Shows tooltip at the given event's coordinates.
     * If the `html` parameter is missing, moves the existing tooltip to the new position.
     */
    show(canvasRect: DOMRect, meta: TooltipMeta, content?: TooltipContent | null, instantly?: boolean): void;
    private getWindowSize;
    toggle(visible: boolean): void;
    pointerLeftOntoTooltip(event: PointerInteractionEvent<'leave'>): boolean;
    private updateShowArrow;
    private getTooltipBounds;
}
export {};
