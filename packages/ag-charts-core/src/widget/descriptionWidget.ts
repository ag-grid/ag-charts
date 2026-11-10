import { createElement } from '../dom/domElements';
import { Widget } from './widget';

/**
 * A hidden `<p>` that holds accessible description text. Other elements reference it by `id` through
 * `aria-describedby`; screen readers still read a referenced element while it is hidden.
 */
export class DescriptionWidget extends Widget<HTMLParagraphElement> {
    constructor() {
        super(createElement('p'));
        this.setHidden(true);
    }

    protected override destructor() {
        // Nothing to destroy.
    }
}
