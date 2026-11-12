import {
    AbstractModuleInstance,
    type ContainerWidget,
    type DynamicContext,
    type Point,
    type PopoverPanelOptions,
    PopoverWidget,
    type Widget,
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

export interface PopoverOptions extends PopoverPanelOptions {
    initialFocus?: Widget;
    sourceEvent?: Event;
    onHide?: () => void;
}

/**
 * A non-modal element that overlays the chart.
 */
export abstract class Popover<Options extends PopoverOptions = PopoverOptions> extends AbstractModuleInstance {
    protected readonly hideFns: Array<() => void> = [];

    private readonly moduleId: string;
    private readonly widget: PopoverWidget;

    constructor(
        protected readonly ctx: DynamicContext<ChartRegistry>,
        id: string,
        options?: PopoverConstructorOptions
    ) {
        super();

        this.moduleId = `popover-${id}`;

        if (options?.detached) {
            this.widget = new PopoverWidget();
        } else {
            // TODO: Phase 3 "Common Widget Ancestor" - DOMManager hands out the popover root as a raw element
            this.widget = new PopoverWidget(ctx.domManager.addChild(canvasOverlay, this.moduleId));
        }

        this.hideFns.push(() => this.setOwnedWidget(undefined));
        this.cleanup.register(() => {
            this.widget.removePanel();
            this.widget.remove();
            ctx.domManager.removeChild(canvasOverlay, this.moduleId);
        });
    }

    private readonly setOwnedWidget: (owns: OwnedWidget | undefined) => void = (() => {
        let ownedWidget: OwnedWidget | undefined; // private member for this.setOwnedWidget()
        return (owns: OwnedWidget | undefined): void => {
            // Destroying a menu collapses it, which calls `hide()` again; it must find the popover already hidden.
            if (ownedWidget != null && ownedWidget === this.widget.getPanel()) this.widget.removePanel();
            ownedWidget?.destroy();
            ownedWidget = owns;
        };
    })();

    public attachTo(popover: Popover) {
        this.widget.attachTo(popover.widget);
    }

    public isVisible() {
        return this.widget.getPanel() != null;
    }

    /** Hides the popover. Focus returns to the element that opened it, if one was remembered, unless `lastFocus` is `null`. */
    public hide(opts?: { lastFocus?: null }) {
        // Ensure no side-effects in `onHide()` listeners are caused by modules eagerly hiding the popover when it is
        // already hidden.
        if (!this.isVisible()) return;
        for (const fn of this.hideFns) {
            fn();
        }
        this.widget.removePanel();

        if (opts?.lastFocus === null) {
            this.widget.forgetOpener();
        } else {
            this.widget.restoreFocus();
        }
    }

    protected showWidget(controller: ExpansionControllerWidget, owns: OwnedWidget, options: Options) {
        this.setOwnedWidget(owns);
        this.widget.showPanel(owns, options);
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
        const container = this.widget.showChildren(children, options);

        this.hideFns.push(() => this.widget.removePanel());
        if (options.onHide) {
            this.hideFns.push(options.onHide);
        }

        if (options.initialFocus && options.sourceEvent) {
            this.widget.setFocusOnOpen(options.sourceEvent, options.initialFocus);
        }

        return container;
    }

    protected getPopoverWidget(): Widget | undefined {
        return this.widget.getPanel();
    }

    protected updatePosition(position: Partial<Point>) {
        const popover = this.widget.getPanel();
        if (!popover) return;

        popover.setCssOffset(position);

        // AG-13167 Deferred focus() call after position have been initialised
        this.widget.focusInitial();
    }
}
