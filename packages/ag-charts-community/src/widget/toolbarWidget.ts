import { RovingTabContainerWidget } from './rovingTabContainerWidget';

export class ToolbarWidget extends RovingTabContainerWidget {
    constructor() {
        super('horizontal', 'toolbar');
    }
    protected override destructor() {
        // Nothing to destroy.
    }
}
