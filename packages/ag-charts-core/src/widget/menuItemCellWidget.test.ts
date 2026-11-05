import { describe, expect, it } from 'vitest';

import { MenuItemCellWidget } from './menuItemCellWidget';

describe('MenuItemCellWidget', () => {
    it('creates a div with the given classes', () => {
        const cell = new MenuItemCellWidget('menu__cell', 'menu__cellpadding');
        const elem = cell.getElement();
        expect(elem.tagName).toBe('DIV');
        expect(elem.className).toBe('menu__cell menu__cellpadding');
        expect(elem.attributes).toHaveLength(1);
    });

    it('creates a div with no attributes when given no classes', () => {
        const cell = new MenuItemCellWidget();
        expect(cell.getElement().attributes).toHaveLength(0);
    });
});
