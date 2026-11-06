import { describe, expect, it } from 'vitest';

import { MenuWidget } from './menuWidget';

describe('MenuWidget.addSeparator', () => {
    it('appends a separator widget in the menu document', () => {
        const menu = new MenuWidget();
        const sep = menu.addSeparator();
        sep.addClass('divider');

        const elem = sep.getElement();
        expect(elem.getAttribute('role')).toBe('separator');
        expect(elem.className).toBe('divider');
        expect(menu.getElement().lastElementChild).toBe(elem);
        expect(elem.ownerDocument).toBe(menu.getElement().ownerDocument);
        expect(sep.parent).toBeUndefined();
    });

    it('is removed by clear()', () => {
        const menu = new MenuWidget();
        menu.addSeparator();
        menu.clear();
        expect(menu.getElement().childElementCount).toBe(0);
    });
});
