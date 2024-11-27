import { setAttribute, setElementStyle } from '../util/attributeUtil';
import { getDocument } from '../util/dom';
import { RovingTabContainerWidget } from './rovingTabContainerWidget';
import { type BeforeWidget, Widget } from './widget';

type TChildWidget = Parameters<RovingTabContainerWidget['addChildToDOM']>[0];

export class ListWidget extends RovingTabContainerWidget {
    constructor() {
        super('both', 'list');
    }

    protected override destructor(): void {
        this.children.forEach((c) => c.getElement().parentElement!.remove());
    }

    protected override addChildToDOM(child: TChildWidget, before: BeforeWidget<TChildWidget> | undefined) {
        const listitem: HTMLDivElement = getDocument().createElement('div');
        setAttribute(listitem, 'role', 'listitem');
        setElementStyle(listitem, 'position', 'absolute');
        Widget.setElementContainer(child, listitem);
        this.appendOrInsert(listitem, before);
        this.setHidden(false);
    }

    protected override removeChildFromDOM(child: TChildWidget) {
        child.getElement().parentElement!.remove();
        this.setHidden(this.children.length === 0);
    }
}
