import { getDocument, getResizeObserver, getWindow } from 'ag-charts-core';

import { PixelRatioObserver } from './pixelRatioObserver';

export type Size = {
    width: number;
    height: number;
    pixelRatio: number;
};
type OnSizeChange = (size: Size, element: HTMLElement) => void;
type Entry = {
    cb: OnSizeChange;
    size?: Size;
};

export class SizeMonitor {
    private readonly elements = new Map<HTMLElement, Entry>();
    private resizeObserver: ResizeObserver | undefined;
    private pixelRatioObserver: PixelRatioObserver | undefined;
    private documentReady = false;
    private queuedObserveRequests: [HTMLElement, OnSizeChange][] = [];

    constructor() {
        const ResizeObserverCtor = getResizeObserver();
        if (ResizeObserverCtor !== undefined) {
            this.resizeObserver = new ResizeObserverCtor((entries) => {
                for (const {
                    target,
                    contentRect: { width, height },
                } of entries) {
                    const entry = this.elements.get(target as HTMLElement);
                    this.checkSize(entry, target as HTMLElement, width, height);
                }
            });
        }

        // The resize observer should most pixel ratio changes
        // with the exception of moving the browser to a monitor with a different scaling
        // The resize observer will re-read the pixel ratio
        // so make sure this fires after the resize observer to avoid double rendering
        let animationFrame: NodeJS.Timeout;
        this.pixelRatioObserver = new PixelRatioObserver(() => {
            clearTimeout(animationFrame);
            animationFrame = setTimeout(() => this.checkPixelRatio(), 0);
        });

        this.documentReady = getDocument('readyState') === 'complete';
        if (this.documentReady) {
            this.observeWindow();
        } else {
            // Add load listener, so we can check if the main document is ready and all styles are loaded,
            // and if it is then attach any queued requests for resize monitoring.
            //
            // If we attach before document.readyState === 'complete', then additional incorrect resize events
            // are fired, leading to multiple re-renderings on chart initial load. Waiting for the
            // document to be loaded irons out this browser quirk.
            getWindow()?.addEventListener('load', this.onLoad);
        }
    }

    onLoad: EventListener = () => {
        this.documentReady = true;
        for (const [el, cb] of this.queuedObserveRequests) {
            this.observe(el, cb);
        }
        this.queuedObserveRequests = [];
        this.observeWindow();
    };

    private destroy() {
        getWindow()?.removeEventListener('load', this.onLoad);
        this.resizeObserver?.disconnect();
        this.resizeObserver = undefined;
        this.pixelRatioObserver?.disconnect();
        this.pixelRatioObserver = undefined;
    }

    private observeWindow() {
        this.pixelRatioObserver?.observe();
    }

    private checkPixelRatio() {
        const pixelRatio = this.pixelRatioObserver?.pixelRatio ?? 1;
        for (const [element, entry] of this.elements) {
            if (entry.size != null && entry.size.pixelRatio !== pixelRatio) {
                const { width, height } = entry.size;
                entry.size = { width, height, pixelRatio };
                entry.cb(entry.size, element);
            }
        }
    }

    private checkSize(entry: Entry | undefined, element: HTMLElement, width: number, height: number) {
        if (!entry) return;

        if (width !== entry.size?.width || height !== entry.size?.height) {
            const pixelRatio = this.pixelRatioObserver?.pixelRatio ?? 1;
            entry.size = { width, height, pixelRatio };
            entry.cb(entry.size, element);
        }
    }

    // Only a single callback is supported.
    observe(element: HTMLElement, cb: OnSizeChange) {
        if (!this.documentReady) {
            this.queuedObserveRequests.push([element, cb]);
            return;
        }

        if (this.elements.has(element)) {
            this.removeFromQueue(element);
        } else {
            this.resizeObserver?.observe(element);
        }
        const entry = { cb };
        this.elements.set(element, entry);
    }

    unobserve(element: HTMLElement) {
        this.resizeObserver?.unobserve(element);
        this.elements.delete(element);
        this.removeFromQueue(element);

        if (!this.elements.size) {
            this.destroy();
        }
    }

    removeFromQueue(element: HTMLElement) {
        this.queuedObserveRequests = this.queuedObserveRequests.filter(([el]) => el !== element);
    }
}
