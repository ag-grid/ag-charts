import type { ModuleContext } from '../../module/moduleContext';
import { createElement } from '../../util/dom';
import { isButtonClickEvent } from '../../util/keynavUtil';
import type { ElementProvider } from '../componentTypes';
import type { MenuItemOptions, MenuOptions } from './menuTypes';

/**
 * An element that is an option in a set of choices contained by a menu.
 * https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/menuitem_role
 */
export class MenuItem<Value = any> implements ElementProvider {
    private readonly element: HTMLElement;

    constructor(ctx: ModuleContext, options: MenuOptions<Value>, item: MenuItemOptions<Value>) {
        const { domManager, localeManager } = ctx;
        const { menuItemRole = 'menuitem' } = options;

        const active = item.value === options.value;

        const element = createElement('div', 'ag-charts-menu__item');
        element.setAttribute('role', menuItemRole);
        if (menuItemRole === 'menuitemradio') {
            element.setAttribute('aria-checked', active.toString());
        }
        element.classList.toggle(`ag-charts-menu__row--active`, active);

        if (item.icon != null) {
            const icon = createElement('span', `ag-charts-menu__item-icon ${domManager.getIconClassNames(item.icon)}`);
            element.appendChild(icon);
        }

        if (item.label != null) {
            const label = createElement('span', 'ag-charts-menu__item-label');
            label.textContent = localeManager.t(item.label);
            element.appendChild(label);
        }

        if (item.altText != null) {
            element.ariaLabel = localeManager.t(item.altText);
        }

        const onPress = (event: KeyboardEvent | MouseEvent) => {
            if (!isButtonClickEvent(event)) return;
            options.onPress?.(item, event);
            event.preventDefault();
            event.stopPropagation();
        };
        element.addEventListener('keydown', onPress);
        element.addEventListener('click', onPress);

        element.addEventListener('mousemove', () => {
            element.focus();
        });

        this.element = element;
    }

    getElement() {
        return this.element;
    }
}
