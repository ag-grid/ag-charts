import { describe, expect, it } from 'vitest';

import { CollapseMode } from './collapseMode';
import { MenuItemWidget } from './menuItemWidget';
import { MenuWidget } from './menuWidget';
import { clickEventFrom, createOpener } from './test/openerFixtures';

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

describe('MenuWidget keyboard and pointer dismissal', () => {
    // Core tests cannot use the community input helpers, so dispatch the few raw events these cases need.
    function pressKey(target: Element, key: string, init: KeyboardEventInit = {}) {
        target.dispatchEvent(new KeyboardEvent('keydown', { key, code: key, bubbles: true, ...init }));
    }

    function mouseDown(target: Element) {
        target.dispatchEvent(new MouseEvent('mousedown', { button: 0, bubbles: true, composed: true }));
    }

    function createOpenMenu(host: Element | ShadowRoot = document.body) {
        const menu = new MenuWidget();
        menu.addChild(new MenuItemWidget());
        const { subMenuButton, subMenu } = menu.addSubMenu();
        subMenu.addChild(new MenuItemWidget());
        host.append(menu.getElement());
        subMenuButton.getElement().after(subMenu.getElement());

        const collapses: CollapseMode[] = [];
        menu.addListener('collapse-widget', ({ mode }) => collapses.push(mode));
        menu.expand({ sourceEvent: new Event('click') });
        return { menu, subMenuButton, subMenu, collapses };
    }

    it('closes when Escape or ArrowLeft is pressed on an item', () => {
        const escape = createOpenMenu();
        pressKey(escape.menu.getElement().firstElementChild!, 'Escape');
        expect(escape.collapses).toEqual([CollapseMode.CLOSE]);

        const arrowLeft = createOpenMenu();
        pressKey(arrowLeft.menu.getElement().firstElementChild!, 'ArrowLeft');
        expect(arrowLeft.collapses).toEqual([CollapseMode.CLOSE]);
    });

    it('ignores Escape with a modifier key', () => {
        const { menu, collapses } = createOpenMenu();

        pressKey(menu.getElement().firstElementChild!, 'Escape', { shiftKey: true });

        expect(collapses).toEqual([]);
    });

    it('opens a submenu with ArrowRight and closes only the submenu with ArrowLeft', () => {
        const { subMenuButton, subMenu, collapses } = createOpenMenu();

        pressKey(subMenuButton.getElement(), 'ArrowRight');
        const subMenuItem = subMenu.getElement().firstElementChild!;
        expect(document.activeElement).toBe(subMenuItem);

        pressKey(subMenuItem, 'ArrowLeft');
        expect(document.activeElement).toBe(subMenuButton.getElement());
        expect(collapses).toEqual([]);
    });

    it('aborts on a press outside the menu but not inside it, also within a shadow root', () => {
        const host = document.createElement('div');
        document.body.append(host);
        const shadow = host.attachShadow({ mode: 'open' });
        const elsewhere = document.createElement('div');
        shadow.append(elsewhere);
        const { menu, collapses } = createOpenMenu(shadow);

        mouseDown(menu.getElement().firstElementChild!);
        expect(collapses).toEqual([]);

        mouseDown(elsewhere);
        expect(collapses).toEqual([CollapseMode.ABORT]);
    });
});
