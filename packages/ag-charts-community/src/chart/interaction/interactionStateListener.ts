import { BaseManager } from '../baseManager';

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
    AllButAnnotationsSelected = Default | ZoomDrag | Annotations | ContextMenu | Animation,
    All = AllButAnnotationsSelected | AnnotationsSelected,
}

export abstract class InteractionStateListener<
    TType extends string,
    TEvent extends { type: TType },
> extends BaseManager<TType, TEvent> {
    protected abstract getState(): InteractionState;

    // Wrapper to only broadcast events when the InteractionManager is a given state.
    override addListener<T extends TType>(
        type: T,
        handler: (event: TEvent & { type: T }) => void,
        triggeringStates: InteractionState = InteractionState.Default
    ) {
        return super.addListener(type, (e) => {
            const currentState = this.getState();
            if (currentState & triggeringStates) {
                handler(e);
            }
        });
    }
}
