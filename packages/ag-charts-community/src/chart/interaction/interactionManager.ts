// These interaction state are both bitflags and priorities.
// Smaller numbers have higher priority, because it is possible to find the least
// significant bit in O(1) complexity using a bitwise operation.
//
// SONARCLOUD EXCEPTION (S6550): Computed enum values using bitwise OR expressions are
// intentionally kept for maintainability and self-documentation. Converting to literal
// numbers would harm readability and make the bitflag combinations harder to understand.
export enum InteractionState {
    Default = 64,
    ZoomDrag = 32,
    Annotations = 16,
    ContextMenu = 8,
    Animation = 4,
    AnnotationsSelected = 2,
    Frozen = 1,
    NoInteraction = 0,

    Clickable = Default | Annotations | AnnotationsSelected,
    Focusable = Default | Animation,
    Keyable = Default | Animation | Annotations | AnnotationsSelected,
    ContextMenuable = Default | ContextMenu, // AG-10233
    AnnotationsMoveable = Annotations | AnnotationsSelected,
    AnnotationsDraggable = Default | ZoomDrag | Annotations | AnnotationsSelected,
    ZoomDraggable = Default | Animation | ZoomDrag,
    ZoomClickable = Default | Animation,
    ZoomWheelable = Default | Animation | ZoomDrag | Annotations | AnnotationsSelected,

    All = Default | ZoomDrag | Annotations | ContextMenu | Animation | AnnotationsSelected,
}

export class InteractionManager {
    private stateQueue: InteractionState = InteractionState.Default | InteractionState.Animation;
    private static readonly interactionStateMask =
        InteractionState.All & ~InteractionState.Default & ~InteractionState.Animation;
    private updateNonBlockingStates = InteractionState.NoInteraction;

    public pushState(state: InteractionState) {
        this.stateQueue |= state;
    }

    public popState(state: InteractionState) {
        this.stateQueue &= ~state;
    }

    public isState(allowedStates: InteractionState): boolean {
        // Bitwise operation to get the least significant bit:
        return !!(this.stateQueue & -this.stateQueue & allowedStates);
    }

    public isInteracting(): boolean {
        return (this.stateQueue & InteractionManager.interactionStateMask) !== 0;
    }

    public setUpdateNonBlockingState(state: InteractionState, enabled: boolean): void {
        if (enabled) {
            this.updateNonBlockingStates |= state;
        } else {
            this.updateNonBlockingStates &= ~state;
        }
    }

    public isUpdateBlocked(): boolean {
        const mask = InteractionManager.interactionStateMask & ~this.updateNonBlockingStates;
        return (this.stateQueue & mask) !== 0;
    }
}
