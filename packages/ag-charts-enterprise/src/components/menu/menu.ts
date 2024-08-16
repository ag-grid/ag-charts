import { _ModuleSupport } from 'ag-charts-community';
import type { AgIconName } from 'ag-charts-types';

import { AnchoredPopover } from '../popover/anchoredPopover';
import type { PopoverOptions } from '../popover/popover';

const { createElement, initMenuKeyNav, isButtonClickEvent } = _ModuleSupport;

export interface MenuOptions<Value = any> extends PopoverOptions {
    items: Array<MenuItem<Value>>;
    sourceEvent: Event;
    class?: string;
    value?: Value;
    onPress?: (item: MenuItem<Value>) => void;
}

export interface MenuItem<Value = any> {
    label?: string;
    value: Value;
    icon?: AgIconName;
    strokeWidth?: number;
}

/**
 * An anchored popover containing a list of pressable items.
 */
export class Menu extends AnchoredPopover {
    public override show<Value = any>(options: MenuOptions<Value>): void {
        const rows = options.items.map((item) => this.createRow(options, item));
        this.setContent(rows);

        let classes: PopoverOptions['class'] = 'ag-charts-menu';
        if (options.class != null) {
            classes = ['ag-charts-menu', options.class];
        }

        super.show({ ...options, class: classes, role: 'menu' });

        this.menuCloser = initMenuKeyNav({
            orientation: 'vertical',
            menu: this.getPopoverElement()!,
            buttons: rows,
            device: this.ctx.focusIndicator.guessDevice(options.sourceEvent),
            closeCallback: () => this.doClose(),
        });
    }

    private createRow<Value>(options: MenuOptions<Value>, item: MenuItem<Value>) {
        const { domManager } = this.ctx;

        const active = item.value === options.value;
        const row = createElement('div');
        row.setAttribute('role', 'menuitem');
        if (typeof item.value === 'string') {
            row.dataset.popoverId = item.value;
        }
        row.className = `ag-charts-menu__row`;
        row.classList.toggle(`ag-charts-menu__row--active`, active);

        if (item.icon != null) {
            const icon = createElement('span');
            icon.className = `ag-charts-menu__icon ${domManager.getIconClassNames(item.icon)}`;
            row.appendChild(icon);
        }

        const strokeWidthVisible = item.strokeWidth != null;
        if (strokeWidthVisible) {
            row.classList.toggle(`ag-charts-popover__row--stroke-width-visible`, strokeWidthVisible);
            row.style.setProperty('--strokeWidth', strokeWidthVisible ? `${item.strokeWidth}px` : null);
        }

        const title = createElement('span');
        title.textContent = this.ctx.localeManager.t(item.label ?? '');
        title.className = `ag-charts-menu__label`;
        row.appendChild(title);

        const select = () => {
            options.onClose?.();
            options.onPress?.(item);
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

        return row;
    }
}
