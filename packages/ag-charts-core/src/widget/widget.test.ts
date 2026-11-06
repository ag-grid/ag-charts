import { afterEach, describe, expect, it, vi } from 'vitest';

import { createElement } from '../dom/domElements';
import type { ElementID } from '../identity/idBranding';
import { NativeWidget } from './nativeWidget';
import type { WidgetEvent } from './widgetEvents';

function makeWidget() {
    return new NativeWidget(createElement('div'));
}

function makeEvent(target: EventTarget | null, currentTarget: EventTarget | null): Pick<WidgetEvent, 'sourceEvent'> {
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

    describe('setAriaChecked, setAriaSelected and setAriaLabelledBy', () => {
        it('writes false as the string "false" and removes the attribute when undefined', () => {
            const widget = makeWidget();
            widget.setAriaChecked(false);
            widget.setAriaSelected(true);
            widget.setAriaLabelledBy('ag-charts-label' as ElementID);
            expect(widget.getElement().getAttribute('aria-checked')).toBe('false');
            expect(widget.getElement().getAttribute('aria-selected')).toBe('true');
            expect(widget.getElement().getAttribute('aria-labelledby')).toBe('ag-charts-label');

            widget.setAriaChecked(undefined);
            widget.setAriaSelected(undefined);
            widget.setAriaLabelledBy(undefined);
            expect(widget.getElement().hasAttribute('aria-checked')).toBe(false);
            expect(widget.getElement().hasAttribute('aria-selected')).toBe(false);
            expect(widget.getElement().hasAttribute('aria-labelledby')).toBe(false);
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
        it('compares the source event target and current target with the element', () => {
            const parent = makeWidget();
            const child = makeWidget();
            parent.addChild(child);
            const parentElem = parent.getElement();
            const childElem = child.getElement();

            const bubbled = makeEvent(childElem, parentElem);
            expect(parent.isEventTarget(bubbled)).toBe(false);
            expect(parent.isEventCurrentTarget(bubbled)).toBe(true);
            expect(child.isEventTarget(bubbled)).toBe(true);
            expect(child.isEventCurrentTarget(bubbled)).toBe(false);

            const direct = makeEvent(parentElem, parentElem);
            expect(parent.isEventTarget(direct)).toBe(true);
            expect(parent.isEventCurrentTarget(direct)).toBe(true);

            const detached = makeEvent(null, null);
            expect(parent.isEventTarget(detached)).toBe(false);
            expect(parent.isEventCurrentTarget(detached)).toBe(false);
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
        it('query the matching CSS pseudo-class', () => {
            const widget = makeWidget();
            const matches = vi.spyOn(widget.getElement(), 'matches').mockImplementation((s) => s === ':hover');

            expect(widget.isHovered()).toBe(true);
            expect(widget.isFocusVisible()).toBe(false);
            expect(matches.mock.calls).toEqual([[':hover'], [':focus-visible']]);
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

    describe('setCssOffset', () => {
        // jsdom ignores `right: unset` and `bottom: unset`, so only left and top are observable here.
        it('sets left and top in pixels', () => {
            const widget = makeWidget();
            widget.setCssOffset({ x: 12, y: 34.5 });
            const { style } = widget.getElement();
            expect(style.left).toBe('12px');
            expect(style.top).toBe('34.5px');
        });

        it('keeps the current value of an omitted coordinate', () => {
            const widget = makeWidget();
            widget.setCssOffset({ x: 10, y: 20 });
            widget.setCssOffset({ y: 30 });
            expect(widget.cssLeft()).toBe(10);
            expect(widget.cssTop()).toBe(30);
        });
    });

    describe('setMinWidth', () => {
        it('sets and removes min-width in pixels', () => {
            const widget = makeWidget();
            widget.setMinWidth(200);
            expect(widget.getElement().style.minWidth).toBe('200px');
            widget.setMinWidth(undefined);
            expect(widget.getElement().style.minWidth).toBe('');
        });
    });

    describe('setWidth', () => {
        it('sets and removes width in pixels', () => {
            const widget = makeWidget();
            widget.setWidth(120);
            expect(widget.getElement().style.width).toBe('120px');
            widget.setWidth(undefined);
            expect(widget.getElement().style.width).toBe('');
        });
    });

    describe('setMaxWidth', () => {
        it('sets and removes max-width in pixels', () => {
            const widget = makeWidget();
            widget.setMaxWidth(300.5);
            expect(widget.getElement().style.maxWidth).toBe('300.5px');
            widget.setMaxWidth(undefined);
            expect(widget.getElement().style.maxWidth).toBe('');
        });
    });

    describe('setTextAlign', () => {
        it('sets and removes text-align', () => {
            const widget = makeWidget();
            widget.setTextAlign('right');
            expect(widget.getElement().style.textAlign).toBe('right');
            widget.setTextAlign(undefined);
            expect(widget.getElement().style.textAlign).toBe('');
        });
    });

    describe('removeChildWidget', () => {
        it('leaves the other children alone when the widget is no longer a child', () => {
            const parent = makeWidget();
            const first = makeWidget();
            const second = makeWidget();
            parent.addChild(first);
            parent.addChild(second);

            first.remove();
            first.remove();

            expect(Array.from(parent.getElement().children)).toEqual([second.getElement()]);
            second.remove();
            expect(parent.getElement().children.length).toBe(0);
        });
    });
});
