import { BaseManager } from './baseManager';
export declare const INTERACTION_TYPES: readonly ["click", "dblclick", "contextmenu", "hover", "drag-start", "drag", "drag-end", "leave", "enter", "page-left", "wheel"];
export type InteractionTypes = (typeof INTERACTION_TYPES)[number];
export type PointerOffsets = {
    offsetX: number;
    offsetY: number;
};
export type PointerHistoryEvent = PointerOffsets & {
    type: string;
};
export type InteractionEvent<T extends InteractionTypes = InteractionTypes> = PointerOffsets & {
    type: T;
    pageX: number;
    pageY: number;
    deltaX: number;
    deltaY: number;
    pointerHistory: PointerHistoryEvent[];
    sourceEvent: Event;
    /** Consume the event, don't notify other listeners! */
    consume(): void;
    consumed?: boolean;
};
export declare enum InteractionState {
    Default = 8,
    ZoomDrag = 4,
    ContextMenu = 2,
    Animation = 1,
    All = 15
}
/**
 * Manages user interactions with a specific HTMLElement (or interactions that bubble from it's
 * children)
 */
export declare class InteractionManager extends BaseManager<InteractionTypes, InteractionEvent<InteractionTypes>> {
    private readonly debug;
    private readonly rootElement;
    private readonly element;
    private eventHandler;
    private mouseDown;
    private touchDown;
    private dragStartElement?;
    private clickHistory;
    private dblclickHistory;
    private stateQueue;
    constructor(element: HTMLElement);
    destroy(): void;
    addListener<T extends InteractionTypes>(type: T, handler: (event: InteractionEvent<T> & {
        type: T;
    }) => void, triggeringStates?: InteractionState): () => void;
    pushState(state: InteractionState): void;
    popState(state: InteractionState): void;
    getState(): number;
    private processEvent;
    private dispatchEvent;
    private recordDown;
    private recordUp;
    private decideInteractionEventTypes;
    private isEventOverElement;
    private static readonly NULL_COORDS;
    private calculateCoordinates;
    private getMouseEventCoords;
    private isWheelEvent;
    private buildEvent;
}
