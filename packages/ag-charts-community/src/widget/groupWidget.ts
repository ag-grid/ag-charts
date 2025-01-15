import { createElement } from '../core';
import { setAttribute } from '../util/attributeUtil';
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
