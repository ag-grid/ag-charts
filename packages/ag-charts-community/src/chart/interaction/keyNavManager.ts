import type { FocusIndicator } from '../../dom/focusIndicator';
import type { ChartMode } from '../chartMode';
import type { InteractionEvent, InteractionManager, KeyInteractionEvent } from './interactionManager';
import { InteractionState, InteractionStateListener } from './interactionStateListener';
import { type PreventableEvent, dispatchTypedEvent } from './preventableEvent';

export type KeyNavEventType = 'nav-hori' | 'nav-vert' | 'nav-zoom' | 'submit' | 'undo' | 'redo';

export type KeyNavEvent<T extends KeyNavEventType = KeyNavEventType> = PreventableEvent & {
    type: T;
    delta: -1 | 0 | 1;
    sourceEvent: InteractionEvent;
};

// The purpose of this class is to decouple keyboard input events configuration with
// navigation commands. For example, keybindings might be different on macOS and Windows,
// or the charts might include options to reconfigure keybindings.
export class KeyNavManager extends InteractionStateListener<KeyNavEventType, KeyNavEvent> {
    // This is the "second last" input event. It can be useful for keydown
    // events that for which don't to set the isFocusVisible state
    // (e.g. Backspace/Delete key on FC annotations, see AG-13041).
    //
    // Use with caution! The focus indicator must ALWAYS be visible for
    // keyboard-only users.
    private previousInputDevice: 'mouse' | 'keyboard' = 'keyboard';

    constructor(
        readonly focusIndicator: FocusIndicator,
        readonly interactionManager: InteractionManager,
        mode: ChartMode
    ) {
        super();
        const mouseStates =
            InteractionState.Default | InteractionState.Annotations | InteractionState.AnnotationsSelected;
        this.destroyFns.push(
            interactionManager.addListener('click', () => this.onClick(), mouseStates),
            interactionManager.addListener('hover', () => this.onMouse(), mouseStates),
            interactionManager.addListener('drag-start', () => this.onMouse(), mouseStates),
            interactionManager.addListener('keydown', (e) => this.onKeyDown(e), InteractionState.All)
        );

        this.focusIndicator.overrideFocusVisible(mode === 'integrated' ? false : undefined); // AG-13197
    }

    protected override getState() {
        return this.interactionManager.getState();
    }

    public override destroy() {
        super.destroy();
    }

    private onClick() {
        this.focusIndicator.overrideFocusVisible(false);
        this.previousInputDevice = 'mouse';
    }

    private onMouse() {
        this.previousInputDevice = 'mouse';
    }

    private onKeyDown(event: KeyInteractionEvent<'keydown'>) {
        const state = this.getState();

        // FIXME: key is localised to it could be non-ASCII text like غ
        const { key, code, altKey, shiftKey, metaKey, ctrlKey } = event.sourceEvent;

        if (ctrlKey || metaKey) {
            if (key === 'y' || (key === 'z' && shiftKey)) {
                this.focusIndicator.overrideFocusVisible(this.previousInputDevice === 'keyboard');
                return this.dispatch('redo', 0, event);
            } else if (key === 'z') {
                this.focusIndicator.overrideFocusVisible(this.previousInputDevice === 'keyboard');
                return this.dispatch('undo', 0, event);
            }
        }

        // Annotations listen for KeyInteractionEvent<'keydown'> instead of KeyNavEvent<T>:
        if (state & (InteractionState.Annotations | InteractionState.AnnotationsSelected)) {
            // TODO: annotations should update the focus indicator bounds to surround the current annotation
            this.focusIndicator.overrideFocusVisible(false);
            return;
        }

        // We must read the key before the modifiers, because the text value can typed using modifiers.
        switch (key) {
            case '+':
                return this.dispatch('nav-zoom', 1, event);
            case '-':
                return this.dispatch('nav-zoom', -1, event);
        }
        if (altKey || shiftKey || metaKey || ctrlKey) return;

        this.focusIndicator.overrideFocusVisible(true);
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
        }
    }

    private dispatch(type: KeyNavEventType, delta: -1 | 0 | 1, sourceEvent: InteractionEvent) {
        const { previousInputDevice } = this;
        dispatchTypedEvent(this.listeners, { type, delta, sourceEvent, previousInputDevice });
        const sharedKbmTypes: readonly (typeof type)[] = ['redo', 'undo', 'nav-zoom'];
        if (sourceEvent.type === 'keydown' && !sharedKbmTypes.includes(type)) {
            this.previousInputDevice = 'keyboard';
        }
    }
}
