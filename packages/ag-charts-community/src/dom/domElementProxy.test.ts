import { describe, expect, it, jest } from '@jest/globals';

import type { Size, SizeMonitor } from '../util/sizeMonitor';
import { DOMElementProxy } from './domElementProxy';

function createElement(): HTMLDivElement {
    const el = document.createElement('div');
    document.body.appendChild(el);
    return el;
}

describe('DOMElementProxy', () => {
    afterEach(() => {
        document.body.innerHTML = '';
    });

    describe('changed()', () => {
        it('should return true on first call', () => {
            const proxy = new DOMElementProxy(createElement());
            expect(proxy.changed('p:left', 'value')).toBe(true);
        });

        it('should return false on same value', () => {
            const proxy = new DOMElementProxy(createElement());
            proxy.changed('p:left', 'value');
            expect(proxy.changed('p:left', 'value')).toBe(false);
        });

        it('should return true when value differs', () => {
            const proxy = new DOMElementProxy(createElement());
            proxy.changed('p:left', 'a');
            expect(proxy.changed('p:left', 'b')).toBe(true);
        });

        it('should use reference equality for objects', () => {
            const proxy = new DOMElementProxy(createElement());
            const obj = { x: 1 };
            proxy.changed('p:left', obj);
            // Same reference => no change
            expect(proxy.changed('p:left', obj)).toBe(false);
            // Different reference with same content => changed
            expect(proxy.changed('p:left', { x: 1 })).toBe(true);
        });
    });

    describe('setProperty()', () => {
        it('should call element.style.setProperty on first write', () => {
            const el = createElement();
            const spy = jest.spyOn(el.style, 'setProperty');
            const proxy = new DOMElementProxy(el);

            proxy.setProperty('left', '10px');
            expect(spy).toHaveBeenCalledWith('left', '10px');
        });

        it('should skip write when value is unchanged', () => {
            const el = createElement();
            const spy = jest.spyOn(el.style, 'setProperty');
            const proxy = new DOMElementProxy(el);

            proxy.setProperty('left', '10px');
            spy.mockClear();

            proxy.setProperty('left', '10px');
            expect(spy).not.toHaveBeenCalled();
        });

        it('should write again when value differs', () => {
            const el = createElement();
            const spy = jest.spyOn(el.style, 'setProperty');
            const proxy = new DOMElementProxy(el);

            proxy.setProperty('left', '10px');
            spy.mockClear();

            proxy.setProperty('left', '20px');
            expect(spy).toHaveBeenCalledWith('left', '20px');
        });
    });

    describe('toggleClass()', () => {
        it('should call element.classList.toggle on first write', () => {
            const el = createElement();
            const spy = jest.spyOn(el.classList, 'toggle');
            const proxy = new DOMElementProxy(el);

            proxy.toggleClass('active', true);
            expect(spy).toHaveBeenCalledWith('active', true);
        });

        it('should skip when force value is unchanged', () => {
            const el = createElement();
            const spy = jest.spyOn(el.classList, 'toggle');
            const proxy = new DOMElementProxy(el);

            proxy.toggleClass('active', true);
            spy.mockClear();

            proxy.toggleClass('active', true);
            expect(spy).not.toHaveBeenCalled();
        });
    });

    describe('setAttr()', () => {
        it('should call setAttribute for non-null value', () => {
            const el = createElement();
            const spy = jest.spyOn(el, 'setAttribute');
            const proxy = new DOMElementProxy(el);

            proxy.setAttr('role', 'tooltip');
            expect(spy).toHaveBeenCalledWith('role', 'tooltip');
        });

        it('should call removeAttribute for null value', () => {
            const el = createElement();
            const spy = jest.spyOn(el, 'removeAttribute');
            const proxy = new DOMElementProxy(el);

            proxy.setAttr('role', null);
            expect(spy).toHaveBeenCalledWith('role');
        });

        it('should skip duplicate setAttribute calls', () => {
            const el = createElement();
            const spy = jest.spyOn(el, 'setAttribute');
            const proxy = new DOMElementProxy(el);

            proxy.setAttr('role', 'tooltip');
            spy.mockClear();

            proxy.setAttr('role', 'tooltip');
            expect(spy).not.toHaveBeenCalled();
        });

        it('should skip duplicate removeAttribute calls', () => {
            const el = createElement();
            const spy = jest.spyOn(el, 'removeAttribute');
            const proxy = new DOMElementProxy(el);

            proxy.setAttr('role', null);
            spy.mockClear();

            proxy.setAttr('role', null);
            expect(spy).not.toHaveBeenCalled();
        });
    });

    describe('setInnerHTML()', () => {
        it('should return true when content changes', () => {
            const proxy = new DOMElementProxy(createElement());
            expect(proxy.setInnerHTML('<b>hello</b>')).toBe(true);
        });

        it('should return false when content is unchanged', () => {
            const proxy = new DOMElementProxy(createElement());
            proxy.setInnerHTML('<b>hello</b>');
            expect(proxy.setInnerHTML('<b>hello</b>')).toBe(false);
        });

        it('should invalidate contentStyles cache', () => {
            const el = createElement();
            const proxy = new DOMElementProxy(el);

            proxy.setContentStyles({ color: 'red' });
            proxy.setInnerHTML('<span>new</span>');

            // After innerHTML change, setContentStyles should re-apply even with same styles
            const spy = jest.spyOn(Object, 'assign');
            proxy.setContentStyles({ color: 'red' });
            expect(spy).toHaveBeenCalled();
            spy.mockRestore();
        });
    });

    describe('setContentStyles()', () => {
        it('should apply styles to the first child element', () => {
            const el = createElement();
            el.innerHTML = '<span></span>';
            const proxy = new DOMElementProxy(el);

            proxy.setContentStyles({ color: 'red' });
            expect((el.firstElementChild as HTMLElement).style.color).toBe('red');
        });

        it('should apply styles to self when no children exist', () => {
            const el = createElement();
            const proxy = new DOMElementProxy(el);

            proxy.setContentStyles({ color: 'blue' });
            expect(el.style.color).toBe('blue');
        });

        it('should skip when styles are unchanged (JSON comparison)', () => {
            const el = createElement();
            el.innerHTML = '<span></span>';
            const proxy = new DOMElementProxy(el);

            proxy.setContentStyles({ color: 'red' });
            const spy = jest.spyOn(Object, 'assign');

            proxy.setContentStyles({ color: 'red' });
            expect(spy).not.toHaveBeenCalled();
            spy.mockRestore();
        });
    });

    describe('deferred mode', () => {
        it('should not apply setProperty to element before flush', () => {
            const el = createElement();
            const proxy = new DOMElementProxy(el, { deferred: true });

            proxy.setProperty('left', '10px');
            expect(el.style.getPropertyValue('left')).toBe('');
        });

        it('should apply setProperty after flush', () => {
            const el = createElement();
            const proxy = new DOMElementProxy(el, { deferred: true });

            proxy.setProperty('left', '10px');
            proxy.flush();
            expect(el.style.getPropertyValue('left')).toBe('10px');
        });

        it('should not apply toggleClass before flush', () => {
            const el = createElement();
            const proxy = new DOMElementProxy(el, { deferred: true });

            proxy.toggleClass('active', true);
            expect(el.classList.contains('active')).toBe(false);
        });

        it('should apply toggleClass after flush', () => {
            const el = createElement();
            const proxy = new DOMElementProxy(el, { deferred: true });

            proxy.toggleClass('active', true);
            proxy.flush();
            expect(el.classList.contains('active')).toBe(true);
        });

        it('should not apply setAttr before flush', () => {
            const el = createElement();
            const proxy = new DOMElementProxy(el, { deferred: true });

            proxy.setAttr('role', 'tooltip');
            expect(el.hasAttribute('role')).toBe(false);
        });

        it('should apply setAttr after flush', () => {
            const el = createElement();
            const proxy = new DOMElementProxy(el, { deferred: true });

            proxy.setAttr('role', 'tooltip');
            proxy.flush();
            expect(el.getAttribute('role')).toBe('tooltip');
        });

        it('should not apply setInnerHTML before flush', () => {
            const el = createElement();
            const proxy = new DOMElementProxy(el, { deferred: true });

            proxy.setInnerHTML('<b>hello</b>');
            expect(el.innerHTML).toBe('');
        });

        it('should apply setInnerHTML after flush', () => {
            const el = createElement();
            const proxy = new DOMElementProxy(el, { deferred: true });

            proxy.setInnerHTML('<b>hello</b>');
            proxy.flush();
            expect(el.innerHTML).toBe('<b>hello</b>');
        });

        it('should return cached innerHTML value in deferred mode', () => {
            const el = createElement();
            const proxy = new DOMElementProxy(el, { deferred: true });

            proxy.setInnerHTML('<b>cached</b>');
            // Before flush, innerHTML getter returns cached value
            expect(proxy.innerHTML).toBe('<b>cached</b>');
            // But DOM is unchanged
            expect(el.innerHTML).toBe('');
        });

        it('should skip redundant writes in deferred mode', () => {
            const el = createElement();
            const spy = jest.spyOn(el.style, 'setProperty');
            const proxy = new DOMElementProxy(el, { deferred: true });

            proxy.setProperty('left', '10px');
            proxy.setProperty('left', '10px'); // duplicate — should not buffer again
            proxy.flush();

            // Only one setProperty call after flush
            expect(spy).toHaveBeenCalledTimes(1);
        });

        it('should deduplicate writes to the same property, applying only the last value', () => {
            const el = createElement();
            const spy = jest.spyOn(el.style, 'setProperty');
            const proxy = new DOMElementProxy(el, { deferred: true });

            proxy.setProperty('left', '10px');
            proxy.invalidate('p:left'); // force cache miss so next write is accepted
            proxy.setProperty('left', '20px');
            proxy.invalidate('p:left');
            proxy.setProperty('left', '30px');
            proxy.flush();

            // Only one DOM write should happen — the last value wins
            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy).toHaveBeenCalledWith('left', '30px');
        });

        it('should clear pending writes after flush', () => {
            const el = createElement();
            const spy = jest.spyOn(el.style, 'setProperty');
            const proxy = new DOMElementProxy(el, { deferred: true });

            proxy.setProperty('left', '10px');
            proxy.flush();
            spy.mockClear();

            // Second flush should be a no-op
            proxy.flush();
            expect(spy).not.toHaveBeenCalled();
        });

        it('flushKey() should apply only the specified pending write', () => {
            const el = createElement();
            const proxy = new DOMElementProxy(el, { deferred: true });

            proxy.setProperty('left', '10px');
            proxy.setProperty('top', '20px');
            proxy.flushKey('p:left');

            expect(el.style.left).toBe('10px'); // flushed
            expect(el.style.top).toBe(''); // not flushed yet
        });

        it('flushKey() should remove the key from pendingWrites so flush() does not re-apply it', () => {
            const el = createElement();
            const spy = jest.spyOn(el.style, 'setProperty');
            const proxy = new DOMElementProxy(el, { deferred: true });

            proxy.setProperty('left', '10px');
            proxy.flushKey('p:left');
            spy.mockClear();

            proxy.flush(); // should not call setProperty for 'left' again
            expect(spy).not.toHaveBeenCalledWith('left', expect.anything());
        });
    });

    describe('togglePopover()', () => {
        it('should buffer show (true) in deferred mode and apply on flush', () => {
            const el = createElement();
            const proxy = new DOMElementProxy(el, { deferred: true });

            proxy.togglePopover(true);
            expect(el.hasAttribute('data-presented-as-popover')).toBe(false); // not applied yet

            proxy.flush();
            expect(el.hasAttribute('data-presented-as-popover')).toBe(true);
        });

        it('should apply hide (false) immediately in deferred mode', () => {
            const el = createElement();
            const proxy = new DOMElementProxy(el, { deferred: true });

            proxy.togglePopover(true);
            proxy.flush(); // show it
            expect(el.hasAttribute('data-presented-as-popover')).toBe(true);

            proxy.togglePopover(false); // hide immediately
            expect(el.hasAttribute('data-presented-as-popover')).toBe(false);
        });

        it('should cancel a pending show when hide is called before flush', () => {
            const el = createElement();
            const proxy = new DOMElementProxy(el, { deferred: true });

            proxy.togglePopover(true); // queued
            proxy.togglePopover(false); // cancel + immediate hide (already hidden, no-op on DOM)

            proxy.flush(); // should not show the element
            expect(el.hasAttribute('data-presented-as-popover')).toBe(false);
        });

        it('should apply togglePopover immediately in non-deferred mode', () => {
            const el = createElement();
            const proxy = new DOMElementProxy(el);

            proxy.togglePopover(true);
            expect(el.hasAttribute('data-presented-as-popover')).toBe(true);

            proxy.togglePopover(false);
            expect(el.hasAttribute('data-presented-as-popover')).toBe(false);
        });
    });

    describe('cache lifecycle', () => {
        it('should force next changed() to return true after invalidate()', () => {
            const proxy = new DOMElementProxy(createElement());
            proxy.changed('p:left', 'value');
            expect(proxy.changed('p:left', 'value')).toBe(false);

            proxy.invalidate('p:left');
            expect(proxy.changed('p:left', 'value')).toBe(true);
        });

        it('should only invalidate the specified key', () => {
            const proxy = new DOMElementProxy(createElement());
            proxy.changed('p:top', 1);
            proxy.changed('p:width', 2);

            proxy.invalidate('p:top');
            expect(proxy.changed('p:top', 1)).toBe(true);
            expect(proxy.changed('p:width', 2)).toBe(false);
        });

        it('should clear all cached values on reset()', () => {
            const proxy = new DOMElementProxy(createElement());
            proxy.changed('p:top', 1);
            proxy.changed('p:width', 2);

            proxy.reset();
            expect(proxy.changed('p:top', 1)).toBe(true);
            expect(proxy.changed('p:width', 2)).toBe(true);
        });
    });

    describe('addResizeListener()', () => {
        it('should throw when no SizeMonitor is provided', () => {
            const proxy = new DOMElementProxy(createElement());
            expect(() => proxy.addResizeListener(() => {})).toThrow('addResizeListener requires a SizeMonitor');
        });

        it('should delegate to SizeMonitor and return unsubscribe function', () => {
            const el = createElement();
            const observeFn = jest.fn();
            const unobserveFn = jest.fn();
            const mockSizeMonitor = {
                observe: observeFn,
                unobserve: unobserveFn,
            } as unknown as SizeMonitor;

            const proxy = new DOMElementProxy(el, { sizeMonitor: mockSizeMonitor });
            const unsub = proxy.addResizeListener((_size: Size) => {});

            expect(observeFn).toHaveBeenCalledWith(el, expect.any(Function));

            unsub();
            expect(unobserveFn).toHaveBeenCalledWith(el);
        });
    });
});
