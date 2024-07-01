export type GuardedElementProperties = {
    element: HTMLElement;
    topTabGuard: HTMLElement;
    bottomTabGuard: HTMLElement;
};
export declare class GuardedElement<TElement extends HTMLElement = HTMLElement> implements GuardedElementProperties {
    readonly element: TElement;
    readonly topTabGuard: HTMLElement;
    readonly bottomTabGuard: HTMLElement;
    private readonly destroyFns;
    private guardTarget?;
    private guardTabIndex;
    private guessedDelta?;
    constructor(element: TElement, topTabGuard: HTMLElement, bottomTabGuard: HTMLElement);
    set tabIndex(index: number);
    destroy(): void;
    private initEventListener;
    private onBlur;
    private onFocus;
    private onTabStart;
    getBrowserFocusDelta(): -1 | 0 | 1;
}
