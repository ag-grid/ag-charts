/**
 * Proxies all DOM access to a single HTMLElement.
 *
 * - Compare-before-write optimisation for hot paths (style properties, classes,
 *   attributes, innerHTML): a flat key→value cache with `===` comparison skips
 *   redundant writes. Callers must serialise objects before comparison.
 * - Cache lifecycle: `invalidate()` clears a single key; `reset()` clears all
 *   cached values on hide/destroy transitions.
 * - Delegated operations (events, structural mutations) pass through to the
 *   underlying element without caching.
 */
export class DOMElementProxy {
    private cache: Record<string, unknown> = {};

    constructor(private readonly element: HTMLElement) {}

    /** Delegates to `element.isConnected`. */
    get isConnected(): boolean {
        return this.element.isConnected;
    }

    /** Delegates to `element.contains()`. */
    contains(node: Node | null): boolean {
        return this.element.contains(node);
    }

    /** Delegates to `element.addEventListener()`. */
    addEventListener<K extends keyof HTMLElementEventMap>(
        type: K,
        listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
        options?: boolean | AddEventListenerOptions
    ): void {
        this.element.addEventListener(type, listener, options);
    }

    /** Delegates to `element.removeEventListener()`. */
    removeEventListener<K extends keyof HTMLElementEventMap>(
        type: K,
        listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
        options?: boolean | EventListenerOptions
    ): void {
        this.element.removeEventListener(type, listener, options);
    }

    /** Reads innerHTML from DOM. */
    get innerHTML(): string {
        return this.element.innerHTML;
    }

    /** Returns true if value differs from cached (uses ===). Updates cache.
     *  Callers comparing objects must serialise first (e.g. JSON.stringify). */
    changed(key: string, value: unknown): boolean {
        if (this.cache[key] === value) return false;
        this.cache[key] = value;
        return true;
    }

    /** Remove a key, forcing next changed() to return true. */
    invalidate(key: string): void {
        delete this.cache[key];
    }

    /** style.setProperty(name, value), skipped if unchanged.
     *  Works for both standard properties and CSS custom properties. */
    setProperty(name: string, value: string): void {
        if (this.changed(`p:${name}`, value)) {
            this.element.style.setProperty(name, value);
        }
    }

    /** classList.toggle(name, force), skipped if unchanged. */
    toggleClass(name: string, force: boolean): void {
        if (this.changed(`c:${name}`, force)) {
            this.element.classList.toggle(name, force);
        }
    }

    /** setAttribute (value != null) or removeAttribute (value == null). */
    setAttr(name: string, value: string | null): void {
        if (this.changed(`a:${name}`, value)) {
            if (value == null) {
                this.element.removeAttribute(name);
            } else {
                this.element.setAttribute(name, value);
            }
        }
    }

    /** Cached innerHTML write. Returns true if the write happened. */
    setInnerHTML(html: string): boolean {
        if (this.changed('innerHTML', html)) {
            this.element.innerHTML = html;
            this.invalidate('contentStyles');
            return true;
        }
        return false;
    }

    /** Apply styles to the first child element, or the element itself if no children.
     *  Skipped if styles haven't changed (compared via JSON.stringify). */
    setContentStyles(styles: Record<string, string | number | undefined>): void {
        if (this.changed('contentStyles', JSON.stringify(styles))) {
            const target = (this.element.firstElementChild ?? this.element) as HTMLElement;
            Object.assign(target.style, styles);
        }
    }

    /** Delegates to element.togglePopover(force). No caching (side effects beyond attribute state). */
    togglePopover(force: boolean): void {
        this.element.togglePopover(force);
    }

    /** Delegates to element.appendChild(). No caching — structural mutation. */
    appendChild(child: Node): void {
        this.element.appendChild(child);
    }

    /** Delegates to setting element.innerText. Invalidates innerHTML cache. */
    set innerText(text: string) {
        this.element.innerText = text;
        this.invalidate('innerHTML');
    }

    /** Clear all cached values. Call on hide/destroy transitions. */
    reset(): void {
        this.cache = {};
    }
}
