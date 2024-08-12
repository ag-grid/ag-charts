import { type AgIconName, _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

const { createElement, initMenuKeyNav, isButtonClickEvent } = _ModuleSupport;

const canvasOverlay = 'canvas-overlay';

export interface MenuItem<Value = any> {
    label: string;
    value: Value;
    icon?: AgIconName;
}

export class Popover extends _ModuleSupport.BaseModuleInstance implements _ModuleSupport.ModuleInstance {
    private readonly element: HTMLElement;
    private anchor?: { x: number; y: number } = undefined;

    private readonly moduleId: string;

    constructor(
        private readonly ctx: _ModuleSupport.ModuleContext,
        id: string
    ) {
        super();

        this.moduleId = `popover-${id}`;

        this.element = ctx.domManager.addChild(canvasOverlay, this.moduleId);
        this.element.role = 'presentation';

        this.destroyFns.push(() => ctx.domManager.removeChild(canvasOverlay, this.moduleId));
    }

    show<Value = any>(opts: {
        items: MenuItem<Value>[];
        sourceEvent: Event;
        ariaLabel: string;
        value?: Value;
        onPress?: (item: MenuItem<Value>) => void;
        onClose: () => void;
        class?: string;
    }) {
        const { domManager } = this.ctx;
        const popover = createElement('div');
        popover.setAttribute('role', 'menu');
        popover.setAttribute('aria-label', opts.ariaLabel);
        popover.setAttribute('data-pointer-capture', 'exclusive');
        popover.className = `ag-charts-popover`;

        if (opts.class != null) {
            popover.classList.add(opts.class);
        }

        const rows = opts.items.map((item) => {
            const active = item.value === opts.value;
            const row = createElement('div');
            row.setAttribute('role', 'menuitem');
            if (typeof item.value === 'string') {
                row.dataset.popoverId = item.value;
            }
            row.className = `ag-charts-popover__row`;
            row.classList.toggle(`ag-charts-popover__row--active`, active);

            if (item.icon != null) {
                const icon = createElement('span');
                icon.className = `ag-charts-popover__icon ${domManager.getIconClassNames(item.icon)}`;
                row.appendChild(icon);
            }

            const title = createElement('span');
            title.textContent = this.ctx.localeManager.t(item.label);
            title.className = `ag-charts-popover__label`;
            row.appendChild(title);

            const select = () => {
                opts.onClose();
                opts.onPress?.(item);
            };

            const onclick = (e: KeyboardEvent | MouseEvent) => {
                if (isButtonClickEvent(e)) {
                    select();
                    e.preventDefault();
                    e.stopPropagation();
                }
            };
            row.addEventListener('keydown', onclick);
            row.addEventListener('click', onclick);

            row.addEventListener('mousemove', () => {
                row.focus();
            });

            popover.appendChild(row);

            return row;
        });

        initMenuKeyNav({
            orientation: 'vertical',
            menu: popover,
            buttons: rows,
            sourceEvent: opts.sourceEvent,
            hideCallback: () => {
                opts.onClose();
                this.hide();
            },
        });

        this.element.replaceChildren(popover);

        // If an anchor has already been provided, apply it to prevent a flash of the picker in the wrong location
        if (this.anchor) {
            this.setAnchor(this.anchor);
        }

        popover.focus();
    }

    setAnchor(anchor: { x: number; y: number }) {
        this.anchor = anchor;

        const popover = this.element.firstElementChild as HTMLElement | undefined;
        if (!popover) return;

        this.updatePosition(popover, anchor.x, anchor.y);
    }

    hide() {
        this.element.replaceChildren();
    }

    isChildElement(element: HTMLElement) {
        return this.ctx.domManager.isManagedChildDOMElement(element, canvasOverlay, this.moduleId);
    }

    private updatePosition(popover: HTMLElement, x: number, y: number) {
        popover.style.setProperty('top', 'unset');
        popover.style.setProperty('bottom', 'unset');
        popover.style.setProperty('left', `${x}px`);
        popover.style.setProperty('top', `${y}px`);
    }
}
