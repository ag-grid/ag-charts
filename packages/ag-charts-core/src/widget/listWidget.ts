import { setAttribute, setElementStyle } from '../dom/attributeUtil';
import { createElement } from '../dom/domElements';
import type { ButtonWidget } from './buttonWidget';
import type { DescriptionWidget } from './descriptionWidget';
import { RovingTabContainerWidget } from './rovingTabContainerWidget';
import { type BeforeWidget, Widget } from './widget';

type TChildWidget = ButtonWidget;

function removeFromDOM(child: Widget) {
    const elem = child.getElement();
    if (elem.parentElement) {
        elem.parentElement.remove();
    } else {
        elem.remove();
    }
}

export class ListWidget extends RovingTabContainerWidget<TChildWidget> {
    private description?: DescriptionWidget;

    constructor() {
        super('both', 'list');
        this.setHidden(true);
    }

    protected override destructor(): void {
        for (const child of this.children) {
            removeFromDOM(child);
        }
        this.description?.destroy();
        this.description = undefined;
    }

    /**
     * Appends a description that the list items reference with `aria-describedby`. It is not a list item, so it is
     * not part of the roving tab order, and the list owns it: destroying the list destroys it.
     */
    setDescription(description: DescriptionWidget) {
        this.description?.destroy();
        this.description = description;
        this.elem.append(description.getElement());
    }

    protected override addChildToDOM(child: TChildWidget, before: BeforeWidget<TChildWidget> | undefined) {
        const listItem: HTMLDivElement = createElement('div');
        setAttribute(listItem, 'role', 'listitem');
        setElementStyle(listItem, 'position', 'absolute');
        Widget.setElementContainer(child, listItem);
        this.appendOrInsert(listItem, before);
    }

    protected override removeChildFromDOM(child: TChildWidget) {
        removeFromDOM(child);
    }

    protected override onChildAdded(child: TChildWidget): void {
        super.onChildAdded(child);
        this.setHidden(false);
    }

    protected override onChildRemoved(removedChild: TChildWidget): void {
        super.onChildRemoved(removedChild);
        this.setHidden(this.children.length === 0);
    }
}
