import { _ModuleSupport, type _Util } from 'ag-charts-community';

const { BaseModuleInstance, createElement } = _ModuleSupport;
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
    onHide?: () => void;
}

/**
 * A non-modal element that overlays the chart.
 */
export abstract class Popover<Options extends PopoverOptions = PopoverOptions>
    extends BaseModuleInstance
    implements _ModuleSupport.ModuleInstance
{
    protected readonly hideFns: Array<() => void> = [];

    private readonly moduleId: string;
    private readonly element: HTMLElement;

    constructor(
        protected readonly ctx: _ModuleSupport.ModuleContext,
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

        this.destroyFns.push(() => ctx.domManager.removeChild(canvasOverlay, this.moduleId));
    }

    public attachTo(popover: Popover) {
        if (this.element.parentElement) return;
        popover.element.append(this.element);
    }

    public hide() {
        // Ensure no side-effects in `onHide()` listeners are caused by modules eagerly hiding the popover when it is
        // already hidden.
        if (this.element.children.length === 0) return;
        this.hideFns.forEach((fn) => fn());
    }

    protected removeChildren() {
        this.element.replaceChildren();
    }

    protected showWithChildren(children: Array<HTMLElement>, options: Options) {
        if (!this.element.parentElement) {
            throw new Error('Can not show popover that has not been attached to a parent.');
        }

        const popover = createElement('div', 'ag-charts-popover');
        popover.setAttribute('data-pointer-capture', 'exclusive');

        if (options.ariaLabel != null) {
            popover.setAttribute('aria-label', options.ariaLabel);
        }

        if (options.class != null) {
            popover.classList.add(options.class);
        }

        popover.replaceChildren(...children);
        this.element.replaceChildren(popover);

        this.hideFns.push(() => this.removeChildren());
        if (options.onHide) {
            this.hideFns.push(options.onHide);
        }

        options.initialFocus?.focus();

        return popover;
    }

    protected getPopoverElement() {
        return this.element.firstElementChild as HTMLDivElement | undefined;
    }

    protected updatePosition(position: _Util.Vec2) {
        const popover = this.getPopoverElement();
        if (!popover) return;

        popover.style.setProperty('top', 'unset');
        popover.style.setProperty('bottom', 'unset');
        popover.style.setProperty('left', `${Math.floor(position.x)}px`);
        popover.style.setProperty('top', `${Math.floor(position.y)}px`);
    }
}
