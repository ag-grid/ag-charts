import type { AgDocument } from 'ag-charts-core';

import { PixelRatioObserver } from './pixelRatioObserver';

export interface Size {
    width: number;
    height: number;
    pixelRatio: number;
}

type OnSizeChange = (size: Size, element: HTMLElement) => void;

interface Entry {
    cb: OnSizeChange;
    size?: Size;
}

export class SizeMonitor {
    private readonly elements = new Map<HTMLElement, Entry>();
    private resizeObserver: ResizeObserver | undefined;
    private pixelRatioObserver: PixelRatioObserver | undefined;
    private documentReady = false;
    private queuedObserveRequests: [HTMLElement, OnSizeChange, { skipInitialRead?: boolean }?][] = [];
    private removeLoadListener: (() => void) | undefined;

    constructor(agDocument: AgDocument) {
        this.resizeObserver = agDocument.createResizeObserver((entries) => {
            for (const {
                target,
                contentRect: { width, height },
            } of entries) {
                const entry = this.elements.get(target as HTMLElement);
                this.checkSize(entry, target as HTMLElement, width, height);
            }
        });

        // The resize observer should most pixel ratio changes
        // with the exception of moving the browser to a monitor with a different scaling
        // The resize observer will re-read the pixel ratio
        // so make sure this fires after the resize observer to avoid double rendering
        let animationFrame: NodeJS.Timeout;
        this.pixelRatioObserver = new PixelRatioObserver(agDocument, () => {
            clearTimeout(animationFrame);
            animationFrame = setTimeout(() => this.checkPixelRatio(), 0);
        });

        this.documentReady = agDocument.isReady();
        if (this.documentReady) {
            this.observeWindow();
        } else {
            // Add load listener, so we can check if the main document is ready and all styles are loaded,
            // and if it is then attach any queued requests for resize monitoring.
            //
            // If we attach before document.readyState === 'complete', then additional incorrect resize events
            // are fired, leading to multiple re-renderings on chart initial load. Waiting for the
            // document to be loaded irons out this browser quirk.
            this.removeLoadListener = agDocument.attachListener('load', this.onLoad);
        }
    }

    onLoad: EventListener = () => {
        this.documentReady = true;
        for (const [el, cb, opts] of this.queuedObserveRequests) {
            this.observe(el, cb, opts);
        }
        this.queuedObserveRequests = [];
        this.observeWindow();
    };

    private destroy() {
        this.removeLoadListener?.();
        this.removeLoadListener = undefined;
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
    observe(element: HTMLElement, cb: OnSizeChange, opts?: { skipInitialRead?: boolean }) {
        if (!this.documentReady) {
            this.queuedObserveRequests.push([element, cb, opts]);
            return;
        }

        if (this.elements.has(element)) {
            this.removeFromQueue(element);
        } else {
            this.resizeObserver?.observe(element);
        }
        const entry: Entry = { cb };
        this.elements.set(element, entry);

        if (!opts?.skipInitialRead) {
            // Synchronous initial size read — cross-window ResizeObserver
            // may delay its first callback until the target window gains focus.
            // Use content-box dimensions to match ResizeObserver's contentRect,
            // avoiding a spurious second resize from border-box/content-box mismatch.
            const style = element.ownerDocument.defaultView?.getComputedStyle(element);
            const width =
                element.clientWidth -
                (Number.parseFloat(style?.paddingLeft ?? '0') + Number.parseFloat(style?.paddingRight ?? '0'));
            const height =
                element.clientHeight -
                (Number.parseFloat(style?.paddingTop ?? '0') + Number.parseFloat(style?.paddingBottom ?? '0'));
            if (width > 0 || height > 0) {
                this.checkSize(entry, element, width, height);
            }
        }
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
