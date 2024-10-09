import type { FocusIndicator } from '../../dom/focusIndicator';
import type {
    FocusInteractionEvent,
    InteractionEvent,
    InteractionManager,
    KeyInteractionEvent,
} from './interactionManager';
import { InteractionState } from './interactionManager';
import { InteractionStateListener } from './interactionStateListener';
import { type PreventableEvent, dispatchTypedEvent } from './preventableEvent';

export type KeyNavEventType = 'blur' | 'focus' | 'nav-hori' | 'nav-vert' | 'nav-zoom' | 'submit' | 'cancel' | 'delete';

export type KeyNavEvent<T extends KeyNavEventType = KeyNavEventType> = PreventableEvent & {
    type: T;
    delta: -1 | 0 | 1;
    sourceEvent: InteractionEvent;

    // This is the "second last" input event. It can be useful for keydown
    // events that for which don't to set the isFocusVisible state
    // (e.g. Backspace/Delete key on FC annotations, see AG-13041).
    //
    // Use with caution! The focus indicator must ALWAYS be visible for
    // keyboard-only users.
    previousInputDevice: 'mouse' | 'keyboard';
};

// The purpose of this class is to decouple keyboard input events configuration with
// navigation commands. For example, keybindings might be different on macOS and Windows,
// or the charts might include options to reconfigure keybindings.
export class KeyNavManager extends InteractionStateListener<KeyNavEventType, KeyNavEvent> {
    private previousInputDevice: KeyNavEvent['previousInputDevice'] = 'keyboard';

    constructor(
        readonly focusIndicator: FocusIndicator,
        readonly interactionManager: InteractionManager
    ) {
        super();
        const mouseStates = InteractionState.Default | InteractionState.Annotations;
        this.destroyFns.push(
            interactionManager.addListener('hover', () => this.onMouse(), mouseStates),
            interactionManager.addListener('drag-start', () => this.onMouse(), mouseStates),
            interactionManager.addListener('blur', (e) => this.onBlur(e), InteractionState.All),
            interactionManager.addListener('focus', (e) => this.onFocus(e), InteractionState.All),
            interactionManager.addListener('keydown', (e) => this.onKeyDown(e), InteractionState.All)
        );
    }

    protected override getState() {
        return this.interactionManager.getState();
    }

    public override destroy() {
        super.destroy();
    }

    private onMouse() {
        this.previousInputDevice = 'mouse';
    }

    private onBlur(event: FocusInteractionEvent<'blur'>) {
        this.dispatch('blur', 0, event);
    }

    private onFocus(event: FocusInteractionEvent<'focus'>) {
        this.dispatch('focus', 0, event);
    }

    private onKeyDown(event: KeyInteractionEvent<'keydown'>) {
        this.focusIndicator.toggleForceInvisible(false);
        const { code, altKey, shiftKey, metaKey, ctrlKey } = event.sourceEvent;
        if (altKey || shiftKey || metaKey || ctrlKey) return;

        switch (code) {
            case 'ArrowDown':
                return this.dispatch('nav-vert', 1, event);
            case 'ArrowUp':
                return this.dispatch('nav-vert', -1, event);
            case 'ArrowLeft':
                return this.dispatch('nav-hori', -1, event);
            case 'ArrowRight':
                return this.dispatch('nav-hori', 1, event);
            case 'ZoomIn':
            case 'Add':
                return this.dispatch('nav-zoom', 1, event);
            case 'ZoomOut':
            case 'Substract':
                return this.dispatch('nav-zoom', -1, event);
            case 'Space':
            case 'Enter':
                return this.dispatch('submit', 0, event);
            case 'Escape':
                return this.dispatch('cancel', 0, event);
            case 'Backspace':
            case 'Delete':
                return this.dispatch('delete', 0, event);
        }

        switch (event.sourceEvent.key) {
            case '+':
                return this.dispatch('nav-zoom', 1, event);
            case '-':
                return this.dispatch('nav-zoom', -1, event);
        }
    }

    private dispatch(type: KeyNavEventType, delta: -1 | 0 | 1, sourceEvent: InteractionEvent) {
        const { previousInputDevice } = this;
        dispatchTypedEvent(this.listeners, { type, delta, sourceEvent, previousInputDevice });
        if (sourceEvent.type === 'keydown') {
            this.previousInputDevice = 'keyboard';
        }
    }
}
