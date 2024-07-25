import { type AgIconName, _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

const { createElement } = _ModuleSupport;

const canvasOverlay = 'canvas-overlay';

export interface MenuItem<Value = any> {
    label: string;
    value: Value;
    icon?: AgIconName;
}

export class Popover extends _ModuleSupport.BaseModuleInstance implements _ModuleSupport.ModuleInstance {
    private readonly element: HTMLElement;
    private anchor?: { x: number; y: number };
    private windowMouseMoveEvent?: (e: MouseEvent) => void | undefined;

    private moduleId: string;

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
        value?: Value;
        onPress?: (item: MenuItem<Value>) => void;
        onClose: () => void;
        minWidth?: number;
    }) {
        const { domManager } = this.ctx;
        const popover = createElement('div');
        popover.setAttribute('data-pointer-capture', 'exclusive');
        popover.setAttribute('tabindex', '0');
        popover.setAttribute('role', 'menu');
        popover.className = `ag-charts-popover`;

        if (opts.minWidth != null) {
            popover.style.minWidth = `${opts.minWidth}px`;
        }

        const rows = opts.items.map((item) => {
            const active = item.value === opts.value;
            const row = createElement('div');
            row.className = `ag-charts-popover__row`;
            row.classList.toggle(`ag-charts-popover__row--active`, active);
            row.setAttribute('tabindex', '0');
            popover.setAttribute('role', 'menuitem');

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

            row.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    select();
                    e.preventDefault();
                    e.stopPropagation();
                }
            });

            row.addEventListener('click', (e) => {
                if (e.button === 0) {
                    select();
                    e.preventDefault();
                    e.stopPropagation();
                }
            });

            row.addEventListener('mousemove', () => {
                row.focus();
            });

            popover.appendChild(row);

            return row;
        });

        const popoverContainer = createElement('div');
        popoverContainer.role = 'presentation';
        popoverContainer.appendChild(popover);
        this.element.replaceChildren(popoverContainer);

        // If an anchor has already been provided, apply it to prevent a flash of the picker in the wrong location
        if (this.anchor) {
            this.setAnchor(this.anchor);
        }

        const focusIndexDelta = (delta: -1 | 1) => {
            const { activeElement } = document;
            const activeIndex = rows.findIndex((element) => element.contains(activeElement));
            const nextIndex = activeIndex !== -1 ? Math.min(Math.max(activeIndex + delta, 0), rows.length - 1) : 0;
            rows[nextIndex].focus();
        };

        popover.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'ArrowUp':
                    focusIndexDelta(-1);
                    break;
                case 'ArrowDown':
                    focusIndexDelta(1);
                    break;
                case 'Escape':
                case 'Enter':
                    opts.onClose();
                    break;
                default:
                    return;
            }

            e.preventDefault();
            e.stopPropagation();
        });

        const windowMouseMoveEvent = (e: MouseEvent) => {
            if (popover.contains(e.target as any)) return;
            popover.focus();
        };
        this.windowMouseMoveEvent = windowMouseMoveEvent;
        window.addEventListener('mousemove', windowMouseMoveEvent);

        popover.focus();
    }

    setAnchor(anchor: { x: number; y: number }) {
        this.anchor = anchor;

        const colorPicker = this.element.firstElementChild?.firstElementChild as HTMLElement | undefined;
        if (!colorPicker) return;

        this.updatePosition(colorPicker, anchor.x, anchor.y);
    }

    hide() {
        this.element.replaceChildren();
        const { windowMouseMoveEvent } = this;
        if (windowMouseMoveEvent != null) {
            window.removeEventListener('mousemove', windowMouseMoveEvent);
            this.windowMouseMoveEvent = undefined;
        }
    }

    isChildElement(element: HTMLElement) {
        return this.ctx.domManager.isManagedChildDOMElement(element, canvasOverlay, this.moduleId);
    }

    private updatePosition(colorPicker: HTMLElement, x: number, y: number) {
        colorPicker.style.setProperty('top', 'unset');
        colorPicker.style.setProperty('bottom', 'unset');
        colorPicker.style.setProperty('left', `${x}px`);
        colorPicker.style.setProperty('top', `${y}px`);
    }
}
