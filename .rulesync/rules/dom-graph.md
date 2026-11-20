---
root: false
targets: ['*']
description: 'The DOM graph: core Widgets own the chart DOM (ownership, destroy, focus, accessibility). Rules and review red flags for widget and DOM code'
globs:
    - 'packages/ag-charts-core/src/widget/**'
    - 'packages/ag-charts-core/src/dom/**'
    - 'packages/ag-charts-community/src/dom/**'
    - 'packages/ag-charts-community/src/components/**'
    - 'packages/ag-charts-community/src/chart/interaction/widgetSet.ts'
    - 'packages/ag-charts-enterprise/src/components/**'
    - 'packages/ag-charts-enterprise/src/features/**/*Widget*.ts'
    - 'packages/ag-charts-enterprise/src/features/**/*Toolbar*.ts'
    - 'packages/ag-charts-enterprise/src/features/**/*Menu*.ts'
    - 'packages/ag-charts-enterprise/src/features/**/*Popover*.ts'
    - 'packages/ag-charts-enterprise/src/features/**/*Dialog*.ts'
    - 'packages/ag-charts-enterprise/src/features/**/*Button*.ts'
    - 'packages/ag-charts-enterprise/src/features/axis-interaction/axisInteraction.ts'
    - 'packages/ag-charts-enterprise/src/features/ranges/ranges.ts'
    - 'packages/ag-charts-enterprise/src/features/text-input/**'
    - 'packages/ag-charts-community/src/**/*DOMProxy*.ts'
    - 'packages/ag-charts-enterprise/src/**/*DOMProxy*.ts'
---

# The DOM Graph

The **DOM graph** is the tree of core `Widget`s (`packages/ag-charts-core/src/widget/`) that owns the chart's DOM UI: toolbars, menus, popovers, dialogs, proxy buttons. It is to DOM rendering what the scene graph is to canvas rendering. It is not the browser's DOM tree: ownership is the widget tree (`parent`, `children`), and an element can sit somewhere in the DOM other than under its owner.

This is a living document. It describes a transition, so whoever changes what it describes (Phase 3 lands, widgets gain batching, a known gap closes, a new widget area appears) updates it in the same change.

## Direction

-   Code outside `widget/` talks to Widgets, never to their elements.
-   `DOMManager` owns a single root Widget, so the whole chart DOM is one graph (Phase 3). Today it owns the root containers as raw elements (`getParent()`, `addChild()`), hence the `DOMManagerWidget`/`NativeWidget` fallbacks.
-   Widget DOM writes get scene-graph-style batching. Today setters write immediately, with no compare-before-write; the caching and deferred-write layer is `DOMElementProxy` (`.rulesync/rules/dom-performance.md`), outside the widget tree.

**Please help steer.** When your change touches code next to a known gap or an escape, and one step toward the direction is small and safe (adding a missing widget event, swapping a raw write for an existing setter, deleting an exemption that is no longer needed), please take it in the same change. If it is not small, do not skip it silently: say in your PR description or hand-off what you saw and why you left it, so the next agent can pick it up. Reviewers, ask the same question of every change: did it leave a nearby escape that was cheap to fix?

## Ownership (Rust-like)

-   **Widgets own their children and their listeners, unless documented otherwise.** `destroy()` runs `destructor()`, detaches the element, destroys the children and releases `addListener()` listeners.
-   **Adding a child links it in the widget tree and the DOM**, except under a `DOMManagerWidget`, whose `addChild()` leaves the DOM to `DOMManager` (see Known gaps).
-   **One owner.** `addChild()` does not unlink a child from a previous parent, which would still destroy it. To move a child, `remove()` it (detaches without destroying), then `addChild()` it elsewhere.
-   **Borrowing is the exception, and it is explicit:** the borrowing site says so in its JSDoc, and lets go with `remove()`, not `destroy()`.
-   **`destroy()` releases only what the widget knows about.** Window or document listeners, observers and timers are released in the subclass `destructor()`. An expanded widget left undestroyed (e.g. in a test) keeps its global listeners.
-   **Modules own their roots.** Register the root widget's `destroy()`, and `domManager.removeChild()` for any container requested from DOMManager, with the module's `cleanup`.

## Expandables and focus

An expandable widget owns what it expands (submenus, popovers, dialogs) and is responsible for winding and unwinding focus. Conceptually the DOM graph keeps a focus history: each open expandable remembers what opened it. Opening winds focus into the expanded widget; closing it (e.g. Escape) unwinds and returns focus to whatever opened it, much like a browser's Back button. See `MenuWidget` and `CollapseMode` for an example.

## Widgets do the heavy lifting

Put behaviour in a core widget (a method or subclass), not in the feature using it: roles and `aria-*` (`setAriaRole()`, `setAriaExpanded()`, …), roving tab index and arrow keys (e.g. `RovingTabContainerWidget`), hide hooks (e.g. `Popover.onHide()`) rather than collected hide callbacks, widget events via `addListener()` (their `canvasX`/`canvasY` are `NaN` unless the widget or an ancestor has a canvas origin, see `setCanvasOrigin()`), and narrow semantic setters (`setCssOffset()`, `setCSSVariable()`, `toggleClass()`, …) rather than raw `style` or `setAttribute()`.

## Rules

1.  **Do not reach through `getElement()`** outside `widget/`. Use or add a Widget method.
2.  **Lint:** `aglint/widget-boundary` reports every `getElement` reference outside `src/widget/**` and tests in core, community and enterprise. An unavoidable escape takes `// eslint-disable-next-line aglint/widget-boundary -- <reason>`, one site each; a missing reason, a block or file-wide disable, or a directive that no longer suppresses anything fails lint.
3.  **`NativeWidget` and `DOMManagerWidget` are last-resort fallbacks.** Prefer an existing subclass (`ContainerWidget`, `IconWidget`, `ButtonWidget`, …). Each `new` or `extends` of a fallback needs `// TODO: Phase 3 "Common Widget Ancestor" - <why>` directly before the statement or class: no ticket key, and do not copy the older `AG−18361` form.
4.  **Keep this file's `globs` current.** They attach this rule by path, so widget or DOM code outside them (say, a widget under `src/series/`) never sees it. If you add such code, extend the `globs` in the same change; reviewers, check for it.

## Review red flags

-   A new `aglint/widget-boundary` exemption, especially one whose reason is a missing Widget method.
-   `addEventListener()`/`attachListener()` on a widget's element, or a global listener not released in `destructor()`.
-   Focus moved by hand (`.focus()` on stored elements, `document.activeElement` checks) instead of through the expandable that owns it.
-   A widget with no owner, a child added to a second parent without `remove()`, or `destroy()` on a borrowed widget.
-   `role`, `aria-*` or `style` written on a raw element, or a new fallback without the Phase 3 TODO.
-   A nearby escape left in place that was cheap to fix, with no note saying why.

## Known gaps: low-hanging fruit

Not patterns to copy. Each is a candidate for the small step asked for above; remove an entry when it is fixed.

-   `annotationOptionsToolbar.ts` attaches a raw `pointerdown` listener because widget events have no `pointerdown`. Fix: add the event.
-   `zoomToolbar.ts` writes `style.transform`, `transitionDuration` and an inline `height` "fast path" cache directly. Fix: setters.
-   DOMManager hands out raw containers, so `DOMManagerWidget.addChild()` does not attach to the DOM (`axisButton.ts`). Phase 3.
-   `MenuWidget.addSubMenu()` returns a submenu that no widget owns.
