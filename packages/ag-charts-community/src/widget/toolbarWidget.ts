import type { RovingDirection } from './rovingDirection';
import { RovingTabContainerWidget } from './rovingTabContainerWidget';

export class ToolbarWidget extends RovingTabContainerWidget {
    constructor(orientation: RovingDirection = 'horizontal') {
        super(orientation, 'toolbar');
    }

    protected override destructor() {
        // Nothing to destroy.
    }
}
