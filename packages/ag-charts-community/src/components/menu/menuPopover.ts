import { _ModuleSupport } from 'ag-charts-community';

import type { HierarchyProvider } from '../../dom/domHierarchyManager';
import { AnchoredPopover, type AnchoredPopoverOptions } from '../popover/anchoredPopover';
import { MenuItem } from './menuItem';
import type { MenuOptions } from './menuTypes';

const { initMenuKeyNav } = _ModuleSupport;

export interface MenuPopoverOptions<Value = any> extends AnchoredPopoverOptions, MenuOptions<Value> {
    sourceEvent: Event;
}

/**
 * An anchored popover variant of the menu widget that offers a list of choices to the user.
 * https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/menu_role
 */
export class MenuPopover extends AnchoredPopover implements HierarchyProvider {
    protected menuCloser?: _ModuleSupport.MenuCloser;

    public show<Value = any>(options: MenuPopoverOptions<Value>): void {
        const rows = options.items.map((item) => new MenuItem(this.ctx, options, item));
        const rowElements = rows.map((row) => row.getElement());

        const popover = this.showWithChildren(rowElements, options);
        popover.classList.add('ag-charts-menu');
        popover.setAttribute('role', 'menu');

        this.menuCloser = initMenuKeyNav({
            orientation: 'vertical',
            menu: popover,
            buttons: rowElements,
            device: this.ctx.focusIndicator.guessDevice(options.sourceEvent),
            closeCallback: () => this.hide(),
        });

        this.hideFns.push(() => {
            this.menuCloser?.finishClosing();
            this.menuCloser = undefined;
        });
    }
}
