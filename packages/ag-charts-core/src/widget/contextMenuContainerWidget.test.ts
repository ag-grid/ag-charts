import { afterEach, describe, expect, it, vi } from 'vitest';

import { createElement } from '../dom/domElements';
import { ContextMenuContainerWidget } from './contextMenuContainerWidget';
import { MenuWidget } from './menuWidget';

function makeContainer() {
    const elem = createElement('div');
    document.body.append(elem);
    return new ContextMenuContainerWidget(elem);
}

function dispatchFocusOut(target: HTMLElement, relatedTarget: EventTarget | null) {
    target.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget }));
}

describe('ContextMenuContainerWidget', () => {
    afterEach(() => {
        document.body.replaceChildren();
    });

    describe('setHidden', () => {
        it('writes an explicit display style both ways', () => {
            const container = makeContainer();
            container.setHidden(true);
            expect(container.getElement().style.display).toBe('none');
            container.setHidden(false);
            expect(container.getElement().style.display).toBe('block');
        });
    });

    describe('addFocusLeaveListener', () => {
        it('calls the listener only when focus moves to nothing or outside the container', () => {
            const container = makeContainer();
            const inner = createElement('div');
            const otherInner = createElement('div');
            const outside = createElement('div');
            container.getElement().append(inner, otherInner);
            document.body.append(outside);
            const listener = vi.fn();
            container.addFocusLeaveListener(listener);

            dispatchFocusOut(inner, otherInner);
            expect(listener).not.toHaveBeenCalled();

            dispatchFocusOut(inner, outside);
            expect(listener).toHaveBeenCalledTimes(1);

            dispatchFocusOut(inner, null);
            expect(listener).toHaveBeenCalledTimes(2);
        });

        it('returns a function that removes the listener', () => {
            const container = makeContainer();
            const listener = vi.fn();
            const remove = container.addFocusLeaveListener(listener);

            remove();
            dispatchFocusOut(container.getElement(), null);

            expect(listener).not.toHaveBeenCalled();
        });
    });

    describe('observeChildList', () => {
        it('calls the listener asynchronously after a child is added or removed', async () => {
            const container = makeContainer();
            const menu = new MenuWidget();
            const listener = vi.fn();
            container.observeChildList(listener);

            container.addChild(menu);
            expect(listener).not.toHaveBeenCalled();
            await Promise.resolve();
            expect(listener).toHaveBeenCalledTimes(1);

            menu.remove();
            await Promise.resolve();
            expect(listener).toHaveBeenCalledTimes(2);
        });

        it('stops calling the listener once the returned function is called', async () => {
            const container = makeContainer();
            const listener = vi.fn();
            const stop = container.observeChildList(listener);

            stop();
            container.addChild(new MenuWidget());
            await Promise.resolve();

            expect(listener).not.toHaveBeenCalled();
        });

        it('stops calling the listener once destroyed', async () => {
            const container = makeContainer();
            const listener = vi.fn();
            container.observeChildList(listener);

            container.destroy();
            container.getElement().append(createElement('div'));
            await Promise.resolve();

            expect(listener).not.toHaveBeenCalled();
        });
    });

    describe('setPosition and unsetVerticalPosition', () => {
        it('writes the left and top styles, with top raised by 0.5em', () => {
            const container = makeContainer();
            container.setPosition(12, 34.5);
            expect(container.getElement().style.left).toBe('12px');
            expect(container.getElement().style.top).toBe('calc(34.5px - 0.5em)');
        });

        it('unsets top and bottom without touching left', () => {
            const container = makeContainer();
            const setTop = vi.spyOn(container.getElement().style, 'top', 'set');
            container.setPosition(12, 34);

            container.unsetVerticalPosition();

            expect(setTop).toHaveBeenLastCalledWith('unset');
            expect(container.getElement().style.left).toBe('12px');
        });
    });
});
