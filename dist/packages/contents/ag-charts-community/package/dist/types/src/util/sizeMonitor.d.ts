type Size = {
    width: number;
    height: number;
};
type OnSizeChange = (size: Size, element: HTMLElement) => void;
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
}
export {};
