import { BaseManager } from './baseManager';
import { ConsumableEvent, buildConsumable, dispatchTypedConsumable } from './consumableEvent';
import type {
    FocusInteractionEvent,
    InteractionEvent,
    InteractionManager,
    KeyInteractionEvent,
} from './interactionManager';

export type KeyNavEventType = 'blur' | 'focus' | 'tab' | 'tab-start' | 'nav-hori' | 'nav-vert' | 'submit';

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
    private isFocused: boolean = false;

    constructor(
        interactionManager: InteractionManager,
        private readonly container: HTMLElement | undefined
    ) {
        super();
        this.destroyFns.push(
            interactionManager.addListener('blur', (e) => this.onBlur(e)),
            interactionManager.addListener('focus', (e) => this.onFocus(e)),
            interactionManager.addListener('keydown', (e) => this.onKeyDown(e))
        );
    }

    public override destroy() {
        super.destroy();
    }

    private onBlur(event: FocusInteractionEvent<'blur'>) {
        this.isFocused = false;
        this.dispatch('blur', 0, event);
    }

    private onFocus(event: FocusInteractionEvent<'focus'>) {
        const delta = guessDirection(this.container, event.sourceEvent.relatedTarget);
        this.isFocused = true;
        this.dispatch('focus', delta, event);
    }

    private onKeyDown(event: KeyInteractionEvent<'keydown'>) {
        if (!this.isFocused) return;

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

    private dispatch(type: KeyNavEventType, delta: number, interactionEvent: KeyNavEvent['interactionEvent']) {
        const event = buildConsumable({ type, delta, interactionEvent });
        dispatchTypedConsumable(this.listeners, type, event);
    }
}
