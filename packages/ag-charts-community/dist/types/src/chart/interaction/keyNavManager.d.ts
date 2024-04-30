import { BaseManager } from './baseManager';
import { ConsumableEvent } from './consumableEvent';
import type { InteractionEvent, InteractionManager } from './interactionManager';
export type KeyNavEventType = 'blur' | 'browserfocus' | 'tab' | 'tab-start' | 'nav-hori' | 'nav-vert' | 'submit';
export type KeyNavEvent<T extends KeyNavEventType = KeyNavEventType> = ConsumableEvent & {
    type: T;
    delta: number;
    sourceEvent: InteractionEvent;
};
export declare class KeyNavManager extends BaseManager<KeyNavEventType, KeyNavEvent> {
    private hasBrowserFocus;
    private isMouseBlurred;
    private isClicking;
    constructor(interactionManager: InteractionManager);
    destroy(): void;
    private onClickStart;
    private onClickStop;
    private mouseBlur;
    private onBlur;
    private onFocus;
    private onKeyDown;
    private dispatch;
}
