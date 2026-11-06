import {
    AbstractModuleInstance,
    ContainerWidget,
    type DynamicContext,
    NativeWidget,
    type Point,
    type Widget,
    getLastFocus,
} from 'ag-charts-core';
import type { ExpandableWidget, ExpansionControllerWidget } from 'ag-charts-core';

import type { ChartRegistry } from '../../module/moduleContext';

const canvasOverlay = 'canvas-overlay';

type OwnedWidget = ExpandableWidget & Widget;

export interface PopoverConstructorOptions {
    // Create the popover without appending it to the canvas overlay, then it should
    // call `popover.attachTo(parentPopover)` before calling `popover.show()`.
    detached?: boolean;
}

export interface PopoverOptions {
    ariaLabel?: string;
    class?: string;
    initialFocus?: Widget;
    minWidth?: number;
    sourceEvent?: Event;
    onHide?: () => void;
}

/**
 * A non-modal element that overlays the chart.
 */
export abstract class Popover<Options extends PopoverOptions = PopoverOptions> extends AbstractModuleInstance {
    protected readonly hideFns: Array<() => void> = [];

    private readonly moduleId: string;
    private readonly root: Widget;
    private attached: boolean;
    private popover?: Widget;
    // Only set while `popover` is a container made by `showWithChildren()`; the popover widget is then ours to destroy.
    private container?: ContainerWidget;
    private readonly containerChildren: Widget[] = [];
    private lastFocus?: HTMLElement;
    private initialFocus?: Widget;

    constructor(
        protected readonly ctx: DynamicContext<ChartRegistry>,
        id: string,
        options?: PopoverConstructorOptions
    ) {
        super();

        this.moduleId = `popover-${id}`;

        if (options?.detached) {
            this.root = new ContainerWidget();
            this.attached = false;
        } else {
            // TODO: Phase 3 "Common Widget Ancestor" - DOMManager hands out the popover root as a raw element
            this.root = new NativeWidget(ctx.domManager.addChild(canvasOverlay, this.moduleId));
            this.attached = true;
        }
        this.root.setAriaRole('presentation');

        this.hideFns.push(() => this.setOwnedWidget(undefined));
        this.cleanup.register(() => {
            this.removeChildren();
            this.root.remove();
            ctx.domManager.removeChild(canvasOverlay, this.moduleId);
        });
    }

    private readonly setOwnedWidget: (owns: OwnedWidget | undefined) => void = (() => {
        let ownedWidget: OwnedWidget | undefined; // private member for this.setOwnedWidget()
        return (owns: OwnedWidget | undefined): void => {
            // Destroying a menu collapses it, which calls `hide()` again; it must find the popover already hidden.
            if (ownedWidget != null && ownedWidget === this.popover) this.popover = undefined;
            ownedWidget?.destroy();
            ownedWidget = owns;
        };
    })();

    public attachTo(popover: Popover) {
        if (this.attached) return;
        // Stack after the parent's popover widget (`domIndex` 0), so this popover is painted above it.
        this.root.domIndex = 1;
        popover.root.addChild(this.root);
        this.attached = true;
    }

    public hide(opts?: { lastFocus?: null }) {
        const { lastFocus = this.lastFocus } = opts ?? {};
        // Ensure no side-effects in `onHide()` listeners are caused by modules eagerly hiding the popover when it is
        // already hidden.
        if (this.popover == null) return;
        for (const fn of this.hideFns) {
            fn();
        }
        this.popover = undefined;

        lastFocus?.focus();
        this.lastFocus = undefined;
    }

    /** Takes the current popover widget out of the DOM, handing back any children given to `showWithChildren()`. */
    protected removeChildren() {
        this.popover = undefined;
        for (const child of this.containerChildren) {
            child.remove();
        }
        this.containerChildren.length = 0;
        this.container?.destroy();
        this.container = undefined;
    }

    private initPopoverWidget(popover: Widget, options: Options) {
        if (!this.attached) {
            throw new Error('Can not show popover that has not been attached to a parent.');
        }
        popover.addClass('ag-charts-popover');

        if (options.ariaLabel != null) {
            popover.setAriaLabel(options.ariaLabel);
        }

        if (options.class != null) {
            popover.addClass(options.class);
        }

        if (options.minWidth != null) {
            popover.setMinWidth(options.minWidth);
        }

        this.removeChildren();
        popover.domIndex = 0;
        this.root.addChild(popover);
        this.popover = popover;
    }

    protected showWidget(controller: ExpansionControllerWidget, owns: OwnedWidget, options: Options) {
        this.setOwnedWidget(owns);
        this.initPopoverWidget(owns, options);
        owns.addListener('collapse-widget', () => {
            this.hide();
            controller.setControlled(undefined);
            this.setOwnedWidget(undefined);
        });
        controller.setControlled(owns);
        controller.expandControlled();

        if (options.onHide) {
            this.hideFns.push(options.onHide);
        }
    }

    /**
     * Shows `children` inside a new popover widget. The children are borrowed: hiding the popover removes them from it
     * but does not destroy them, so they can be shown again.
     */
    protected showWithChildren(children: Widget[], options: Options): ContainerWidget {
        const container = new ContainerWidget();
        this.initPopoverWidget(container, options);
        this.container = container;
        for (const child of children) {
            container.addChild(child);
            this.containerChildren.push(child);
        }

        this.hideFns.push(() => this.removeChildren());
        if (options.onHide) {
            this.hideFns.push(options.onHide);
        }

        if (options.initialFocus && options.sourceEvent) {
            const lastFocus = getLastFocus(options.sourceEvent);
            if (lastFocus !== undefined) {
                this.lastFocus = lastFocus;
                this.initialFocus = options.initialFocus;
            }
        }

        return container;
    }

    protected getPopoverWidget(): Widget | undefined {
        return this.popover;
    }

    protected updatePosition(position: Partial<Point>) {
        const { popover } = this;
        if (!popover) return;

        popover.setCssOffset(position);

        // AG-13167 Deferred focus() call after position have been initialised
        this.initialFocus?.focus();
        this.initialFocus = undefined;
    }
}
