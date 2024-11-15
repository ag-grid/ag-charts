import { setAttribute } from '../util/attributeUtil';
import { getDocument } from '../util/dom';
import { Widget } from './widget';

export class GroupWidget extends Widget<HTMLDivElement> {
    constructor() {
        super(getDocument().createElement('div'));
        setAttribute(this.elem, 'role', 'group');
    }
    protected override destructor() {
        // Nothing to destroy.
    }
}
