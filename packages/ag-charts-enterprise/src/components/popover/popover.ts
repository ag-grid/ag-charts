import { _ModuleSupport, type _Util } from 'ag-charts-community';

const { BaseModuleInstance, createElement } = _ModuleSupport;
const canvasOverlay = 'canvas-overlay';

export interface PopoverOptions {
    ariaLabel?: string;
    class?: string | Array<string>;
    role?: string;
    onClose?: () => void;
}

/**
 * A non-modal element that overlays the chart.
 */
export class Popover<Options extends PopoverOptions = PopoverOptions>
    extends BaseModuleInstance
    implements _ModuleSupport.ModuleInstance
{
    private readonly moduleId: string;
    private readonly element: HTMLElement;
    private content?: Array<HTMLElement>;

    protected menuCloser?: _ModuleSupport.MenuCloser;

    constructor(
        protected readonly ctx: _ModuleSupport.ModuleContext,
        id: string
    ) {
        super();

        this.moduleId = `popover-${id}`;

        this.element = ctx.domManager.addChild(canvasOverlay, this.moduleId);
        this.element.role = 'presentation';

        this.destroyFns.push(() => ctx.domManager.removeChild(canvasOverlay, this.moduleId));
    }

    public show(options: Options) {
        const popover = createElement('div');
        popover.setAttribute('data-pointer-capture', 'exclusive');
        popover.className = 'ag-charts-popover';

        if (options.ariaLabel != null) {
            popover.setAttribute('aria-label', options.ariaLabel);
        }

        if (options.role != null) {
            popover.setAttribute('role', options.role);
        }

        if (options.class != null) {
            popover.classList.add(...(Array.isArray(options.class) ? options.class : [options.class]));
        }

        if (this.content) {
            popover.replaceChildren(...this.content);
        }

        this.element.replaceChildren(popover);
    }

    public hide() {
        this.menuCloser?.close();
    }

    protected doClose() {
        this.element.replaceChildren();
        this.menuCloser = undefined;
    }

    protected getPopoverElement() {
        return this.element.firstElementChild as HTMLDivElement | undefined;
    }

    protected setContent(content: HTMLElement | Array<HTMLElement>) {
        this.content = Array.isArray(content) ? content : [content];
    }

    protected updatePosition(position: _Util.Vec2) {
        const popover = this.getPopoverElement();
        if (!popover) return;

        popover.style.setProperty('top', 'unset');
        popover.style.setProperty('bottom', 'unset');
        popover.style.setProperty('left', `${position.x}px`);
        popover.style.setProperty('top', `${position.y}px`);
    }
}
