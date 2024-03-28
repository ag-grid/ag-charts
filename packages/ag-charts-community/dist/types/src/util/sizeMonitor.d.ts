type Size = {
    width: number;
    height: number;
};
type OnSizeChange = (size: Size, element: HTMLElement) => void;
type Entry = {
    cb: OnSizeChange;
    size?: Size;
};
export declare class SizeMonitor {
    private elements;
    private resizeObserver;
    private documentReady;
    private queuedObserveRequests;
    constructor();
    onLoad: EventListener;
    private destroy;
    private checkSize;
    observe(element: HTMLElement, cb: OnSizeChange): void;
    unobserve(element: HTMLElement): void;
    removeFromQueue(element: HTMLElement): void;
    checkClientSize(element: HTMLElement, entry: Entry): void;
}
export {};
