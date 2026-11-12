import { describe, expect, it } from 'vitest';

import { CollapseMode } from './collapseMode';
import { MenuItemWidget } from './menuItemWidget';
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

describe('MenuWidget opener', () => {
    // Core tests cannot use the community input helpers, so take a real click event from the opener.
    function clickEventFrom(opener: HTMLElement): Event {
        let event: Event | undefined;
        opener.addEventListener('click', (e) => (event = e), { once: true });
        opener.click();
        expect(event).toBeDefined();
        return event!;
    }

    function createOpener(focusable: boolean) {
        const opener = document.createElement('button');
        if (focusable) opener.tabIndex = 0;
        document.body.append(opener);
        return opener;
    }

    function createMenu() {
        const menu = new MenuWidget();
        menu.addChild(new MenuItemWidget());
        document.body.append(menu.getElement());
        return menu;
    }

    it('marks a focusable opener expanded while the menu is open', () => {
        const opener = createOpener(true);
        const menu = createMenu();

        menu.expand({ sourceEvent: clickEventFrom(opener) });
        expect(opener.getAttribute('aria-expanded')).toBe('true');

        menu.collapse({ mode: CollapseMode.ABORT });
        expect(opener.getAttribute('aria-expanded')).toBe('false');
    });

    it('returns focus to the opener when the menu is closed', () => {
        const opener = createOpener(true);
        const menu = createMenu();
        menu.expand({ sourceEvent: clickEventFrom(opener) });
        expect(document.activeElement).toBe(menu.getElement().firstElementChild);

        menu.collapse({ mode: CollapseMode.CLOSE });

        expect(document.activeElement).toBe(opener);
    });

    it('leaves focus in the menu when it is aborted', () => {
        const opener = createOpener(true);
        const menu = createMenu();
        menu.expand({ sourceEvent: clickEventFrom(opener) });

        menu.collapse({ mode: CollapseMode.ABORT });

        expect(document.activeElement).toBe(menu.getElement().firstElementChild);
    });

    it('ignores an opener without a tabindex', () => {
        const opener = createOpener(false);
        const menu = createMenu();
        menu.expand({ sourceEvent: clickEventFrom(opener) });

        menu.collapse({ mode: CollapseMode.CLOSE });

        expect(opener.hasAttribute('aria-expanded')).toBe(false);
        expect(document.activeElement).not.toBe(opener);
    });
});
