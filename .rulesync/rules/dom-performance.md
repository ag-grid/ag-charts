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

Use `DOMWriteCache` (from `ag-charts-community/src/dom/domWriteCache.ts`) to skip redundant DOM writes on hot paths. It centralises the compare-before-write pattern:

-   **`setProperty(style, name, value)`** — for `style.setProperty()` writes (standard and CSS custom properties).
-   **`toggleClass(classList, name, force)`** — for `classList.toggle()` writes.
-   **`setAttr(element, name, value)`** — for `setAttribute()`/`removeAttribute()` writes.
-   **`changed(key, value)`** — escape hatch for writes not covered above (e.g., `innerHTML`). Uses `===`; callers must serialise objects first.
-   **`invalidate(key)`** — force next `changed()` for a key to return true (e.g., after `innerHTML` replaces child elements whose styles were cached).
-   Call **`reset()`** on visibility transitions (e.g., tooltip hide) to ensure a clean slate for the next show cycle. Do NOT reset when position caches should survive hide/show (e.g., crosshair labels).
-   On animation-frame-frequency paths, prefer numeric comparisons via `changed()` over string template literals to avoid GC pressure from short-lived string allocations.
