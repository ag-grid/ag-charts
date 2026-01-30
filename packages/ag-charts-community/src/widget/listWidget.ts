import { type AgDocumentLike, setAttribute, setElementStyle } from 'ag-charts-core';

import { RovingTabContainerWidget } from './rovingTabContainerWidget';
import type { SwitchWidget } from './switchWidget';
import { type BeforeWidget, Widget } from './widget';

type TChildWidget = SwitchWidget;

export class ListWidget extends RovingTabContainerWidget<TChildWidget> {
    constructor(document?: AgDocumentLike) {
        super('both', 'list', document);
        this.setHidden(true);
    }

    protected override destructor(): void {
        for (const c of this.children) {
            c.getElement().parentElement!.remove();
        }
    }

    protected override addChildToDOM(child: TChildWidget, before: BeforeWidget<TChildWidget> | undefined) {
        const listItem: HTMLDivElement = this.elem.ownerDocument.createElement('div');
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
