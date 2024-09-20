import type { LabelIcon } from '../../dom/elements';
import type { WidgetOptions } from '../widget/widget';

export interface MenuOptions<Value = any> extends WidgetOptions {
    items: Array<MenuItemOptions<Value>>;
    value?: Value;
    onPress?: (item: MenuItemOptions<Value>, sourceEvent: Event) => void;
    menuItemRole?: 'menuitem' | 'menuitemradio';
}

export type MenuItemOptions<Value = any> = LabelIcon & {
    childMenu?: Pick<MenuOptions, 'items' | 'menuItemRole' | 'value'>;
    value: Value;
};
