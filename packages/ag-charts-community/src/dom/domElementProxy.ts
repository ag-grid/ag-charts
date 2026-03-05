import type { Size, SizeMonitor } from '../util/sizeMonitor';

type StyleProperty =
    | '--left'
    | '--top'
    | 'height'
    | 'left'
    | 'pointer-events'
    | 'position-anchor'
    | 'top'
    | 'translate'
    | 'width';

type HtmlAttribute =
    | 'aria-atomic'
    | 'aria-hidden'
    | 'aria-live'
    | 'data-axis-id'
    | 'data-key'
    | 'popover'
    | 'role'
    | 'tabindex';

type CacheKey =
    | 'innerHTML'
    | 'contentStyles'
    | 'popover'
    | `p:${StyleProperty}`
    | `c:${string}`
    | `a:${HtmlAttribute}`
    | `d:${string}`;

export type DeferredMode = { scheduleFlush: () => void };

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
 *
 * ## Flush behaviour (deferred mode)
 *
 * When created with `{ deferredMode }`, all write operations (`setProperty`,
 * `toggleClass`, `setAttr`, `setInnerHTML`, `setContentStyles`) are buffered in
 * a `pendingWrites` Map and `deferredMode.scheduleFlush()` is called to request
 * an async flush via `DOMManager`.
 *
 * - **Automatic flush**: `DOMManager.setDeferring(false)` schedules a
 *   `setTimeout(0)` that calls `flush()` on all deferred proxies at the end of
 *   each render cycle.
 * - **Manual flush**: `flush()` and `flushKey()` remain available for callers
 *   that need explicit control.
 */
export class DOMElementProxy {
    private cache: Partial<Record<CacheKey, unknown>> = {};
    private readonly pendingWrites = new Map<CacheKey, () => void>();
    private readonly deferredMode: DeferredMode | undefined;
    private readonly sizeMonitor: SizeMonitor | undefined;

    constructor(
        private readonly element: HTMLElement,
        opts?: { deferredMode?: DeferredMode; sizeMonitor?: SizeMonitor }
    ) {
        this.deferredMode = opts?.deferredMode;
        this.sizeMonitor = opts?.sizeMonitor;
    }

    /** Delegates to `element.isConnected`. */
    get isConnected(): boolean {
        return this.element.isConnected;
    }

    private scheduleFlush(): void {
        if (this.deferredMode) {
            this.deferredMode.scheduleFlush();
        } else {
            this.flush();
        }
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

    /** Reads innerHTML — returns cached value when in a deferred-capable proxy since DOM may not have flushed yet. */
    get innerHTML(): string {
        if (this.pendingWrites) {
            return (this.cache['innerHTML'] as string) ?? '';
        }
        return this.element.innerHTML;
    }

    /** Returns true if value differs from cached (uses ===). Updates cache.
     *  Callers comparing objects must serialise first (e.g. JSON.stringify). */
    changed(key: CacheKey, value: unknown): boolean {
        if (this.cache[key] === value) return false;
        this.cache[key] = value;
        return true;
    }

    /** Remove a key, forcing next changed() to return true. */
    invalidate(key: CacheKey): void {
        delete this.cache[key];
    }

    /** style.setProperty(name, value), skipped if unchanged.
     *  Works for both standard properties and CSS custom properties. */
    setProperty(name: StyleProperty, value: string): void {
        const cacheKey: CacheKey = `p:${name}`;
        if (this.changed(cacheKey, value)) {
            this.pendingWrites.set(cacheKey, () => {
                this.element.style.setProperty(name, value);
            });
            this.scheduleFlush();
        }
    }

    /** classList.toggle(name, force), skipped if unchanged. */
    toggleClass(name: string, force: boolean): void {
        const cacheKey: CacheKey = `c:${name}`;
        if (this.changed(cacheKey, force)) {
            this.pendingWrites.set(cacheKey, () => {
                this.element.classList.toggle(name, force);
            });
            this.scheduleFlush();
        }
    }

    /** setAttribute (value != null) or removeAttribute (value == null). */
    setAttr(name: HtmlAttribute, value: string | null): void {
        const cacheKey: CacheKey = `a:${name}`;
        if (this.changed(cacheKey, value)) {
            this.pendingWrites.set(cacheKey, () => {
                if (value == null) {
                    this.element.removeAttribute(name);
                } else {
                    this.element.setAttribute(name, value);
                }
            });
            this.scheduleFlush();
        }
    }

    /** element.dataset[name] = value, skipped if unchanged. */
    setData(name: string, value: string): void {
        const cacheKey: CacheKey = `d:${name}`;
        if (this.changed(cacheKey, value)) {
            this.pendingWrites.set(cacheKey, () => {
                this.element.dataset[name] = value;
            });
            this.scheduleFlush();
        }
    }

    /** Returns the cached data attribute value (deferred-capable proxy) or reads from the element. */
    getData(name: string): string | undefined {
        const cacheKey: CacheKey = `d:${name}`;
        if (this.pendingWrites) {
            return this.cache[cacheKey] as string | undefined;
        }
        return this.element.dataset[name];
    }

    /** Cached innerHTML write. Returns true if the write happened. */
    setInnerHTML(html: string): boolean {
        if (this.changed('innerHTML', html)) {
            this.pendingWrites.set('innerHTML', () => {
                this.element.innerHTML = html;
            });
            this.scheduleFlush();
            this.invalidate('contentStyles');
            return true;
        }
        return false;
    }

    /** Apply styles to the first child element, or the element itself if no children.
     *  Skipped if styles haven't changed (compared via JSON.stringify). */
    setContentStyles(styles: Record<string, string | number | undefined>): void {
        if (this.changed('contentStyles', JSON.stringify(styles))) {
            const apply = () => {
                const target = (this.element.firstElementChild ?? this.element) as HTMLElement;
                Object.assign(target.style, styles);
            };
            this.pendingWrites.set('contentStyles', apply);
            this.scheduleFlush();
        }
    }

    /** Flush all pending deferred writes. No-op if not in deferred mode. */
    flush(): void {
        if (this.pendingWrites) {
            for (const fn of this.pendingWrites.values()) fn();
            this.pendingWrites.clear();
        }
    }

    /** Flush a single pending write by key. */
    flushKey(key: CacheKey): void {
        const fn = this.pendingWrites.get(key);
        if (fn) {
            fn();
            this.pendingWrites.delete(key);
        }
    }

    /**
     * Delegates to element.togglePopover(force).
     *
     * In deferred mode, show (force=true) is buffered so that innerHTML is flushed first —
     * Map insertion order guarantees setInnerHTML() runs before togglePopover(true) since
     * show() always writes content before calling toggle(). Hide (force=false) executes
     * immediately and cancels any pending show to avoid the element briefly appearing.
     */
    togglePopover(force: boolean): void {
        if (force) {
            if (this.changed('popover', true)) {
                this.pendingWrites.set('popover', () => {
                    this.element.togglePopover(true);
                });
                this.scheduleFlush();
            }
        } else {
            // Cancel any pending show and hide immediately — no render cycle needed.
            this.pendingWrites.delete('popover');
            if (this.changed('popover', false)) {
                this.element.togglePopover(false);
            }
        }
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

    /** Observe the element for resize events via the shared SizeMonitor. Returns an unsubscribe function. */
    addResizeListener(cb: (size: Size) => void): () => void {
        const { sizeMonitor, element } = this;
        if (sizeMonitor == null) {
            throw new Error('AG Charts - addResizeListener requires a SizeMonitor');
        }
        sizeMonitor.observe(element, (size) => cb(size));
        return () => sizeMonitor.unobserve(element);
    }

    /** Clear all cached values. Call on hide/destroy transitions. */
    reset(): void {
        this.cache = {};
    }
}
