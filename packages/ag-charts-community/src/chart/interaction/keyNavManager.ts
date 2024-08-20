import type {
    FocusInteractionEvent,
    InteractionEvent,
    InteractionManager,
    KeyInteractionEvent,
    PointerInteractionEvent,
} from './interactionManager';
import { InteractionState } from './interactionManager';
import { InteractionStateListener } from './interactionStateListener';
import { type PreventableEvent, dispatchTypedEvent } from './preventableEvent';

export type KeyNavEventType = 'blur' | 'focus' | 'nav-hori' | 'nav-vert' | 'nav-zoom' | 'submit' | 'cancel' | 'delete';

export type KeyNavEvent<T extends KeyNavEventType = KeyNavEventType> = PreventableEvent & {
    type: T;
    delta: -1 | 0 | 1;
    sourceEvent: InteractionEvent;
};

// The purpose of this class is to decouple keyboard input events configuration with
// navigation commands. For example, keybindings might be different on macOS and Windows,
// or the charts might include options to reconfigure keybindings.
export class KeyNavManager extends InteractionStateListener<KeyNavEventType, KeyNavEvent> {
    private hasBrowserFocus: boolean = false;
    private isMouseBlurred: boolean = false;
    private isClicking: boolean = false;

    constructor(readonly interactionManager: InteractionManager) {
        super();
        this.destroyFns.push(
            interactionManager.addListener('drag-start', (e) => this.onClickStart(e), InteractionState.All),
            interactionManager.addListener('click', (e) => this.onClickStop(e), InteractionState.All),
            interactionManager.addListener('drag-end', (e) => this.onClickStop(e), InteractionState.All),
            interactionManager.addListener('wheel', (e) => this.mouseBlur(e)),
            interactionManager.addListener('hover', (e) => this.mouseBlur(e)),
            interactionManager.addListener('drag', (e) => this.mouseBlur(e)),

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

    private onClickStart(event: PointerInteractionEvent<'drag-start'>) {
        this.isClicking = true;
        this.mouseBlur(event);
    }

    private onClickStop(event: PointerInteractionEvent<'drag-end' | 'click'>) {
        this.mouseBlur(event);
        this.isClicking = false;
    }

    private mouseBlur(event: PointerInteractionEvent) {
        if (!this.hasBrowserFocus) return;

        if (!this.isMouseBlurred) {
            this.dispatch('blur', 0, event);
            this.isMouseBlurred = true;
        }
    }

    private onBlur(event: FocusInteractionEvent<'blur'>) {
        this.hasBrowserFocus = false;
        this.isMouseBlurred = false;
        this.dispatch('blur', 0, event);
    }

    private onFocus(event: FocusInteractionEvent<'focus'>) {
        this.hasBrowserFocus = true;

        // CRT-420 - Differentiate between keyboard-nav focus and click focus (when browser tab is also
        // regaining focus - no click event is emitted).
        const tabFocusFromClick = event.relatedElement == null && event.targetElement?.tagName === 'CANVAS';
        if (this.isClicking || tabFocusFromClick) {
            this.isMouseBlurred = true;
            return;
        }

        this.dispatch('focus', 0, event);
    }

    private onKeyDown(event: KeyInteractionEvent<'keydown'>) {
        if (!this.hasBrowserFocus) return;

        this.isMouseBlurred = false;

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
        dispatchTypedEvent(this.listeners, { type, delta, sourceEvent });
    }
}
