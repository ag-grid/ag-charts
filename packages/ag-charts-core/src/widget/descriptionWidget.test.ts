import { describe, expect, it } from 'vitest';

import { createElementId } from '../identity/id';
import { DescriptionWidget } from './descriptionWidget';
import { ListWidget } from './listWidget';

describe('DescriptionWidget', () => {
    it('creates a hidden paragraph', () => {
        const description = new DescriptionWidget();
        description.setTextContent('Press Space to toggle');
        const elem = description.getElement();
        expect(elem.tagName).toBe('P');
        expect(elem.style.display).toBe('none');
        expect(elem.textContent).toBe('Press Space to toggle');
    });
});

describe('ListWidget.setDescription', () => {
    it('appends the description inside the list without making it a list item', () => {
        const list = new ListWidget();
        const description = new DescriptionWidget();
        const id = createElementId();
        description.id = id;
        list.setDescription(description);

        const listElem = list.getElement();
        expect(listElem.querySelector(`#${id}`)).toBe(description.getElement());
        expect(description.getElement().parentElement).toBe(listElem);
        expect(listElem.querySelector('[role="listitem"]')).toBeNull();
        expect(list.isHidden()).toBe(true);
    });

    it('removes the description when the list is destroyed', () => {
        const list = new ListWidget();
        const description = new DescriptionWidget();
        list.getElement().ownerDocument.body.append(list.getElement());
        list.setDescription(description);

        list.destroy();
        expect(description.getElement().isConnected).toBe(false);
    });

    it('replaces a previous description', () => {
        const list = new ListWidget();
        const first = new DescriptionWidget();
        const second = new DescriptionWidget();
        list.setDescription(first);
        list.setDescription(second);

        expect(first.getElement().parentElement).toBeNull();
        expect(second.getElement().parentElement).toBe(list.getElement());
    });
});
