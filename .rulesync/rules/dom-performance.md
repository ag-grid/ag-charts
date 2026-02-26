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

## Skip Redundant DOM Writes

-   Track previous state for DOM writes (`classList.toggle`, `style.setProperty`, `setAttribute`) and skip when inputs haven't changed.
-   Reset tracked state on visibility transitions (e.g., tooltip hide) to ensure a clean slate for the next show cycle.
-   On animation-frame-frequency paths, prefer numeric comparisons over string template literals to avoid GC pressure from short-lived string allocations.
