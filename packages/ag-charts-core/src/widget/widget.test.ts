import { afterEach, describe, expect, it, vi } from 'vitest';

import { createElement } from '../dom/domElements';
import { NativeWidget } from './nativeWidget';
import type { WidgetEvent } from './widgetEvents';

function makeWidget() {
    return new NativeWidget(createElement('div'));
}

function makeEvent(target: EventTarget | null, currentTarget: EventTarget | null): Pick<WidgetEvent, 'sourceEvent'> {
    // A dispatched Event resets `currentTarget` to null once dispatch ends, so the pair is faked; only these two
    // fields are read.
    return { sourceEvent: { target, currentTarget } as Event };
}

describe('Widget', () => {
    afterEach(() => {
        document.body.replaceChildren();
    });

    describe('setTitle', () => {
        it('sets and removes the title attribute', () => {
            const widget = makeWidget();
            widget.setTitle('Drag');
            expect(widget.getElement().getAttribute('title')).toBe('Drag');
            widget.setTitle(undefined);
            expect(widget.getElement().hasAttribute('title')).toBe(false);
        });
    });

    describe('setData', () => {
        it('sets and removes a data attribute by its dataset key', () => {
            const widget = makeWidget();
            widget.setData('popoverId', 'line-color');
            expect(widget.getElement().getAttribute('data-popover-id')).toBe('line-color');
            widget.setData('popoverId', undefined);
            expect(widget.getElement().hasAttribute('data-popover-id')).toBe(false);
        });

        it('keeps an empty string value', () => {
            const widget = makeWidget();
            widget.setData('agCharts', '');
            expect(widget.getElement().getAttribute('data-ag-charts')).toBe('');
        });
    });

    describe('setTranslate', () => {
        it('writes a translate transform in pixels', () => {
            const widget = makeWidget();
            widget.setTranslate(12, -3.5);
            expect(widget.getElement().style.transform).toBe('translate(12px, -3.5px)');
        });
    });

    describe('isEventTarget and isEventCurrentTarget', () => {
        it('distinguish the target from the current target of a bubbled event', () => {
            const parent = makeWidget();
            const child = makeWidget();
            parent.addChild(child);
            const bubbled = makeEvent(child.getElement(), parent.getElement());

            expect(parent.isEventTarget(bubbled)).toBe(false);
            expect(parent.isEventCurrentTarget(bubbled)).toBe(true);
            expect(child.isEventTarget(bubbled)).toBe(true);
            expect(child.isEventCurrentTarget(bubbled)).toBe(false);
        });

        it('match both for an event dispatched directly on the element', () => {
            const widget = makeWidget();
            const direct = makeEvent(widget.getElement(), widget.getElement());

            expect(widget.isEventTarget(direct)).toBe(true);
            expect(widget.isEventCurrentTarget(direct)).toBe(true);
        });

        it('match neither for an event without targets', () => {
            const widget = makeWidget();
            const detached = makeEvent(null, null);

            expect(widget.isEventTarget(detached)).toBe(false);
            expect(widget.isEventCurrentTarget(detached)).toBe(false);
        });
    });

    describe('contains', () => {
        it('reports DOM containment, including itself', () => {
            const parent = makeWidget();
            const child = makeWidget();
            const unrelated = makeWidget();
            parent.addChild(child);

            expect(parent.contains(parent)).toBe(true);
            expect(parent.contains(child)).toBe(true);
            expect(child.contains(parent)).toBe(false);
            expect(parent.contains(unrelated)).toBe(false);
        });
    });

    describe('isFocused', () => {
        it('reports whether the element is the active element', () => {
            const widget = new NativeWidget(createElement('button'));
            const other = new NativeWidget(createElement('button'));
            document.body.append(widget.getElement(), other.getElement());

            expect(widget.isFocused()).toBe(false);
            widget.focus();
            expect(widget.isFocused()).toBe(true);
            other.focus();
            expect(widget.isFocused()).toBe(false);
        });

        it('works inside a shadow root', () => {
            const host = createElement('div');
            document.body.append(host);
            const shadow = host.attachShadow({ mode: 'open' });
            const widget = new NativeWidget(createElement('button'));
            shadow.append(widget.getElement());

            widget.focus();
            expect(widget.isFocused()).toBe(true);
        });
    });

    describe('isHovered and isFocusVisible', () => {
        // jsdom has no pointer state and rejects `:focus-visible`, so only the delegation is tested here.
        it('isHovered queries :hover', () => {
            const widget = makeWidget();
            vi.spyOn(widget.getElement(), 'matches').mockImplementation((s) => s === ':hover');

            expect(widget.isHovered()).toBe(true);
            expect(widget.isFocusVisible()).toBe(false);
        });

        it('isFocusVisible queries :focus-visible', () => {
            const widget = makeWidget();
            vi.spyOn(widget.getElement(), 'matches').mockImplementation((s) => s === ':focus-visible');

            expect(widget.isHovered()).toBe(false);
            expect(widget.isFocusVisible()).toBe(true);
        });
    });

    describe('insertSiblingAfter', () => {
        it('moves the sibling element directly after this element without changing the widget tree', () => {
            const list = makeWidget();
            const first = makeWidget();
            const second = makeWidget();
            const floating = makeWidget();
            list.addChild(first);
            list.addChild(second);

            first.insertSiblingAfter(floating);

            const elems = Array.from(list.getElement().children);
            expect(elems).toEqual([first.getElement(), floating.getElement(), second.getElement()]);
            expect(floating.parent).toBeUndefined();

            second.insertSiblingAfter(floating);
            expect(list.getElement().lastElementChild).toBe(floating.getElement());
        });
    });
});
