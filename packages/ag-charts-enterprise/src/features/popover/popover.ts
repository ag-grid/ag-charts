import { type AgIconName, _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

const { createElement } = _ModuleSupport;

const moduleId = 'popover';
const canvasOverlay = 'canvas-overlay';

export interface MenuItem {
    label: string;
    icon?: AgIconName;
    active?: boolean;
    onPress: () => void;
}

export class Popover extends _ModuleSupport.BaseModuleInstance implements _ModuleSupport.ModuleInstance {
    private readonly element: HTMLElement;
    private anchor?: { x: number; y: number } = undefined;
    private removeGlobalEventListeners?: () => void = undefined;

    constructor(private readonly ctx: _ModuleSupport.ModuleContext) {
        super();

        this.element = ctx.domManager.addChild(canvasOverlay, moduleId);
        this.element.role = 'presentation';

        this.destroyFns.push(() => ctx.domManager.removeChild(canvasOverlay, moduleId));
    }

    show(opts: { items: MenuItem[]; onClose: () => void }) {
        const { domManager } = this.ctx;
        const popover = createElement('div');
        popover.setAttribute('data-pointer-capture', 'exclusive');
        popover.setAttribute('tabindex', '0');
        popover.setAttribute('role', 'menu');
        popover.className = `ag-charts-popover`;

        const rows = opts.items.map((item) => {
            const row = createElement('div');
            row.className = `ag-charts-popover__row`;
            row.classList.toggle(`ag-charts-popover__row--active`, item.active === true);
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
                item.onPress();
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
        window.addEventListener('mousemove', windowMouseMoveEvent);

        const windowMouseMoveDown = (e: MouseEvent) => {
            if (e.button !== 0 || popover.contains(e.target as any)) return;

            opts.onClose();
        };
        window.addEventListener('mousedown', windowMouseMoveDown);

        this.removeGlobalEventListeners?.();
        this.removeGlobalEventListeners = () => {
            window.removeEventListener('mousemove', windowMouseMoveEvent);
            window.removeEventListener('mousedown', windowMouseMoveDown);
        };

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
        this.removeGlobalEventListeners?.();
        this.removeGlobalEventListeners = undefined;
    }

    isChildElement(element: HTMLElement) {
        return this.ctx.domManager.isManagedChildDOMElement(element, canvasOverlay, moduleId);
    }

    private updatePosition(colorPicker: HTMLElement, x: number, y: number) {
        colorPicker.style.setProperty('top', 'unset');
        colorPicker.style.setProperty('bottom', 'unset');
        colorPicker.style.setProperty('left', `${x}px`);
        colorPicker.style.setProperty('top', `${y}px`);
    }
}
