import { BaseManager } from './baseManager';
import { ConsumableEvent } from './consumableEvent';
export declare const POINTER_INTERACTION_TYPES: readonly ["click", "dblclick", "contextmenu", "hover", "drag-start", "drag", "drag-end", "leave", "enter", "page-left", "wheel"];
declare const FOCUS_INTERACTION_TYPES: readonly ["blur", "focus"];
declare const KEY_INTERACTION_TYPES: readonly ["keydown", "keyup"];
export type PointerInteractionTypes = (typeof POINTER_INTERACTION_TYPES)[number];
export type FocusInteractionTypes = (typeof FOCUS_INTERACTION_TYPES)[number];
export type KeyInteractionTypes = (typeof KEY_INTERACTION_TYPES)[number];
export type InteractionTypes = PointerInteractionTypes | FocusInteractionTypes | KeyInteractionTypes;
type BaseInteractionEvent<T extends InteractionTypes, TEvent extends Event> = ConsumableEvent & {
    type: T;
    sourceEvent: TEvent;
};
export type PointerOffsets = {
    offsetX: number;
    offsetY: number;
};
export type PointerHistoryEvent = PointerOffsets & {
    type: string;
};
export type PointerInteractionEvent<T extends PointerInteractionTypes = PointerInteractionTypes> = PointerOffsets & BaseInteractionEvent<T, Event> & {
    pageX: number;
    pageY: number;
    deltaX: number;
    deltaY: number;
    pointerHistory: PointerHistoryEvent[];
};
export type FocusInteractionEvent<T extends FocusInteractionTypes = FocusInteractionTypes> = BaseInteractionEvent<T, FocusEvent>;
export type KeyInteractionEvent<T extends KeyInteractionTypes = KeyInteractionTypes> = BaseInteractionEvent<T, KeyboardEvent>;
export type InteractionEvent = PointerInteractionEvent<PointerInteractionTypes> | FocusInteractionEvent<FocusInteractionTypes> | KeyInteractionEvent<KeyInteractionTypes>;
export declare enum InteractionState {
    Default = 16,
    ZoomDrag = 8,
    Annotations = 4,
    ContextMenu = 2,
    Animation = 1,
    All = 31
}
/**
 * Manages user interactions with a specific HTMLElement (or interactions that bubble from it's
 * children)
 */
export declare class InteractionManager extends BaseManager<InteractionTypes, InteractionEvent> {
    private readonly keyboardOptions;
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
    constructor(keyboardOptions: {
        readonly enabled: boolean;
    }, element: HTMLElement);
    destroy(): void;
    addListener<T extends InteractionTypes>(type: T, handler: (event: InteractionEvent & {
        type: T;
    }) => void, triggeringStates?: InteractionState): () => void;
    pushState(state: InteractionState): void;
    popState(state: InteractionState): void;
    getState(): number;
    private processEvent;
    private dispatchEvent;
    private dispatchPointerEvent;
    private recordDown;
    private recordUp;
    private decideInteractionEventTypes;
    private isEventOverElement;
    private static readonly NULL_COORDS;
    private calculateCoordinates;
    private getMouseEventCoords;
    private isWheelEvent;
    private buildPointerEvent;
}
export {};
