import { getDocument, getWindow } from './dom';

type Size = {
    width: number;
    height: number;
};
type OnSizeChange = (size: Size, element: HTMLElement) => void;
type Entry = {
    cb: OnSizeChange;
    size?: Size;
};

export class SizeMonitor {
    private elements = new Map<HTMLElement, Entry>();
    private resizeObserver: any;
    private documentReady = false;
    private queuedObserveRequests: [HTMLElement, OnSizeChange][] = [];

    constructor() {
        if (typeof ResizeObserver === 'undefined') {
            for (const [element, entry] of this.elements) {
                this.checkClientSize(element, entry);
            }
            return;
        }

        this.resizeObserver = new ResizeObserver((entries: any) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                this.checkSize(this.elements.get(entry.target), entry.target, width, height);
            }
        });

        this.documentReady = getDocument().readyState === 'complete';
        if (!this.documentReady) {
            // Add load listener, so we can check if the main document is ready and all styles are loaded,
            // and if it is then attach any queued requests for resize monitoring.
            //
            // If we attach before document.readyState === 'complete', then additional incorrect resize events
            // are fired, leading to multiple re-renderings on chart initial load. Waiting for the
            // document to be loaded irons out this browser quirk.
            getWindow()?.addEventListener('load', this.onContentLoaded);
        }
    }

    onContentLoaded: EventListener = () => {
        const newState = getDocument()?.readyState === 'complete';
        const oldState = this.documentReady;
        this.documentReady = newState;
        if (newState && newState !== oldState) {
            this.queuedObserveRequests.forEach(([el, cb]) => this.observe(el, cb));
            this.queuedObserveRequests = [];
        }
    };

    private destroy() {
        getWindow()?.removeEventListener('load', this.onContentLoaded);
        this.resizeObserver?.disconnect();
        this.resizeObserver = null;
    }

    private checkSize(entry: Entry | undefined, element: HTMLElement, width: number, height: number) {
        if (!entry) return;

        if (width !== entry.size?.width || height !== entry.size?.height) {
            entry.size = { width, height };
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
        this.elements.set(element, { cb });
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

    checkClientSize(element: HTMLElement, entry: Entry) {
        const width = element.clientWidth ?? 0;
        const height = element.clientHeight ?? 0;
        this.checkSize(entry, element, width, height);
    }
}
