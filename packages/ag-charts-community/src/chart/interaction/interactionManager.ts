// These interaction state are both bitflags and priorities.
// Smaller numbers have higher priority, because it is possible to find the least
// significant bit in O(1) complexity using a bitwise operation.
export enum InteractionState {
    Default = 32,
    ZoomDrag = 16,
    Annotations = 8,
    ContextMenu = 4,
    Animation = 2,
    AnnotationsSelected = 1,

    NavigatorDraggable = Default | Animation | ZoomDrag,
    Clickable = Default | Annotations | AnnotationsSelected,
    Keyable = Default | Animation,
    ContextMenuable = Default | ContextMenu, // AG-10233
    AnnotationsMoveable = Annotations | AnnotationsSelected,
    AnnotationsDraggable = Default | ZoomDrag | Annotations | AnnotationsSelected,

    All = Default | ZoomDrag | Annotations | ContextMenu | Animation | AnnotationsSelected,
}

export class InteractionManager {
    private stateQueue: InteractionState = InteractionState.Default | InteractionState.Animation;

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

    private static isWheelEvent(event: Event): event is WheelEvent {
        return event.type === 'wheel';
    }

    static getWheelDeltas(event: Event) {
        let [deltaX, deltaY] = [NaN, NaN];
        if (this.isWheelEvent(event)) {
            // AG-10475 On Chrome (Windows), wheel clicks send deltaMode: 0 events with deltaY: -100 or +100.
            // So we divide this by 100 to give us the desired step.
            const factor = event.deltaMode === 0 ? 0.01 : 1;
            deltaX = event.deltaX * factor;
            deltaY = event.deltaY * factor;
        }
        return { deltaX, deltaY };
    }
}
