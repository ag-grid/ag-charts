import { BaseManager } from './baseManager';
import type { InteractionManager, KeyInteractionEvent } from './interactionManager';

type KeyNavEventType = 'tabnext' | 'tabprev' | 'navup' | 'navdown';

type KeyNavEvent = {
    type: KeyNavEventType;
    interactionEvent: KeyInteractionEvent;
};

export class KeyNavManager extends BaseManager<KeyNavEventType, KeyNavEvent> {
    private isFocused: boolean = false;
    private readonly destroyFns: (() => void)[] = [];

    constructor(interactionManager: InteractionManager) {
        super();
        this.destroyFns.push(
            interactionManager.addListener('blur', () => (this.isFocused = false)),
            interactionManager.addListener('focus', () => (this.isFocused = true)),
            interactionManager.addListener('keydown', (e) => this.onKeyDown(e))
        );
    }

    public override destroy() {
        super.destroy();
        this.destroyFns.forEach((fn) => fn());
    }

    private onKeyDown(event: KeyInteractionEvent<'keydown'>) {
        if (!this.isFocused) return;

        switch (event.sourceEvent.code) {
            case 'Tab':
                if (event.sourceEvent.shiftKey) {
                    return this.dispatch('tabprev', event);
                } else {
                    return this.dispatch('tabnext', event);
                }
            case 'ArrowDown':
                return this.dispatch('navdown', event);
            case 'ArrowUp':
                return this.dispatch('navup', event);
        }
    }

    private dispatch(type: KeyNavEventType, interactionEvent: KeyInteractionEvent) {
        this.listeners.dispatch(type, { type, interactionEvent });
    }
}
