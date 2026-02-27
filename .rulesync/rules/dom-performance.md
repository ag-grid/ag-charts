---
root: false
targets: ['*']
description: 'DOM performance patterns for AG Charts — caching, invalidation, and avoiding forced relayouts'
globs: ['packages/*/src/dom/**', 'packages/*/src/chart/tooltip/**']
---

# DOM Performance Guide

This guide covers patterns for avoiding expensive DOM operations on hot paths (e.g., tooltip hover, animation frames).

## Cache DOM Queries on Hot Paths

-   Cache results of `getBoundingClientRect()`, `computedStyleMap()` DOM walks, and similar layout-triggering queries.
-   Use a three-state caching pattern: `undefined` = not yet computed, `null` = computed but no result found, value = cached result.
-   Invalidate caches via passive global event listeners: window `scroll` (capture phase), window `resize`, document `fullscreenchange`, and container resize (SizeMonitor).
-   Always read window dimensions (`innerWidth`/`innerHeight`) live rather than caching them, since they are cheap to read and change on resize.
-   Clean up global listeners in `destroy()` to prevent memory leaks.

## Skip Redundant DOM Writes with `DOMElementProxy`

Use `DOMElementProxy` (from `ag-charts-community/src/dom/domElementProxy.ts`) as the **single handle** for all DOM interaction on an element. The underlying `element` is **private** — consumers interact exclusively through the cache's API surface.

-   **`constructor(element: HTMLElement)`** — binds the cache to a single element.
-   **`isConnected`** — getter delegating to `element.isConnected`.
-   **`contains(node)`** — delegates to `element.contains()`.
-   **`addEventListener(type, listener, options)`** / **`removeEventListener(type, listener, options)`** — typed delegates for event subscriptions on the underlying element.
-   **`setProperty(name, value)`** — for `element.style.setProperty()` writes (standard and CSS custom properties).
-   **`toggleClass(name, force)`** — for `element.classList.toggle()` writes.
-   **`setAttr(name, value)`** — for `element.setAttribute()`/`removeAttribute()` writes. Pass `null` to remove.
-   **`setInnerHTML(html): boolean`** — cached `innerHTML` write. Returns `true` if the write happened. Auto-invalidates `contentStyles` so that the next `setContentStyles` call re-applies styles to the new child elements.
-   **`setContentStyles(styles)`** — cached style assignment to the first child element (or the container itself if no children). Compared via `JSON.stringify`; skipped if unchanged. Auto-invalidated by `setInnerHTML` — callers no longer need manual `invalidate()` calls.
-   **`innerHTML`** — getter reading from DOM. Use for read-side checks (e.g., `dom.innerHTML === ''`).
-   **`appendChild(child)`** — delegates to `element.appendChild()`. No caching — structural mutation.
-   **`set innerText(text)`** — delegates to setting `element.innerText`. Invalidates the `innerHTML` cache key since setting innerText changes DOM content.
-   **`togglePopover(force)`** — delegates to `element.togglePopover()`. Not cached (side effects beyond attribute state).
-   **`changed(key, value)`** — escape hatch for writes not covered above. Uses `===`; callers must serialise objects first.
-   **`invalidate(key)`** — force next `changed()` for a key to return true.
-   Call **`reset()`** on visibility transitions (e.g., tooltip hide) to ensure a clean slate for the next show cycle. Do NOT reset when position caches should survive hide/show (e.g., crosshair labels).
-   On animation-frame-frequency paths, prefer numeric comparisons via `changed()` over string template literals to avoid GC pressure from short-lived string allocations.
-   **Full wrapping constraint**: When introducing DOMElementProxy for an element, ALL accesses must go through the cache. Mixed access patterns (some through cache, some direct) risk cache/DOM desync and are confusing for maintainers. When full wrapping is impractical (e.g. the element reference is shared with external code like `GuardedElement`), use a simple field-level compare-before-write pattern (e.g. `_lastCursor`, `_lastCenterSize`) instead of DOMElementProxy.

## Create Proxies via DOMManager Factory Methods

Never construct `DOMElementProxy` directly outside of `DOMManager`. Use the factory methods instead:

-   **`addProxyChild(domElementClass, id)`** — creates an immediate-mode proxy with the shared `SizeMonitor` injected.
-   **`addDeferredProxyChild(domElementClass, id)`** — creates a deferred proxy that buffers DOM writes until `postRenderUpdate()`. Also injects the shared `SizeMonitor`.
-   These factories ensure proxies share the `DOMManager`'s `SizeMonitor` instance, avoiding redundant `ResizeObserver` registrations.
-   When a proxy consumer needs resize observation, call **`proxy.addResizeListener(cb)`** which returns an unsubscribe function. Never bypass the proxy to obtain the raw element for a separate `SizeMonitor`.
-   Use deferred mode for elements whose writes happen during the render cycle (tooltip, crosshair labels) to batch DOM mutations and avoid interleaving reads/writes.
