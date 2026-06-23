import { createElement, setAttribute, setElementStyle } from 'ag-charts-core';

import { RovingTabContainerWidget } from './rovingTabContainerWidget';
import type { SwitchWidget } from './switchWidget';
import { type BeforeWidget, Widget } from './widget';

type TChildWidget = SwitchWidget;

function removeFromDOM(child: Widget) {
    const elem = child.getElement();
    if (elem.parentElement) {
        elem.parentElement.remove();
    } else {
        elem.remove();
    }
}

export class ListWidget extends RovingTabContainerWidget<TChildWidget> {
    constructor() {
        super('both', 'list');
        this.setHidden(true);
    }

    protected override destructor(): void {
        for (const child of this.children) {
            removeFromDOM(child);
        }
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
        removeFromDOM(child);
        this.setHidden(this.children.length === 0);
    }

    override setHidden(hidden: boolean) {
        if (this.children.length === 0) {
            hidden = true;
        }
        super.setHidden(hidden);
    }
}
