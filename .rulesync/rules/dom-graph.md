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
---

# The DOM Graph

The **DOM graph** is the tree of core `Widget`s (`packages/ag-charts-core/src/widget/`) that owns the chart's DOM UI: toolbars, menus, popovers, dialogs, proxy buttons. It is to DOM rendering what the scene graph is to canvas rendering. It is not the browser's DOM tree: ownership is the widget tree (`parent`, `children`), and an element can sit somewhere in the DOM other than under its owner (`insertSiblingAfter()` moves only the element).

`DOMManager` (`ag-charts-community/src/dom/domManager.ts`) still owns the root containers (`canvas-overlay`, `series-area`, …) as raw elements, handed out by `getParent()` and `addChild()`. Widgets are mounted on them through a host element (`PopoverWidget`, `ContextMenuContainerWidget`) or the `DOMManagerWidget`/`NativeWidget` fallbacks. Phase 3 direction: DOMManager owns one root Widget, so the whole chart DOM becomes one graph.

## Ownership (Rust-like)

-   **A parent owns its children.** `addChild()`/`prependChild()` link the child in the widget tree and the DOM. `destroy()` runs `destructor()`, detaches the element and unlinks it from its parent, destroys every child, then releases the listeners added through `addListener()`.
-   **One owner.** `addChild()` does not unlink a child from a previous parent, which would still destroy it. To move a child, `remove()` it (detaches without destroying), then `addChild()` it elsewhere.
-   **Borrowing is explicit and documented.** `PopoverWidget.showPanel()` takes ownership of the panel and destroys the previous one; `showChildren()` only borrows its children, so `removePanel()` calls `remove()` on them, not `destroy()`; attached child popovers are detached, not destroyed. Any widget that borrows documents who owns what in its JSDoc, as `PopoverWidget` does.
-   **Out-of-tree widgets belong to the caller.** `MenuWidget.addSubMenu()` returns a `subMenu` that is not a child of the menu.
-   **`destroy()` releases only what the widget knows about.** Window or document listeners, observers and timers must be released in the subclass `destructor()`. Example: `MenuWidget.expand()` adds window `mousedown`/`touchstart` listeners for outside-press dismissal; only `collapse()` removes them, and `destructor()` calls it with `CollapseMode.DESTROY`. A menu left expanded and never destroyed (e.g. in a test) reacts to every later press on the window.
-   **Modules own their roots.** Register the root widget's `destroy()`, and `domManager.removeChild()` for any container requested from DOMManager, with the module's `cleanup` (see the `Popover` constructor).

## Widgets do the heavy lifting

Put behaviour in a core widget (a method or subclass), not in the feature using it:

-   **Accessibility:** `setAriaRole()`, `setAriaLabel()`, `setAriaExpanded()`, …; `RovingTabContainerWidget` sets the container role and `aria-orientation`.
-   **Focus and keyboard:** roving tab index and arrow keys (`RovingTabContainerWidget`); expand and collapse with focus unwinding (`MenuWidget`, `CollapseMode`: only `CLOSE` returns focus to the `Opener`); popover focus via `PopoverWidget.setFocusOnOpen()`, `focusInitial()`, `restoreFocus()`. `Opener` keeps the opening element inside `widget/`.
-   **Show/hide lifecycle:** `Popover.hide()` removes the panel, calls the protected `onHide()` hook, then the per-show `onHide` option. Override `onHide()` rather than collecting hide callbacks.
-   **Events:** `addListener()` with widget events, which carry canvas-relative coordinates; not `addEventListener()` on the element.
-   **DOM writes:** narrow semantic setters (`setCssOffset()`, `setTranslate()`, `setMinWidth()`, `setCSSVariable()`, `setData()`, `toggleClass()`, …), not raw `style` or `setAttribute()`.

**Performance today:** widget setters write to the DOM immediately, with no compare-before-write or batching. The caching and deferred-write layer is `DOMElementProxy` (`.rulesync/rules/dom-performance.md`), outside the widget tree. Scene-graph-style batching for widgets is a direction, not a feature.

## Rules

1.  **Do not reach through `getElement()`** outside `widget/`. Use or add a Widget method.
2.  **Lint:** `aglint/widget-boundary` reports every `getElement` reference in `src/**/*.ts` of core, community and enterprise, except `src/widget/**` and tests. An unavoidable escape takes `// eslint-disable-next-line aglint/widget-boundary -- <reason>`; `aglint/widget-boundary-directives` rejects a missing reason and block or file-wide disables, and a directive that no longer suppresses anything fails lint.
3.  **`NativeWidget` and `DOMManagerWidget` are last-resort fallbacks.** Prefer an existing subclass (`ContainerWidget`, `IconWidget`, `ButtonWidget`, …). Each `new` or `extends` of a fallback needs `// TODO: Phase 3 "Common Widget Ancestor" - <why>` directly before the statement or class: no ticket key, and do not copy the older `AG−18361` form.

## Review red flags

-   A new `aglint/widget-boundary` exemption, especially one whose reason is a missing Widget method.
-   `addEventListener()`/`attachListener()` on a widget's element, or a global listener not released in `destructor()`.
-   Focus moved by hand (`.focus()` on stored elements, `document.activeElement` checks) instead of `Opener`, `CollapseMode` or `PopoverWidget`.
-   A widget with no owner: never added as a child, nor destroyed by a `destructor()` or module `cleanup`. Or a child added to a second parent without `remove()`.
-   `destroy()` on a borrowed widget.
-   `role`, `aria-*` or `style` written on a raw element.
-   A new fallback without the Phase 3 TODO.

## Known gaps (not patterns to copy)

-   `annotationOptionsToolbar.ts` attaches a raw `pointerdown` listener: widget events have no `pointerdown`. Add the event rather than another escape.
-   `zoomToolbar.ts` writes `style.transform`, `transitionDuration` and an inline `height` "fast path" cache directly; it needs setters.
-   DOMManager hands out raw containers, so `DOMManagerWidget.addChild()` does not attach to the DOM (`axisButton.ts`). Phase 3.
