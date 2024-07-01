import type { AgTooltipRendererResult, InteractionRange, TextWrap } from 'ag-charts-types';
import { BaseProperties } from '../../util/properties';
import type { DOMManager } from '../dom/domManager';
import type { PointerOffsets } from '../interaction/interactionManager';
export declare const DEFAULT_TOOLTIP_CLASS = "ag-chart-tooltip";
export declare const DEFAULT_TOOLTIP_DARK_CLASS = "ag-chart-dark-tooltip";
type TooltipPositionType = 'pointer' | 'node' | 'top' | 'right' | 'bottom' | 'left' | 'top-left' | 'top-right' | 'bottom-right' | 'bottom-left';
export type TooltipEventType = 'hover' | 'drag' | 'keyboard';
export type TooltipPointerEvent<T extends TooltipEventType> = PointerOffsets & {
    type: T;
    relatedElement?: HTMLElement;
    targetElement?: HTMLElement;
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
    range?: InteractionRange;
    wrapping: TextWrap;
    readonly position: TooltipPosition;
    darkTheme: boolean;
    nestedDOM: boolean;
    private enableInteraction;
    private lastVisibilityChange;
    private readonly wrapTypes;
    private element?;
    private showTimeout;
    private _showArrow;
    get interactive(): boolean;
    constructor();
    setup(domManager: DOMManager): void;
    destroy(domManager: DOMManager): void;
    isVisible(): boolean;
    /**
     * Shows tooltip at the given event's coordinates.
     * If the `html` parameter is missing, moves the existing tooltip to the new position.
     */
    show(canvasRect: DOMRect, meta: TooltipMeta, content?: TooltipContent | null, instantly?: boolean): void;
    private getWindowSize;
    toggle(visible: boolean): void;
    private updateShowArrow;
    private getTooltipBounds;
}
export {};
