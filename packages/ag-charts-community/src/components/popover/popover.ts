import { AbstractModuleInstance, type Point, createElement, getLastFocus } from 'ag-charts-core';

import type { ModuleContext } from '../../module/moduleContext';
import type { ExpandableWidget, ExpansionControllerWidget } from '../../widget/expandableWidget';

const canvasOverlay = 'canvas-overlay';

export interface PopoverConstructorOptions {
    // Create the popover without appending it to the canvas overlay, then it should
    // call `popover.attachTo(parentPopover)` before calling `popover.show()`.
    detached?: boolean;
}

export interface PopoverOptions {
    ariaLabel?: string;
    class?: string;
    initialFocus?: HTMLElement;
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
    private readonly element: HTMLElement;
    private lastFocus?: HTMLElement;
    private initialFocus?: HTMLElement;

    constructor(
        protected readonly ctx: ModuleContext,
        id: string,
        options?: PopoverConstructorOptions
    ) {
        super();

        this.moduleId = `popover-${id}`;

        if (options?.detached) {
            this.element = createElement('div');
        } else {
            this.element = ctx.domManager.addChild(canvasOverlay, this.moduleId);
        }
        this.element.setAttribute('role', 'presentation');

        this.hideFns.push(() => this.setOwnedWidget(undefined));
        this.cleanup.register(() => ctx.domManager.removeChild(canvasOverlay, this.moduleId));
    }

    private readonly setOwnedWidget: (owns: ExpandableWidget | undefined) => void = (() => {
        let ownedWidget: ExpandableWidget | undefined; // private member for this.setOwnedWidget()
        return (owns: ExpandableWidget | undefined): void => {
            ownedWidget?.destroy();
            ownedWidget = owns;
        };
    })();

    public attachTo(popover: Popover) {
        if (this.element.parentElement) return;
        popover.element.append(this.element);
    }

    public hide(opts?: { lastFocus?: null }) {
        const { lastFocus = this.lastFocus } = opts ?? {};
        // Ensure no side-effects in `onHide()` listeners are caused by modules eagerly hiding the popover when it is
        // already hidden.
        if (this.element.children.length === 0) return;
        for (const fn of this.hideFns) {
            fn();
        }

        lastFocus?.focus();
        this.lastFocus = undefined;
    }

    protected removeChildren() {
        this.element.replaceChildren();
    }

    private initPopoverElement(popover: HTMLElement | undefined, options: Options): HTMLElement {
        if (!this.element.parentElement) {
            throw new Error('Can not show popover that has not been attached to a parent.');
        }
        popover ??= createElement('div', 'ag-charts-popover');
        popover.classList.toggle('ag-charts-popover', true);

        if (options.ariaLabel != null) {
            popover.setAttribute('aria-label', options.ariaLabel);
        }

        if (options.class != null) {
            popover.classList.add(options.class);
        }

        if (options.minWidth != null) {
            popover.style.minWidth = `${options.minWidth}px`;
        }

        this.element.replaceChildren(popover);
        return popover;
    }

    protected showWidget(controller: ExpansionControllerWidget, owns: ExpandableWidget, options: Options) {
        this.setOwnedWidget(owns);
        this.initPopoverElement(owns.getElement(), options);
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

    protected showWithChildren(children: Array<HTMLElement>, options: Options) {
        const popover = this.initPopoverElement(undefined, options);
        popover.replaceChildren(...children);

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

        return popover;
    }

    protected getPopoverElement() {
        return this.element.firstElementChild as HTMLDivElement | undefined;
    }

    protected updatePosition(position: Partial<Point>) {
        const popover = this.getPopoverElement();
        if (!popover) return;

        popover.style.setProperty('right', 'unset');
        popover.style.setProperty('bottom', 'unset');
        if (position.x != null) popover.style.setProperty('left', `${Math.floor(position.x)}px`);
        if (position.y != null) popover.style.setProperty('top', `${Math.floor(position.y)}px`);

        // AG-13167 Deferred focus() call after position have been initialised
        this.initialFocus?.focus();
        this.initialFocus = undefined;
    }
}
