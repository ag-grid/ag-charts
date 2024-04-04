import { getDocument, getWindow } from '../../util/dom';

type ResizeObserverCallback = (rect: DOMRect) => void;

export class SizeObserver {
    private readonly elements = new Map<Element, ResizeObserverCallback>();
    private readonly observer?: ResizeObserver;

    // Indicates whether observations should be temporarily halted.
    private halt: boolean = false;

    constructor() {
        // Guards against environments where `ResizeObserver` is not available.
        if (typeof ResizeObserver === 'undefined') return;

        this.observer = new ResizeObserver((entries) => {
            // Invoke callbacks with updated sizes for observed elements.
            for (const { target, contentRect } of entries) {
                this.elements.get(target)?.(contentRect);
            }
        });

        // Delays observation start until the document is fully loaded, avoiding premature triggers.
        // This is crucial for accurate initial measurements and consistency across browsers.
        if (getDocument('readyState') !== 'complete') {
            this.halt = true;
            getWindow()?.addEventListener('load', () => {
                this.halt = false;
                for (const [element, callback] of this.elements) {
                    this.observer?.observe(element);
                    callback(element.getBoundingClientRect());
                }
            });
        }
    }

    /**
     * Starts observing an element for size changes.
     * @param element The element to observe.
     * @param callback Invoked on size changes or immediately if specified.
     * @param immediate If true, invokes callback with current size immediately.
     */
    observe(element: Element, callback: ResizeObserverCallback, immediate = true) {
        if (this.elements.has(element)) return;
        this.elements.set(element, callback);
        if (!this.halt) {
            this.observer?.observe(element);
            if (immediate) {
                callback(element.getBoundingClientRect());
            }
        }
    }

    /**
     * Stops observing an element.
     * @param element The element to stop observing.
     */
    unobserve(element: Element) {
        if (this.elements.has(element)) {
            this.elements.delete(element);
            this.observer?.unobserve(element);
        }
    }

    /**
     * Stops all observations and clears listeners.
     */
    disconnect() {
        this.observer?.disconnect();
        this.elements.clear();
    }
}
