import type { ButtonWidget } from './buttonWidget';
import { RovingTabContainerWidget } from './rovingTabContainerWidget';

/** A horizontal `role="tablist"` of tab buttons, navigated with the arrow keys and a single tab stop. */
export class TabListWidget extends RovingTabContainerWidget<ButtonWidget> {
    constructor() {
        super('horizontal', 'tablist');
    }

    protected override destructor() {
        // Nothing to destroy.
    }
}
