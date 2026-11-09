import { Widget } from './widget';

export class NativeWidget<TElem extends HTMLElement = HTMLElement> extends Widget<TElem> {
    constructor(elem: TElem) {
        super(elem);
    }
    protected override destructor() {
        // Nothing to destroy.
    }
}

export class DOMManagerWidget extends NativeWidget {
    constructor(elem: HTMLElement) {
        super(elem);
    }

    protected override addChildToDOM() {
        // Adding/removing elements from the DOM is managed by the DOMManager
    }
    protected override removeChildFromDOM() {
        // Adding/removing elements from the DOM is managed by the DOMManager
    }
}
