import { BaseManager } from '../baseManager';
import type { DOMManager } from '../dom/domManager';
import type { InteractionEvent, InteractionManager } from './interactionManager';
import { type PreventableEvent } from './preventableEvent';
export type KeyNavEventType = 'blur' | 'browserfocus' | 'tab' | 'nav-hori' | 'nav-vert' | 'nav-zoom' | 'submit' | 'cancel' | 'delete';
export type KeyNavEvent<T extends KeyNavEventType = KeyNavEventType> = PreventableEvent & {
    type: T;
    delta: -1 | 0 | 1;
    sourceEvent: InteractionEvent;
};
export declare class KeyNavManager extends BaseManager<KeyNavEventType, KeyNavEvent> {
    private readonly domManager;
    private hasBrowserFocus;
    private isMouseBlurred;
    private isClicking;
    constructor(interactionManager: InteractionManager, domManager: DOMManager);
    destroy(): void;
    private onClickStart;
    private onClickStop;
    private mouseBlur;
    private onBlur;
    private onFocus;
    private onKeyDown;
    private dispatch;
}
