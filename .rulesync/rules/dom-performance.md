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

## Skip Redundant DOM Writes with `DOMWriteCache`

Use `DOMWriteCache` (from `ag-charts-community/src/dom/domWriteCache.ts`) as the **single handle** for all DOM interaction on an element. The underlying `element` is **private** — consumers interact exclusively through the cache's API surface.

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
-   **`togglePopover(force)`** — delegates to `element.togglePopover()`. Not cached (side effects beyond attribute state).
-   **`changed(key, value)`** — escape hatch for writes not covered above. Uses `===`; callers must serialise objects first.
-   **`invalidate(key)`** — force next `changed()` for a key to return true.
-   Call **`reset()`** on visibility transitions (e.g., tooltip hide) to ensure a clean slate for the next show cycle. Do NOT reset when position caches should survive hide/show (e.g., crosshair labels).
-   On animation-frame-frequency paths, prefer numeric comparisons via `changed()` over string template literals to avoid GC pressure from short-lived string allocations.
