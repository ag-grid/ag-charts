import { createElement, getIconClassNames } from 'ag-charts-core';

import type { LabelIcon } from 'ag-charts-core';
import type { ExpansionControllerWidget } from '../../widget/expandableWidget';
import { MenuItemRadioWidget, MenuItemWidget } from '../../widget/menuItemWidget';
import { MenuWidget } from '../../widget/menuWidget';
import type { MouseWidgetEvent } from '../../widget/widgetEvents';
import { AnchoredPopover, type AnchoredPopoverOptions } from '../popover/anchoredPopover';

export interface MenuOptions<Value = any> extends AnchoredPopoverOptions {
    items: Array<MenuItem<Value>>;
    value?: Value;
    onPress?: (item: MenuItem<Value>) => void;
    menuItemRole?: 'menuitem' | 'menuitemradio';
}

export type MenuItem<Value = any> = LabelIcon & {
    value: Value;
    strokeWidth?: number;
};

type MenuRow = MenuItemWidget | MenuItemRadioWidget;

/**
 * An anchored popover containing a list of pressable items.
 */
export class Menu extends AnchoredPopover {
    public show<Value = any>(controller: ExpansionControllerWidget, options: MenuOptions<Value>): void {
        const menu = new MenuWidget('vertical');
        for (const item of options.items) {
            menu.addChild(this.createRow(options, item, menu));
        }
        menu.addClass('ag-charts-menu');
        this.showWidget(controller, menu, options);
    }

    private allocRow(options: MenuOptions, item: MenuItem): MenuRow {
        if (options.menuItemRole == null || options.menuItemRole === 'menuitem') {
            return new MenuItemWidget();
        } else {
            options.menuItemRole satisfies 'menuitemradio';
            const result = new MenuItemRadioWidget();
            result.setChecked(options.value === item.value);
            return result;
        }
    }

    private createRow<Value>(options: MenuOptions<Value>, item: MenuItem<Value>, menu: MenuWidget): MenuRow {
        const active = item.value === options.value;
        const row = this.allocRow(options, item);
        row.addClass('ag-charts-menu__row');
        row.toggleClass(`ag-charts-menu__row--active`, active);
        if (typeof item.value === 'string') {
            row.getElement().dataset.popoverId = item.value;
        }

        if (item.icon != null) {
            const icon = createElement('span', `ag-charts-menu__icon ${getIconClassNames(item.icon)}`);
            row.getElement().appendChild(icon);
        }

        const strokeWidthVisible = item.strokeWidth != null;
        if (strokeWidthVisible) {
            row.toggleClass(`ag-charts-menu__row--stroke-width-visible`, strokeWidthVisible);
            row.setCSSVariable('--strokeWidth', strokeWidthVisible ? `${item.strokeWidth}px` : null);
        }

        if (item.label != null) {
            const label = createElement('span', 'ag-charts-menu__label');
            label.textContent = this.ctx.localeManager.t(item.label);
            row.getElement().appendChild(label);
        }

        if ('altText' in item) {
            row.setAriaLabel(this.ctx.localeManager.t(item.altText));
        }

        row.addListener('click', ({ sourceEvent }: MouseWidgetEvent<'click'>) => {
            options.onPress?.(item);
            sourceEvent.preventDefault();
            sourceEvent.stopPropagation();
            menu.collapse();
        });

        return row;
    }
}
