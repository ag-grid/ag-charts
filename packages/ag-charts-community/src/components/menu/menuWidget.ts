import type { HierarchyProvider } from '../../dom/domHierarchyManager';
import type { ModuleContext } from '../../module/moduleContext';
import { Widget, type WidgetConstructorOptions } from '../widget/widget';
import { MenuItem } from './menuItem';
import { MenuPopover } from './menuPopover';
import type { MenuItemOptions, MenuOptions } from './menuTypes';

export interface MenuWidgetConstructorOptions<Value = any> extends WidgetConstructorOptions {
    menu: MenuOptions<Value>;
}

/**
 * A component widget that offers a list of choices to the user.
 * https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/menu_role
 */
export class MenuWidget<Value = any> extends Widget implements HierarchyProvider {
    private childMenu: MenuPopover;

    constructor(ctx: ModuleContext, id: string, options: MenuWidgetConstructorOptions<Value>) {
        super(ctx, id, options);

        const rows = options.menu.items.map(
            (item) =>
                new MenuItem<Value>(
                    ctx,
                    {
                        ...options.menu,
                        onPress: (item, sourceEvent) => {
                            this.onPressItem(item);
                            this.openChildMenu(item, sourceEvent);
                        },
                    },
                    item
                )
        );
        const rowElements = rows.map((row) => row.getElement());

        const widget = this.createWithChildren(rowElements, options);
        widget.classList.add('ag-charts-menu');
        widget.setAttribute('role', 'menu');

        this.childMenu = new MenuPopover(ctx, `${id}__child-menu`);
    }

    getHierarchyChildren() {
        return [this.childMenu];
    }

    onHierarchyRemoveFocus() {
        this.childMenu.hide();
    }

    protected onPressItem(item: MenuItemOptions<Value>) {}

    private openChildMenu(item: MenuItemOptions<Value>, sourceEvent: Event) {
        if (item.childMenu == null) return;

        // TODO: should the domHM handle calling `.show()` on the child menu?
        this.ctx.domHierarchyManager.giveFocus(this.childMenu);
        this.childMenu.show({
            ...item.childMenu,
            anchor: undefined,
            sourceEvent,
        });
    }
}
