import { afterEach, describe, expect, it } from 'vitest';

import { ButtonWidget } from './buttonWidget';
import { ListWidget } from './listWidget';

function children(list: ListWidget): ButtonWidget[] {
    return [...list.iterateChildren()];
}

describe('ListWidget', () => {
    let list: ListWidget;

    afterEach(() => list?.destroy());

    function createList(length: number) {
        list = new ListWidget();
        document.body.append(list.getElement());
        list.resize(length, () => new ButtonWidget());
        return list;
    }

    it('resize grows and shrinks the list', () => {
        createList(3);
        expect(children(list)).toHaveLength(3);
        expect(list.getElement().querySelectorAll('[role="listitem"] button')).toHaveLength(3);

        list.resize(1, () => new ButtonWidget());
        expect(children(list)).toHaveLength(1);
        expect(list.getElement().querySelectorAll('[role="listitem"] button')).toHaveLength(1);
    });

    it('clear removes every child', () => {
        createList(4);
        list.clear();
        expect(children(list)).toHaveLength(0);
        expect(list.getElement().querySelectorAll('button')).toHaveLength(0);
    });

    it('resize(0) then regrowing leaves every child in the document', () => {
        createList(4);
        list.resize(0, () => new ButtonWidget());
        list.resize(4, () => new ButtonWidget());
        expect(children(list)).toHaveLength(4);
        expect(children(list).every((child) => child.getElement().isConnected)).toBe(true);
        expect(children(list).map((child) => child.index)).toEqual([0, 1, 2, 3]);
    });

    it('setRovingTabIndex applies to children added later', () => {
        list = new ListWidget();
        document.body.append(list.getElement());
        list.setRovingTabIndex(-1);
        list.resize(3, () => new ButtonWidget());
        expect(children(list).map((child) => child.getElement().getAttribute('tabindex'))).toEqual(['-1', '-1', '-1']);

        list.setRovingTabIndex(0);
        expect(children(list).map((child) => child.getElement().getAttribute('tabindex'))).toEqual(['0', '-1', '-1']);
    });
});
