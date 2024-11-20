import { Widget } from './widget';

export class NativeWidget<TElem extends HTMLElement = HTMLElement> extends Widget<TElem> {
    constructor(elem: unknown);
    constructor(elem: TElem);
    constructor(elem: TElem) {
        super(elem);
    }
    protected override destructor() {
        // Nothing to destroy.
    }
}
