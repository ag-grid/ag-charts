import { isObject } from '../types/typeGuards';
import type { StrictHTMLElement } from './attributeUtil';

type WindowEventRegistration = {
    listener: EventListener;
    options?: boolean | AddEventListenerOptions;
};

export class AgDocument {
    private container?: HTMLElement;
    private cachedDocument?: Document;
    private cachedWindow?: Window;

    private readonly windowEvents = new Map<string, Set<WindowEventRegistration>>();

    constructor(
        private readonly fallbackDocument: Document,
        private readonly fallbackWindow: Window = fallbackDocument.defaultView!
    ) {}

    destroy(): void {
        this.removeWindowEvents();

        this.container = undefined;
        this.cachedDocument = undefined;
        this.cachedWindow = undefined;

        this.windowEvents.clear();
    }

    get document(): Document {
        return this.cachedDocument ?? this.fallbackDocument;
    }

    get window(): Window {
        return this.cachedWindow ?? this.fallbackWindow;
    }

    getContainer(): HTMLElement | undefined {
        return this.container;
    }

    setContainer(container?: HTMLElement): void {
        this.container = container;
        if (container == null) return;

        const newDoc = container.ownerDocument;
        const newWin = newDoc.defaultView ?? undefined;
        const hasChanged = newDoc !== this.document;

        if (hasChanged) {
            this.removeWindowEvents();
        }

        this.cachedDocument = newDoc;
        this.cachedWindow = newWin;

        if (hasChanged) {
            this.reattachWindowEvents();
        }
    }

    private removeWindowEvents() {
        for (const [type, listeners] of this.windowEvents) {
            for (const { listener, options } of listeners) {
                this.window.removeEventListener(type, listener, options);
            }
        }
    }

    private reattachWindowEvents() {
        for (const [type, listeners] of this.windowEvents) {
            for (const { listener, options } of listeners) {
                this.window.addEventListener(type, listener, options);
            }
        }
    }

    get devicePixelRatio(): number {
        return this.window.devicePixelRatio;
    }

    get innerWidth(): number {
        return this.window.innerWidth;
    }

    get innerHeight(): number {
        return this.window.innerHeight;
    }

    get navigator(): Navigator {
        return this.window.navigator;
    }

    getComputedStyle(el: Element, pseudoElt?: string | null): CSSStyleDeclaration {
        return this.window.getComputedStyle(el, pseudoElt);
    }

    matchMedia(query: string): MediaQueryList | undefined {
        return this.window.matchMedia?.(query);
    }

    getSelection(): Selection | null {
        return this.window.getSelection();
    }

    requestAnimationFrame(callback: FrameRequestCallback): number {
        return this.window.requestAnimationFrame(callback);
    }

    cancelAnimationFrame(handle: number): void {
        this.window.cancelAnimationFrame(handle);
    }

    private shimIdleCallback(callback: IdleRequestCallback, options?: IdleRequestOptions): number {
        return setTimeout(() => callback(null as unknown as IdleDeadline), options?.timeout) as unknown as number;
    }

    requestIdleCallback(callback: IdleRequestCallback, options?: IdleRequestOptions): number {
        return typeof this.window.requestIdleCallback === 'function'
            ? this.window.requestIdleCallback(callback, options)
            : this.shimIdleCallback(callback, options);
    }

    cancelIdleCallback(handle: number): void {
        return typeof this.window.cancelIdleCallback === 'function'
            ? this.window.cancelIdleCallback(handle)
            : clearTimeout(handle);
    }

    /**
     * Attaches a window event listener that's automatically reattached when the
     * active container window changes.
     *
     * @param type Window event name.
     * @param listener Listener to register on the active window.
     * @param options Optional listener options passed to `addEventListener`.
     * @returns Disposer function that removes the listener.
     */
    attachListener<K extends keyof WindowEventMap>(
        type: K,
        listener: (this: Window, ev: WindowEventMap[K]) => any,
        options?: boolean | AddEventListenerOptions
    ): () => void;
    attachListener(type: string, listener: EventListener, options?: boolean | AddEventListenerOptions): () => void;
    attachListener(type: string, listener: EventListener, options?: boolean | AddEventListenerOptions): () => void {
        let typeListeners = this.windowEvents.get(type);
        if (typeListeners == null) {
            typeListeners = new Set();
            this.windowEvents.set(type, typeListeners);
        }

        const cleanup = () => {
            typeListeners?.delete(registration);
            if (typeListeners?.size === 0) {
                this.windowEvents.delete(type);
            }
        };

        const activeListener =
            isObject(options) && options.once
                ? (event: Event) => {
                      cleanup();
                      listener(event);
                  }
                : listener;

        const registration = { listener: activeListener, options };
        typeListeners.add(registration);
        this.window.addEventListener(type, activeListener, options);
        return () => {
            cleanup();
            this.window.removeEventListener(type, activeListener, options);
        };
    }

    get body(): HTMLElement {
        return this.document.body;
    }

    get head(): HTMLHeadElement {
        return this.document.head;
    }

    isReady(): boolean {
        return this.document.readyState === 'complete';
    }

    /**
     * Creates an HTML element and optionally applies a space-separated class list
     * and/or partial inline styles. Supports `createElement(tag, style)` and
     * `createElement(tag, className, style)` overloads.
     *
     * @param tagName HTML tag name to create.
     * @param className Optional space-separated class names, or style object in the two-argument overload.
     * @param style Optional inline style object.
     * @returns The created strongly typed HTML element.
     */
    createElement<K extends keyof HTMLElementTagNameMap>(
        tagName: K,
        className?: string,
        style?: Partial<CSSStyleDeclaration>
    ): HTMLElementTagNameMap[K] & StrictHTMLElement;
    createElement<K extends keyof HTMLElementTagNameMap>(
        tagName: K,
        style?: Partial<CSSStyleDeclaration>
    ): HTMLElementTagNameMap[K] & StrictHTMLElement;
    createElement<K extends keyof HTMLElementTagNameMap>(
        tagName: K,
        className?: string | Partial<CSSStyleDeclaration>,
        style?: Partial<CSSStyleDeclaration>
    ) {
        const element = this.document.createElement<K>(tagName);
        if (typeof className === 'object') {
            style = className;
            className = undefined;
        }
        if (className) {
            for (const name of className.split(' ')) {
                element.classList.add(name);
            }
        }
        if (style) {
            Object.assign(element.style, style);
        }
        return element;
    }

    createSvgElement<K extends keyof SVGElementTagNameMap>(elementName: K): SVGElementTagNameMap[K] {
        return this.document.createElementNS('http://www.w3.org/2000/svg', elementName);
    }

    createResizeObserver(callback: ResizeObserverCallback): ResizeObserver | undefined {
        const Ctor: typeof ResizeObserver | undefined = (this.window as any).ResizeObserver;
        if (Ctor == null) return;
        return new Ctor(callback);
    }

    createIntersectionObserver(
        callback: IntersectionObserverCallback,
        options?: IntersectionObserverInit
    ): IntersectionObserver | undefined {
        const Ctor: typeof IntersectionObserver | undefined = (this.window as any).IntersectionObserver;
        if (Ctor == null) return;
        return new Ctor(callback, options);
    }
}
