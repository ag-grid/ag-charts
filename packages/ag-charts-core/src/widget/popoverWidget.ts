import { getDocument } from '../dom/globalsProxy';
import { ContainerWidget } from './containerWidget';
import { Opener } from './opener';
import { Widget } from './widget';

export interface PopoverPanelOptions {
    ariaLabel?: string;
    class?: string;
    minWidth?: number;
}

/**
 * The root of a popover: a presentational `<div>` that shows one panel at a time, with any child popovers attached to
 * it stacked above that panel.
 */
export class PopoverWidget extends Widget<HTMLElement> {
    private attached: boolean;
    private panel?: Widget;
    // Only set while `panel` was made by `showChildren()`; the container is then ours to destroy.
    private container?: ContainerWidget;
    private readonly borrowedChildren: Widget[] = [];
    private opener?: Opener;
    private initialFocus?: Widget;

    /**
     * @param hostElement - Optional: an element that its host has already put in the DOM, to use as the root. Without
     * it, the root is a new `<div>` that must be attached with `attachTo()` before a panel can be shown.
     */
    constructor(hostElement?: HTMLElement) {
        super(hostElement ?? getDocument().createElement('div'));
        this.attached = hostElement != null;
        this.setAriaRole('presentation');
    }

    /** Attaches this root to `parent`, above the parent's panel. Does nothing if this root is already attached. */
    attachTo(parent: PopoverWidget) {
        if (this.attached) return;
        // Stack after the parent's panel (`domIndex` 0), so this popover is painted above it.
        this.domIndex = 1;
        parent.addChild(this);
        this.attached = true;
    }

    getPanel(): Widget | undefined {
        return this.panel;
    }

    /**
     * Shows `panel`, replacing the current one. The previous panel is forgotten as `removePanel()` describes, but a
     * panel that was not made by `showChildren()` stays in the DOM until its owner destroys it.
     */
    showPanel(panel: Widget, options: PopoverPanelOptions) {
        if (!this.attached) {
            throw new Error('Can not show popover that has not been attached to a parent.');
        }
        panel.addClass('ag-charts-popover');

        if (options.ariaLabel != null) {
            panel.setAriaLabel(options.ariaLabel);
        }

        if (options.class != null) {
            panel.addClass(options.class);
        }

        if (options.minWidth != null) {
            panel.setMinWidth(options.minWidth);
        }

        this.removePanel();
        panel.domIndex = 0;
        this.addChild(panel);
        this.panel = panel;
    }

    /**
     * Shows `children` inside a new panel. The children are borrowed: `removePanel()` takes them out of the panel but
     * does not destroy them, so they can be shown again.
     */
    showChildren(children: Widget[], options: PopoverPanelOptions): ContainerWidget {
        const container = new ContainerWidget();
        this.showPanel(container, options);
        this.container = container;
        for (const child of children) {
            container.addChild(child);
            this.borrowedChildren.push(child);
        }
        return container;
    }

    /** Forgets the current panel, handing back any borrowed children and destroying the panel `showChildren()` made. */
    removePanel() {
        this.panel = undefined;
        for (const child of this.borrowedChildren) {
            child.remove();
        }
        this.borrowedChildren.length = 0;
        this.container?.destroy();
        this.container = undefined;
    }

    /**
     * When `sourceEvent` came from a focusable element, remembers it so that `restoreFocus()` can return focus to it,
     * and remembers `initialFocus` for `focusInitial()`. Otherwise keeps what it remembered before.
     */
    setFocusOnOpen(sourceEvent: Event, initialFocus: Widget) {
        const opener = Opener.fromEvent(sourceEvent);
        if (opener !== undefined) {
            this.opener = opener;
            this.initialFocus = initialFocus;
        }
    }

    /** Focuses the widget remembered by `setFocusOnOpen()`, once. */
    focusInitial() {
        this.initialFocus?.focus();
        this.initialFocus = undefined;
    }

    /** Returns focus to the element remembered by `setFocusOnOpen()`, then forgets it. */
    restoreFocus() {
        this.opener?.focus();
        this.opener = undefined;
    }

    /** Forgets the element remembered by `setFocusOnOpen()` without focusing it. */
    forgetOpener() {
        this.opener = undefined;
    }

    /** Borrowed children are handed back first, so destroying the root does not destroy them. */
    override destroy() {
        this.removePanel();
        super.destroy();
    }

    protected override destructor() {
        // Nothing to destroy.
    }
}
