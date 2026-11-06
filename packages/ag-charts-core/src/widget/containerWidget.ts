import { createElement } from '../dom/domElements';
import { Widget } from './widget';

/** A plain `<div>` that holds other widgets, with no role or behaviour of its own. */
export class ContainerWidget extends Widget<HTMLDivElement> {
    /** @param classNames - Class names to add. */
    constructor(...classNames: string[]) {
        super(createElement('div'));
        if (classNames.length > 0) this.addClass(...classNames);
    }

    protected override destructor() {
        // Nothing to destroy.
    }
}
