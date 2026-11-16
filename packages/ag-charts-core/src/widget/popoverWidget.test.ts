import { describe, expect, it } from 'vitest';

import { CollapseMode } from './collapseMode';
import { ContainerWidget } from './containerWidget';
import { MenuItemWidget } from './menuItemWidget';
import { MenuWidget } from './menuWidget';
import { PopoverWidget } from './popoverWidget';
import { clickEventFrom, createOpener } from './test/openerFixtures';
import { TextSpanWidget } from './textSpanWidget';
import type { Widget } from './widget';

function createHostedPopover() {
    const host = document.createElement('div');
    document.body.append(host);
    return new PopoverWidget(host);
}

describe('PopoverWidget', () => {
    it('creates a presentational div', () => {
        const elem = new PopoverWidget().getElement();
        expect(elem.tagName).toBe('DIV');
        expect(elem.getAttribute('role')).toBe('presentation');
    });

    it('uses a host element as a presentational root', () => {
        const host = document.createElement('div');
        const popover = new PopoverWidget(host);
        expect(popover.getElement()).toBe(host);
        expect(host.getAttribute('role')).toBe('presentation');
    });

    it('refuses to show a panel before it is attached', () => {
        const popover = new PopoverWidget();
        expect(() => popover.showPanel(new ContainerWidget(), {})).toThrow(
            'Can not show popover that has not been attached to a parent.'
        );
    });

    it('styles and shows a panel', () => {
        const popover = createHostedPopover();
        const panel = new ContainerWidget();
        popover.showPanel(panel, { ariaLabel: 'Colours', class: 'ag-charts-menu', minWidth: 120 });

        const elem = panel.getElement();
        expect(popover.getPanel()).toBe(panel);
        expect(elem.parentElement).toBe(popover.getElement());
        expect(elem.className).toBe('ag-charts-popover ag-charts-menu');
        expect(elem.getAttribute('aria-label')).toBe('Colours');
        expect(elem.style.minWidth).toBe('120px');
    });

    it('leaves unset panel options off the panel', () => {
        const popover = createHostedPopover();
        const panel = new ContainerWidget();
        popover.showPanel(panel, {});

        const elem = panel.getElement();
        expect(elem.className).toBe('ag-charts-popover');
        expect(elem.hasAttribute('aria-label')).toBe(false);
        expect(elem.style.minWidth).toBe('');
    });

    describe('borrowed children', () => {
        it('shows children inside a new panel', () => {
            const popover = createHostedPopover();
            const first = new TextSpanWidget('First');
            const second = new TextSpanWidget('Second');
            const panel = popover.showChildren([first, second], { class: 'ag-charts-dialog' });

            expect(popover.getPanel()).toBe(panel);
            expect(panel.getElement().className).toBe('ag-charts-popover ag-charts-dialog');
            expect(Array.from(panel.getElement().children)).toEqual([first.getElement(), second.getElement()]);
        });

        it('hands the children back without destroying them when the panel is removed', () => {
            const popover = createHostedPopover();
            const child = new TextSpanWidget('Child');
            let destroyed = false;
            child.destroyListener = () => (destroyed = true);
            const panel = popover.showChildren([child], {});

            popover.removePanel();

            expect(popover.getPanel()).toBeUndefined();
            expect(panel.getElement().isConnected).toBe(false);
            expect(popover.getElement().children).toHaveLength(0);
            expect(child.getElement().parentElement).toBeNull();
            expect(destroyed).toBe(false);
        });

        it('destroys the panel it made when the panel is removed', () => {
            const popover = createHostedPopover();
            const panel = popover.showChildren([new TextSpanWidget('Child')], {});
            let destroyed = false;
            panel.destroyListener = () => (destroyed = true);

            popover.removePanel();

            expect(destroyed).toBe(true);
        });

        it('lets the same children be shown again', () => {
            const popover = createHostedPopover();
            const child = new TextSpanWidget('Child');
            popover.showChildren([child], {});
            popover.removePanel();

            const panel = popover.showChildren([child], {});

            expect(child.getElement().parentElement).toBe(panel.getElement());
        });

        it('hands the children back when another panel replaces theirs', () => {
            const popover = createHostedPopover();
            const child = new TextSpanWidget('Child');
            popover.showChildren([child], {});

            const replacement = new ContainerWidget();
            popover.showPanel(replacement, {});

            expect(popover.getPanel()).toBe(replacement);
            expect(child.getElement().parentElement).toBeNull();
            expect(Array.from(popover.getElement().children)).toEqual([replacement.getElement()]);
        });

        it('hands the children back before the root is destroyed', () => {
            const popover = createHostedPopover();
            const child = new TextSpanWidget('Child');
            let destroyed = false;
            child.destroyListener = () => (destroyed = true);
            popover.showChildren([child], {});

            popover.destroy();

            expect(destroyed).toBe(false);
            expect(child.getElement().parentElement).toBeNull();
        });
    });

    describe('owned panel', () => {
        it('destroys the panel when the panel is removed', () => {
            const popover = createHostedPopover();
            const panel = new ContainerWidget();
            let destroyed = 0;
            panel.destroyListener = () => destroyed++;
            popover.showPanel(panel, {});

            popover.removePanel();

            expect(popover.getPanel()).toBeUndefined();
            expect(panel.getElement().isConnected).toBe(false);
            expect(destroyed).toBe(1);
        });

        it('destroys the panel when another panel replaces it', () => {
            const popover = createHostedPopover();
            const panel = new ContainerWidget();
            let destroyed = 0;
            panel.destroyListener = () => destroyed++;
            popover.showPanel(panel, {});

            const replacement = new ContainerWidget();
            popover.showPanel(replacement, {});

            expect(destroyed).toBe(1);
            expect(Array.from(popover.getElement().children)).toEqual([replacement.getElement()]);
        });

        it('destroys the panel when the root is destroyed', () => {
            const popover = createHostedPopover();
            const panel = new ContainerWidget();
            let destroyed = 0;
            panel.destroyListener = () => destroyed++;
            popover.showPanel(panel, {});

            popover.destroy();

            expect(destroyed).toBe(1);
            expect(popover.getElement().isConnected).toBe(false);
        });

        describe('menu panel', () => {
            function showMenu(popover: PopoverWidget) {
                const menu = new MenuWidget();
                menu.addChild(new MenuItemWidget());
                popover.showPanel(menu, {});
                menu.expand({ sourceEvent: clickEventFrom(createOpener(true)) });
                return menu;
            }

            it('is already gone from the popover when its destruction collapses it', () => {
                const popover = createHostedPopover();
                const menu = showMenu(popover);
                const panelsSeenOnCollapse: Array<Widget | undefined> = [];
                menu.addListener('collapse-widget', () => panelsSeenOnCollapse.push(popover.getPanel()));

                popover.removePanel();

                expect(panelsSeenOnCollapse).toEqual([undefined]);
            });

            it('is destroyed once when it closes and its collapse removes it from the popover', () => {
                const popover = createHostedPopover();
                const menu = showMenu(popover);
                let destroyed = 0;
                menu.destroyListener = () => destroyed++;
                let collapses = 0;
                menu.addListener('collapse-widget', () => {
                    collapses++;
                    popover.removePanel();
                });

                menu.collapse({ mode: CollapseMode.CLOSE });

                expect(collapses).toBe(1);
                expect(destroyed).toBe(1);
                expect(popover.getPanel()).toBeUndefined();
            });
        });
    });

    describe('attached child popovers', () => {
        it('lets a detached popover show a panel once it is attached to a parent', () => {
            const parent = createHostedPopover();
            const child = new PopoverWidget();
            child.attachTo(parent);

            expect(() => child.showPanel(new ContainerWidget(), {})).not.toThrow();
            expect(child.getElement().parentElement).toBe(parent.getElement());
        });

        it('stacks a child popover after the parent panel it was attached over', () => {
            const parent = createHostedPopover();
            const parentPanel = new ContainerWidget();
            parent.showPanel(parentPanel, {});
            const child = new PopoverWidget();

            child.attachTo(parent);

            expect(Array.from(parent.getElement().children)).toEqual([parentPanel.getElement(), child.getElement()]);
        });

        it('stacks a parent panel shown after the attachment below the child popover', () => {
            const parent = createHostedPopover();
            const child = new PopoverWidget();
            child.attachTo(parent);

            const parentPanel = parent.showChildren([new TextSpanWidget('Parent')], {});

            expect(Array.from(parent.getElement().children)).toEqual([parentPanel.getElement(), child.getElement()]);
        });

        it('detaches but does not destroy a child popover when the parent is destroyed', () => {
            const parent = createHostedPopover();
            const child = new PopoverWidget();
            child.attachTo(parent);
            let destroyed = false;
            child.destroyListener = () => (destroyed = true);

            parent.destroy();

            expect(destroyed).toBe(false);
            expect(child.getElement().parentElement).toBeNull();
        });

        it('ignores a second attachment', () => {
            const parent = createHostedPopover();
            const otherParent = createHostedPopover();
            const child = new PopoverWidget();
            child.attachTo(parent);

            child.attachTo(otherParent);

            expect(child.getElement().parentElement).toBe(parent.getElement());
            expect(otherParent.getElement().children).toHaveLength(0);
        });

        it('does not attach a popover that uses a host element', () => {
            const parent = createHostedPopover();
            const hosted = createHostedPopover();

            hosted.attachTo(parent);

            expect(parent.getElement().children).toHaveLength(0);
        });
    });

    describe('focus', () => {
        function createFocusable() {
            const widget = new ContainerWidget();
            widget.setTabIndex(0);
            document.body.append(widget.getElement());
            return widget;
        }

        it('focuses the initial widget once, then returns focus to a focusable opener', () => {
            const popover = createHostedPopover();
            const opener = createOpener(true);
            const initialFocus = createFocusable();
            popover.setFocusOnOpen(clickEventFrom(opener), initialFocus);

            popover.focusInitial();
            expect(document.activeElement).toBe(initialFocus.getElement());

            createFocusable().focus();
            popover.focusInitial();
            expect(document.activeElement).not.toBe(initialFocus.getElement());

            popover.restoreFocus();
            expect(document.activeElement).toBe(opener);
        });

        it('returns focus to the opener only once', () => {
            const popover = createHostedPopover();
            const opener = createOpener(true);
            popover.setFocusOnOpen(clickEventFrom(opener), createFocusable());
            popover.restoreFocus();

            const elsewhere = createFocusable();
            elsewhere.focus();
            popover.restoreFocus();

            expect(document.activeElement).toBe(elsewhere.getElement());
        });

        it('does not return focus to a forgotten opener', () => {
            const popover = createHostedPopover();
            const opener = createOpener(true);
            popover.setFocusOnOpen(clickEventFrom(opener), createFocusable());
            const elsewhere = createFocusable();
            elsewhere.focus();

            popover.forgetOpener();
            popover.restoreFocus();

            expect(document.activeElement).toBe(elsewhere.getElement());
        });

        it('remembers nothing for an opener without a tabindex', () => {
            const popover = createHostedPopover();
            const opener = createOpener(false);
            const initialFocus = createFocusable();
            popover.setFocusOnOpen(clickEventFrom(opener), initialFocus);
            const elsewhere = createFocusable();
            elsewhere.focus();

            popover.focusInitial();
            popover.restoreFocus();

            expect(document.activeElement).toBe(elsewhere.getElement());
        });

        it('keeps the previous opener when a later one has no tabindex', () => {
            const popover = createHostedPopover();
            const opener = createOpener(true);
            const initialFocus = createFocusable();
            popover.setFocusOnOpen(clickEventFrom(opener), initialFocus);

            popover.setFocusOnOpen(clickEventFrom(createOpener(false)), createFocusable());
            popover.focusInitial();
            expect(document.activeElement).toBe(initialFocus.getElement());

            popover.restoreFocus();
            expect(document.activeElement).toBe(opener);
        });
    });
});
