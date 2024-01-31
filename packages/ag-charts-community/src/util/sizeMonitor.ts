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
    private static ownerDocument?: Document;
    private static queuedObserveRequests: [HTMLElement, OnSizeChange][] = [];

    static init(document: Document) {
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

        this.ownerDocument = document;
        this.ready = true;

        this.documentReady = document.readyState !== 'loading';
        if (!this.documentReady) {
            // Add DOMContentLoaded listener, so we can check if the main document is ready again, and
            // if it is then attach any queued requests for resize monitoring.
            //
            // If we attach before ent.readyState !== 'loading', then additional incorrect resize events
            // are fired, leading to multiple re-renderings on chart initial load. Waiting for the
            // document to be loaded irons out this browser quirk.
            document.addEventListener('DOMContentLoaded', this.onContentLoaded);
        }
    }

    static onContentLoaded: EventListener = () => {
        const newState = this.ownerDocument?.readyState !== 'loading';
        const oldState = this.documentReady;
        this.documentReady = newState;
        if (newState && newState !== oldState) {
            this.queuedObserveRequests.forEach(([el, cb]) => this.observe(el, cb));
            this.queuedObserveRequests = [];
        }
    };

    private static destroy() {
        this.ownerDocument?.removeEventListener('DOMContentLoaded', this.onContentLoaded);
        this.resizeObserver?.disconnect();
        delete this.resizeObserver;
        delete this.ownerDocument;
        this.ready = false;
    }

    private static checkSize(entry: Entry | undefined, element: HTMLElement, width: number, height: number) {
        if (!entry) return;

        if (width !== entry.size?.width || height !== entry.size?.height) {
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

        if (this.elements.has(element)) {
            this.removeFromQueue(element);
        } else {
            this.resizeObserver?.observe(element);
        }
        this.elements.set(element, { cb });
    }

    static unobserve(element: HTMLElement) {
        this.resizeObserver?.unobserve(element);
        this.elements.delete(element);
        this.removeFromQueue(element);

        if (!this.elements.size) {
            this.destroy();
        }
    }

    static removeFromQueue(element: HTMLElement) {
        this.queuedObserveRequests = this.queuedObserveRequests.filter(([el]) => el !== element);
    }

    static checkClientSize(element: HTMLElement, entry: Entry) {
        const width = element.clientWidth ?? 0;
        const height = element.clientHeight ?? 0;
        this.checkSize(entry, element, width, height);
    }
}
