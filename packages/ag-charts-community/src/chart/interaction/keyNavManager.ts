import { BaseManager } from './baseManager';
import { ConsumableEvent, buildConsumable, dispatchTypedConsumable } from './consumableEvent';
import type {
    FocusInteractionEvent,
    InteractionEvent,
    InteractionManager,
    KeyInteractionEvent,
} from './interactionManager';

export type KeyNavEventType = 'tab' | 'tab-start' | 'nav-hori' | 'nav-vert' | 'submit';

export type KeyNavEvent<T extends KeyNavEventType = KeyNavEventType> = ConsumableEvent & {
    type: T;
    delta: number;
    interactionEvent: InteractionEvent;
};

// The purpose of this class is to decouple keyboard input events configuration with
// navigation commands. For example, keybindings might be different on macOS and Windows,
// or the charts might include options to reconfigure keybindings.
export class KeyNavManager extends BaseManager<KeyNavEventType, KeyNavEvent> {
    private isFocused: boolean = false;

    constructor(interactionManager: InteractionManager) {
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

    private onBlur(_event: FocusInteractionEvent<'blur'>) {
        this.isFocused = false;
    }

    private onFocus(event: FocusInteractionEvent<'focus'>) {
        this.isFocused = true;
        this.dispatch('tab', 0, event);
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
