import { BaseManager } from './baseManager';
import { ConsumableEvent, buildConsumable, dispatchTypedConsumable } from './consumableEvent';
import type {
    FocusInteractionEvent,
    InteractionEvent,
    InteractionManager,
    KeyInteractionEvent,
    PointerInteractionEvent,
} from './interactionManager';
import { InteractionState } from './interactionManager';

export type KeyNavEventType = 'blur' | 'browserfocus' | 'tab' | 'tab-start' | 'nav-hori' | 'nav-vert' | 'submit';

export type KeyNavEvent<T extends KeyNavEventType = KeyNavEventType> = ConsumableEvent & {
    type: T;
    delta: number;
    interactionEvent: InteractionEvent;
};

function getTabIndex(obj: { tabIndex?: unknown } | undefined | null): number | undefined {
    if (obj?.tabIndex != null && typeof obj.tabIndex === 'number') {
        return obj.tabIndex;
    }
    return undefined;
}

function guessDirection(
    container: HTMLElement | undefined,
    relatedTarget: (EventTarget & { tabIndex?: unknown }) | null
): -1 | 1 {
    // Try to guess whether this 'focus' event comes from a TAB or Shift+TAB:
    const currIndex = getTabIndex(container);
    const prevIndex = getTabIndex(relatedTarget);
    if (currIndex !== undefined && prevIndex !== undefined) {
        return currIndex < prevIndex ? -1 : 1;
    }
    return 1;
}

// The purpose of this class is to decouple keyboard input events configuration with
// navigation commands. For example, keybindings might be different on macOS and Windows,
// or the charts might include options to reconfigure keybindings.
export class KeyNavManager extends BaseManager<KeyNavEventType, KeyNavEvent> {
    private hasBrowserFocus: boolean = false;
    private isMouseBlurred: boolean = false;
    private isClicking: boolean = false;

    constructor(
        interactionManager: InteractionManager,
        private readonly element: HTMLElement | undefined
    ) {
        super();
        this.destroyFns.push(
            interactionManager.addListener('drag-start', (e) => this.onClickStart(e), InteractionState.All),
            interactionManager.addListener('click', (e) => this.onClickStop(e), InteractionState.All),
            interactionManager.addListener('drag-end', (e) => this.onClickStop(e), InteractionState.All),
            interactionManager.addListener('wheel', (e) => this.mouseBlur(e)),
            interactionManager.addListener('hover', (e) => this.mouseBlur(e)),

            interactionManager.addListener('blur', (e) => this.onBlur(e), InteractionState.All),
            interactionManager.addListener('focus', (e) => this.onFocus(e), InteractionState.All),
            interactionManager.addListener('keydown', (e) => this.onKeyDown(e), InteractionState.All)
        );
    }

    public override destroy() {
        super.destroy();
    }

    private onClickStart(_event: PointerInteractionEvent<'drag-start'>) {
        this.isClicking = true;
    }

    private onClickStop(_event: PointerInteractionEvent<'drag-end' | 'click'>) {
        this.isClicking = false;
    }

    private mouseBlur(event: PointerInteractionEvent<'wheel' | 'hover'>) {
        if (!this.isMouseBlurred && this.hasBrowserFocus) {
            this.dispatch('blur', 0, event);
        }
        this.isMouseBlurred = true;
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
            const delta = guessDirection(this.element, event.sourceEvent.relatedTarget);
            this.dispatch('browserfocus', delta, event);
            this.dispatch('tab', 0, event);
        }
    }

    private onKeyDown(event: KeyInteractionEvent<'keydown'>) {
        if (!this.hasBrowserFocus) return;

        if (this.isMouseBlurred) {
            if (!this.isClicking) {
                this.dispatch('tab', 0, event);
                this.isMouseBlurred = false;
            }
            return;
        }

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

    private dispatch(type: KeyNavEventType, delta: number, interactionEvent: InteractionEvent) {
        const event = buildConsumable({ type, delta, interactionEvent });
        dispatchTypedConsumable(this.listeners, type, event);
    }
}
