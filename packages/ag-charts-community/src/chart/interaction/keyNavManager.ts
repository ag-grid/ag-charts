import { BaseManager } from '../baseManager';
import type { DOMManager } from '../dom/domManager';
import { type ConsumableEvent, buildConsumable, dispatchTypedConsumable } from './consumableEvent';
import type {
    FocusInteractionEvent,
    InteractionEvent,
    InteractionManager,
    KeyInteractionEvent,
    PointerInteractionEvent,
} from './interactionManager';
import { InteractionState } from './interactionManager';
import type { RegionName } from './regions';

export type KeyNavEventType = 'blur' | 'browserfocus' | 'tab' | 'nav-hori' | 'nav-vert' | 'submit';

export type KeyNavEvent<T extends KeyNavEventType = KeyNavEventType> = ConsumableEvent & {
    type: T;
    region?: RegionName;
    delta: -1 | 0 | 1;
    sourceEvent: InteractionEvent;
};

// The purpose of this class is to decouple keyboard input events configuration with
// navigation commands. For example, keybindings might be different on macOS and Windows,
// or the charts might include options to reconfigure keybindings.
export class KeyNavManager extends BaseManager<KeyNavEventType, KeyNavEvent> {
    private hasBrowserFocus: boolean = false;
    private isMouseBlurred: boolean = false;
    private isClicking: boolean = false;

    constructor(
        interactionManager: InteractionManager,
        private readonly domManager: DOMManager
    ) {
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

    public override destroy() {
        super.destroy();
    }

    private onClickStart(event: PointerInteractionEvent<'drag-start'>) {
        this.isClicking = true;
        this.mouseBlur(event);
    }

    private onClickStop(event: PointerInteractionEvent<'drag-end' | 'click'>) {
        this.isClicking = false;
        this.mouseBlur(event);
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
        if (this.isClicking) {
            this.isMouseBlurred = true;
        } else {
            const delta = this.domManager.parent.getBrowserFocusDelta();
            this.dispatch('browserfocus', delta, event);
            this.dispatch('tab', delta, event);
        }
    }

    private onKeyDown(event: KeyInteractionEvent<'keydown'>) {
        if (!this.hasBrowserFocus || this.isClicking) return;

        this.isMouseBlurred = false;

        switch (event.sourceEvent.code) {
            case 'Tab':
                if (event.sourceEvent.shiftKey) {
                    return this.dispatch('tab', -1, event);
                } else {
                    return this.dispatch('tab', 1, event);
                }
            case 'ArrowDown':
                return this.dispatch('nav-vert', 1, event);
            case 'ArrowUp':
                return this.dispatch('nav-vert', -1, event);
            case 'ArrowLeft':
                return this.dispatch('nav-hori', -1, event);
            case 'ArrowRight':
                return this.dispatch('nav-hori', 1, event);
            case 'Space':
            case 'Enter':
                return this.dispatch('submit', 0, event);
        }
    }

    private dispatch(type: KeyNavEventType, delta: -1 | 0 | 1, interactionEvent: InteractionEvent) {
        const event = buildConsumable({ type, delta, sourceEvent: interactionEvent });
        dispatchTypedConsumable(this.listeners, type, event);
    }
}
