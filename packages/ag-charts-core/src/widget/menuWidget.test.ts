import { describe, expect, it } from 'vitest';

import { CollapseMode } from './collapseMode';
import { MenuItemWidget } from './menuItemWidget';
import { MenuWidget } from './menuWidget';
import { clickEventFrom, createOpener, pressKey } from './test/openerFixtures';

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
    // Core tests cannot use the community input helpers, and this is the only file that presses the mouse on a plain
    // element (outside any widget), so it keeps its own raw dispatch.
    function mouseDown(target: Element) {
        target.dispatchEvent(new MouseEvent('mousedown', { button: 0, bubbles: true, composed: true }));
    }

    function createOpenMenu(host: Element | ShadowRoot = document.body) {
        const menu = new MenuWidget();
        const item = new MenuItemWidget();
        menu.addChild(item);
        const { subMenuButton, subMenu } = menu.addSubMenu();
        const subMenuItem = new MenuItemWidget();
        subMenu.addChild(subMenuItem);
        subMenu.addListener('expand-widget', () => subMenuButton.insertSiblingAfter(subMenu));
        host.append(menu.getElement());

        const collapses: CollapseMode[] = [];
        menu.addListener('collapse-widget', ({ mode }) => collapses.push(mode));
        menu.expand({ sourceEvent: new Event('click') });
        return { menu, item, subMenuButton, subMenuItem, collapses };
    }

    function createOpenMenuInShadowRoot() {
        const host = document.createElement('div');
        document.body.append(host);
        const shadow = host.attachShadow({ mode: 'open' });
        const elsewhere = document.createElement('div');
        shadow.append(elsewhere);
        return { ...createOpenMenu(shadow), elsewhere };
    }

    it('closes when Escape is pressed on an item', () => {
        const { item, collapses } = createOpenMenu();

        pressKey(item, 'Escape');

        expect(collapses).toEqual([CollapseMode.CLOSE]);
    });

    it('closes when ArrowLeft is pressed on an item', () => {
        const { item, collapses } = createOpenMenu();

        pressKey(item, 'ArrowLeft');

        expect(collapses).toEqual([CollapseMode.CLOSE]);
    });

    it('ignores Escape with a modifier key', () => {
        const { item, collapses } = createOpenMenu();

        pressKey(item, 'Escape', { shiftKey: true });

        expect(collapses).toEqual([]);
    });

    it('opens a submenu with ArrowRight and closes only the submenu with ArrowLeft', () => {
        const { subMenuButton, subMenuItem, collapses } = createOpenMenu();

        pressKey(subMenuButton, 'ArrowRight', { code: 'ArrowRight' });
        expect(document.activeElement).toBe(subMenuItem.getElement());

        pressKey(subMenuItem, 'ArrowLeft');
        expect(document.activeElement).toBe(subMenuButton.getElement());
        expect(collapses).toEqual([]);
    });

    it('stays open on a press inside the menu within a shadow root', () => {
        const { item, collapses } = createOpenMenuInShadowRoot();

        mouseDown(item.getElement());

        expect(collapses).toEqual([]);
    });

    it('aborts on a press outside the menu within a shadow root', () => {
        const { elsewhere, collapses } = createOpenMenuInShadowRoot();

        mouseDown(elsewhere);

        expect(collapses).toEqual([CollapseMode.ABORT]);
    });
});
