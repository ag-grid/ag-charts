import type { ButtonWidget } from './buttonWidget';
import { RovingTabContainerWidget } from './rovingTabContainerWidget';
import type { Widget } from './widget';

/**
 * A horizontal `role="radiogroup"` of radio buttons, navigated with the arrow keys and a single tab stop. The optional
 * label is placed before the buttons but is not a roving child, so it never takes part in keyboard navigation.
 */
export class RadioGroupWidget extends RovingTabContainerWidget<ButtonWidget> {
    constructor(private readonly label?: Widget) {
        super('horizontal', 'radiogroup');
        if (label) this.appendOrInsert(label.getElement(), undefined);
    }

    override clear() {
        super.clear();
        if (this.label) this.appendOrInsert(this.label.getElement(), undefined);
    }

    protected override destructor() {
        this.label?.destroy();
    }
}
