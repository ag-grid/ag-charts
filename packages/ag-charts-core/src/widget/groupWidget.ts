import { setAttribute } from '../dom/attributeUtil';
import { createElement } from '../dom/domElements';
import { Widget } from './widget';

export class GroupWidget extends Widget<HTMLDivElement> {
    constructor() {
        super(createElement('div'));
        setAttribute(this.elem, 'role', 'group');
    }
    protected override destructor() {
        // Nothing to destroy.
    }
}
