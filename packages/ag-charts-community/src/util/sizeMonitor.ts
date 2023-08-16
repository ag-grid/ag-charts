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
    private static elements = new Map<HTMLElement, Entry>();
    private static resizeObserver: any;
    private static ready = false;
    private static documentReady = false;
    private static readyEventFn?: EventListener;
    private static queuedObserveRequests: [HTMLElement, OnSizeChange][] = [];

    private static pollerHandler?: number;

    static init(document: Document) {
        if (typeof ResizeObserver !== 'undefined') {
            this.resizeObserver = new ResizeObserver((entries: any) => {
                for (const entry of entries) {
                    const { width, height } = entry.contentRect;
                    this.checkSize(this.elements.get(entry.target), entry.target, width, height);
                }
            });
        } else {
            // polyfill (more reliable even in browsers that support ResizeObserver)
            const step = () => {
                this.elements.forEach((entry, element) => {
                    this.checkClientSize(element, entry);
                });
            };
            this.pollerHandler = window.setInterval(step, 100);
        }

        this.ready = true;

        this.documentReady = document.readyState !== 'loading';
        if (!this.documentReady) {
            this.readyEventFn = () => {
                const newState = document.readyState !== 'loading';
                const oldState = this.documentReady;
                this.documentReady = newState;
                if (newState !== oldState && newState) {
                    for (const [el, cb] of this.queuedObserveRequests) {
                        this.observe(el, cb);
                    }
                    this.queuedObserveRequests.length = 0;
                }
            };
            document.addEventListener('DOMContentLoaded', this.readyEventFn);
        }
    }

    private static destroy() {
        if (this.pollerHandler != null) {
            clearInterval(this.pollerHandler);
            this.pollerHandler = undefined;
        }
        if (this.readyEventFn) {
            document.removeEventListener('DOMContentLoaded', this.readyEventFn);
            this.readyEventFn = undefined;
        }
        this.resizeObserver?.disconnect();
        this.resizeObserver = undefined;
        this.ready = false;
    }

    private static checkSize(entry: Entry | undefined, element: HTMLElement, width: number, height: number) {
        if (!entry) return;

        if (!entry.size || width !== entry.size.width || height !== entry.size.height) {
            entry.size = { width, height };
            entry.cb(entry.size, element);
        }
    }

    // Only a single callback is supported.
    static observe(element: HTMLElement, cb: OnSizeChange) {
        if (!this.ready) {
            this.init(element.ownerDocument);
        }
        if (!this.documentReady) {
            this.queuedObserveRequests.push([element, cb]);
            return;
        }

        this.unobserve(element, false);
        if (this.resizeObserver) {
            this.resizeObserver.observe(element);
        }

        this.elements.set(element, { cb });

        // Ensure first size callback happens synchronously.
        this.checkClientSize(element, { cb });
    }

    static unobserve(element: HTMLElement, cleanup = true) {
        if (this.resizeObserver) {
            this.resizeObserver.unobserve(element);
        }
        this.elements.delete(element);

        this.queuedObserveRequests = this.queuedObserveRequests.filter(([el]) => el === element);

        if (cleanup && this.elements.size === 0) {
            this.destroy();
        }
    }

    static checkClientSize(element: HTMLElement, entry: Entry) {
        const width = element.clientWidth ? element.clientWidth : 0;
        const height = element.clientHeight ? element.clientHeight : 0;
        this.checkSize(entry, element, width, height);
    }
}
