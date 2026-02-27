/**
 * Centralises the compare-before-write pattern for DOM mutations on hot paths.
 *
 * Each instance maintains a flat key→value cache. Helper methods skip the
 * corresponding DOM write when the value has not changed since the last call.
 */
export class DOMWriteCache {
    private cache: Record<string, unknown> = {};

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
    setProperty(style: CSSStyleDeclaration, name: string, value: string): void {
        if (this.changed(`p:${name}`, value)) {
            style.setProperty(name, value);
        }
    }

    /** classList.toggle(name, force), skipped if unchanged. */
    toggleClass(classList: DOMTokenList, name: string, force: boolean): void {
        if (this.changed(`c:${name}`, force)) {
            classList.toggle(name, force);
        }
    }

    /** setAttribute (value != null) or removeAttribute (value == null). */
    setAttr(element: Element, name: string, value: string | null): void {
        if (this.changed(`a:${name}`, value)) {
            if (value == null) {
                element.removeAttribute(name);
            } else {
                element.setAttribute(name, value);
            }
        }
    }

    /** Clear all cached values. Call on hide/destroy transitions. */
    reset(): void {
        this.cache = {};
    }
}
