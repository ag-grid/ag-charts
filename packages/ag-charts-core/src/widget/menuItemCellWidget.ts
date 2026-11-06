import { createElement } from '../dom/domElements';
import { Widget } from './widget';

/** A `<div>` column inside a menu row, such as the row's icon, label or submenu arrow. */
export class MenuItemCellWidget extends Widget<HTMLDivElement> {
    /**
     * @param classNames - Class names to add.
     */
    constructor(...classNames: string[]) {
        super(createElement('div'));
        if (classNames.length > 0) this.addClass(...classNames);
    }

    protected override destructor() {
        // Nothing to destroy.
    }
}
