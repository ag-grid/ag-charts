import type { DOMManager } from '../../dom/domManager';
import type { FocusIndicator } from '../../dom/focusIndicator';
import { BaseManager } from '../../util/baseManager';
import type { KeyboardWidgetEvent } from '../../widget/widgetEvents';
import type { InteractionManager } from './interactionManager';
import { InteractionState } from './interactionStateListener';

export type KeyNavEventType = 'nav-hori' | 'nav-vert' | 'nav-zoom' | 'submit' | 'undo' | 'redo';

export type KeyNavEvent<T extends KeyNavEventType = KeyNavEventType> = {
    type: T;
    delta: -1 | 0 | 1;
    sourceEvent: KeyboardWidgetEvent<'keydown'>;
    preventDefault(): void;
};

const MOUSE_STATES = InteractionState.Default | InteractionState.Annotations | InteractionState.AnnotationsSelected;

// The purpose of this class is to decouple keyboard input events configuration with
// navigation commands. For example, keybindings might be different on macOS and Windows,
// or the charts might include options to reconfigure keybindings.
export class KeyNavManager extends BaseManager<KeyNavEventType, KeyNavEvent> {
    // This is the "second last" input event. It can be useful for keydown
    // events that for which don't to set the isFocusVisible state
    // (e.g. Backspace/Delete key on FC annotations, see AG-13041).
    //
    // Use with caution! The focus indicator must ALWAYS be visible for
    // keyboard-only users.
    private previousInputDevice: 'mouse' | 'keyboard' = 'keyboard';

    // FIXME: focusIndicator state should be managed by SeriesAreaManager.
    public focusIndicator?: FocusIndicator;

    constructor(
        readonly interactionManager: InteractionManager,
        { containerWidget, seriesWidget }: DOMManager
    ) {
        super();
        this.destroyFns.push(
            containerWidget.addListener('mousemove', () => this.onMouse()),
            containerWidget.addListener('wheel', () => this.onClick()),
            containerWidget.addListener('drag-move', () => this.onClick()),
            seriesWidget.addListener('keydown', (e) => this.onKeyDown(e)),
            seriesWidget.addListener('click', () => this.onClick())
        );
    }

    private getState() {
        return this.interactionManager.getState();
    }

    public override destroy() {
        super.destroy();
    }

    private onClick() {
        if (!(this.getState() & MOUSE_STATES)) return;
        this.focusIndicator?.overrideFocusVisible(false);
        this.previousInputDevice = 'mouse';
    }

    private onMouse() {
        if (!(this.getState() & MOUSE_STATES)) return;
        this.previousInputDevice = 'mouse';
    }

    private onKeyDown(event: KeyNavEvent['sourceEvent']) {
        const state = this.getState();

        // FIXME: key is localised to it could be non-ASCII text like غ
        const { key, code, altKey, shiftKey, metaKey, ctrlKey } = event.sourceEvent;

        if (ctrlKey || metaKey) {
            if (key === 'y' || (key === 'z' && shiftKey)) {
                this.focusIndicator?.overrideFocusVisible(this.previousInputDevice === 'keyboard');
                return this.dispatch('redo', 0, event);
            } else if (key === 'z') {
                this.focusIndicator?.overrideFocusVisible(this.previousInputDevice === 'keyboard');
                return this.dispatch('undo', 0, event);
            }
        }

        // Annotations listen for KeyInteractionEvent<'keydown'> instead of KeyNavEvent<T>:
        if (state & (InteractionState.Annotations | InteractionState.AnnotationsSelected)) {
            // TODO: annotations should update the focus indicator bounds to surround the current annotation
            this.focusIndicator?.overrideFocusVisible(false);
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

        this.focusIndicator?.overrideFocusVisible(true);
        if (key === 'Enter') {
            // AG-13086: Ensure numpad enter + normal enter are treated consistently.
            return this.dispatch('submit', 0, event);
        }
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

    private dispatch(type: KeyNavEventType, delta: -1 | 0 | 1, sourceEvent: KeyNavEvent['sourceEvent']) {
        const keyNavEvent: KeyNavEvent = {
            type,
            delta,
            sourceEvent,
            preventDefault(): void {
                sourceEvent.sourceEvent.preventDefault();
            },
        };
        this.listeners.dispatchWrapHandlers(type, (handler, e) => handler(e), keyNavEvent);
        const sharedKbmTypes: readonly (typeof type)[] = ['redo', 'undo', 'nav-zoom'];
        if (sourceEvent.type === 'keydown' && !sharedKbmTypes.includes(type)) {
            this.previousInputDevice = 'keyboard';
        }
    }
}
