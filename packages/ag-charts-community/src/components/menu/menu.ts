import type { ClickWidgetEvent, ExpansionControllerWidget, LabelIcon } from 'ag-charts-core';
import { IconWidget, MenuItemRadioWidget, MenuItemWidget, MenuWidget, TextSpanWidget } from 'ag-charts-core';

import { AnchoredPopover, type AnchoredPopoverOptions } from '../popover/anchoredPopover';

export interface MenuOptions<Value = any> extends AnchoredPopoverOptions {
    items: Array<MenuItem<Value>>;
    value?: Value;
    onPress?: (item: MenuItem<Value>, event: ClickWidgetEvent) => void;
    menuItemRole?: 'menuitem' | 'menuitemradio';
}

export type MenuItem<Value = any> = LabelIcon & {
    value: Value;
    enabled?: boolean;
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

        if (item.enabled != null) {
            row.setEnabled(item.enabled);
        }

        row.addClass('ag-charts-menu__row');
        row.toggleClass(`ag-charts-menu__row--active`, active);

        if (typeof item.value === 'string') {
            row.setData('popoverId', item.value);
        }

        if (item.icon != null) {
            row.addChild(IconWidget.fromName(item.icon, 'ag-charts-menu__icon'));
        }

        const strokeWidthVisible = item.strokeWidth != null;
        if (strokeWidthVisible) {
            row.toggleClass(`ag-charts-menu__row--stroke-width-visible`, strokeWidthVisible);
            row.setCSSVariable('--strokeWidth', strokeWidthVisible ? `${item.strokeWidth}px` : null);
        }

        if (item.label != null) {
            row.addChild(new TextSpanWidget(this.ctx.localeManager.t(item.label), 'ag-charts-menu__label'));
        }

        if ('altText' in item) {
            row.setAriaLabel(this.ctx.localeManager.t(item.altText));
        }

        row.addListener('click', (event: ClickWidgetEvent) => {
            const { sourceEvent } = event;
            options.onPress?.(item, event);
            sourceEvent.preventDefault();
            menu.collapse();
        });

        return row;
    }
}
