import { _ModuleSupport } from 'ag-charts-community';
import type { AgIconName } from 'ag-charts-types';

import { AnchoredPopover } from '../popover/anchoredPopover';
import type { PopoverOptions } from '../popover/popover';

const { createElement, initMenuKeyNav, isButtonClickEvent } = _ModuleSupport;

export interface MenuOptions<Value = any> extends PopoverOptions {
    items: Array<MenuItem<Value>>;
    sourceEvent: Event;
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
    public show<Value = any>(options: MenuOptions<Value>): void {
        const rows = options.items.map((item) => this.createRow(options, item));

        const popover = this.showWithChildren(rows, options);
        popover.classList.add('ag-charts-menu');
        popover.setAttribute('role', 'menu');

        const menuCloser = initMenuKeyNav({
            orientation: 'vertical',
            menu: popover,
            buttons: rows,
            device: this.ctx.focusIndicator.guessDevice(options.sourceEvent),
            closeCallback: () => this.removeChildren(),
        });
        this.hideFns.push(() => menuCloser.close());
    }

    private createRow<Value>(options: MenuOptions<Value>, item: MenuItem<Value>) {
        const { domManager } = this.ctx;

        const active = item.value === options.value;
        const row = createElement('div', 'ag-charts-menu__row');
        row.setAttribute('role', 'menuitem');
        if (typeof item.value === 'string') {
            row.dataset.popoverId = item.value;
        }
        row.classList.toggle(`ag-charts-menu__row--active`, active);

        if (item.icon != null) {
            const icon = createElement('span', `ag-charts-menu__icon ${domManager.getIconClassNames(item.icon)}`);
            row.appendChild(icon);
        }

        const strokeWidthVisible = item.strokeWidth != null;
        if (strokeWidthVisible) {
            row.classList.toggle(`ag-charts-menu__row--stroke-width-visible`, strokeWidthVisible);
            row.style.setProperty('--strokeWidth', strokeWidthVisible ? `${item.strokeWidth}px` : null);
        }

        if (item.label != null) {
            const label = createElement('span', 'ag-charts-menu__label');
            label.textContent = this.ctx.localeManager.t(item.label);
            row.appendChild(label);
        }

        const select = () => {
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
