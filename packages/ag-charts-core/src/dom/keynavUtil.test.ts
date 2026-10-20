import { afterEach, describe, expect, it, vi } from 'vitest';

import { addMouseCloseListener } from './keynavUtil';

describe('addMouseCloseListener', () => {
    let host: HTMLElement | undefined;

    afterEach(() => {
        host?.remove();
        host = undefined;
    });

    const buildMenuInShadowRoot = () => {
        host = document.createElement('div');
        document.body.append(host);
        const shadow = host.attachShadow({ mode: 'open' });
        const menu = document.createElement('div');
        const menuItem = document.createElement('button');
        const elsewhere = document.createElement('div');
        menu.append(menuItem);
        shadow.append(menu, elsewhere);
        return { menu, menuItem, elsewhere };
    };

    const press = (target: Element) =>
        target.dispatchEvent(new MouseEvent('mousedown', { button: 0, bubbles: true, composed: true }));

    describe('for a menu in a shadow root', () => {
        it('keeps the menu open when the press lands inside it', () => {
            const { menu, menuItem } = buildMenuInShadowRoot();
            const hide = vi.fn();
            const removeListener = addMouseCloseListener(menu, hide);

            press(menuItem);

            expect(hide).not.toHaveBeenCalled();
            removeListener();
        });

        it('closes the menu when the press lands elsewhere in the same shadow root', () => {
            const { menu, elsewhere } = buildMenuInShadowRoot();
            const hide = vi.fn();
            const removeListener = addMouseCloseListener(menu, hide);

            press(elsewhere);

            expect(hide).toHaveBeenCalledTimes(1);
            removeListener();
        });
    });
});
