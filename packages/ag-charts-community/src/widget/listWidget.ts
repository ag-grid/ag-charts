import { createElement } from '../core';
import { setAttribute, setElementStyle } from '../util/attributeUtil';
import { RovingTabContainerWidget } from './rovingTabContainerWidget';
import { type BeforeWidget, Widget } from './widget';

type TChildWidget = Parameters<RovingTabContainerWidget['addChildToDOM']>[0];

export class ListWidget extends RovingTabContainerWidget {
    constructor() {
        super('both', 'list');
        this.setHidden(true);
    }

    protected override destructor(): void {
        this.children.forEach((c) => c.getElement().parentElement!.remove());
    }

    protected override addChildToDOM(child: TChildWidget, before: BeforeWidget<TChildWidget> | undefined) {
        const listItem: HTMLDivElement = createElement('div');
        setAttribute(listItem, 'role', 'listitem');
        setElementStyle(listItem, 'position', 'absolute');
        Widget.setElementContainer(child, listItem);
        this.appendOrInsert(listItem, before);
        this.setHidden(false);
    }

    protected override removeChildFromDOM(child: TChildWidget) {
        child.getElement().parentElement!.remove();
        this.setHidden(this.children.length === 0);
    }

    override setHidden(hidden: boolean) {
        if (this.children.length === 0) {
            hidden = true;
        }
        super.setHidden(hidden);
    }
}
