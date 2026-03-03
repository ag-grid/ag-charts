import { describe, expect, it, jest } from '@jest/globals';

import { AgDocument, EventEmitter, getDocument } from 'ag-charts-core';

import type { EventsHub } from '../core/eventsHub';
import { DOMManager } from './domManager';

describe('DOMManager', () => {
    const doc = new AgDocument(getDocument());

    beforeEach(() => {
        // Prevent bleed of state between tests.
        doc.head.innerHTML = '';
        (DOMManager as any).headStyles?.clear?.();
    });

    const eventsHub: EventsHub = new EventEmitter();

    describe('for normal container cases', () => {
        it('should initialize the expected DOM', () => {
            const container = doc.createElement('div');
            doc.body.append(container);

            const dm = new DOMManager(eventsHub, { styleNonce: '416d1177' }, doc, container);
            dm.addStyles('test', '.test { width: 100% }');

            expect(container).toMatchSnapshot();
            expect(doc.head).toMatchSnapshot();
        });
    });

    describe('for disconnected container cases', () => {
        it('should initialize the expected DOM', () => {
            const container = doc.createElement('div');
            const dm = new DOMManager(eventsHub, { styleNonce: '416d1171' }, doc, container);
            dm.addStyles('test', '.test { width: 100% }');

            expect(container).toMatchSnapshot();
            expect(doc.head).toMatchInlineSnapshot(`<head />`);
        });
    });

    describe('for shadow-DOM container cases', () => {
        it('should initialize the expected DOM', () => {
            const component = doc.createElement('div');
            const container = doc.createElement('div');
            doc.body.append(component);
            const shadow = component.attachShadow({ mode: 'open' });
            shadow.appendChild(container);

            const dm = new DOMManager(eventsHub, { styleNonce: '416d1177' }, doc, container);
            dm.addStyles('test', '.test { width: 100% }');

            expect(container).toMatchSnapshot();
            expect(doc.head).toMatchInlineSnapshot(`<head />`);
        });
    });

    describe('when connecting after initialisation', () => {
        it('should move styles to head when the container is attached to the document', () => {
            const container = doc.createElement('div');
            const dm = new DOMManager(eventsHub, { styleNonce: 'late-416d' }, doc, container);
            dm.addStyles('late-test', '.test { width: 100% }');

            expect(container.querySelector('style[data-ag-charts="late-test"]')).not.toBeNull();
            expect(doc.head.querySelector('style[data-ag-charts="late-test"]')).toBeNull();

            doc.body.append(container);
            dm.postRenderUpdate();

            expect(container.querySelector('style[data-ag-charts="late-test"]')).toBeNull();
            expect(doc.head.querySelector('style[data-ag-charts="late-test"]')).not.toBeNull();
            expect(doc.head.querySelector('style[data-ag-charts="ag-charts-community"]')).not.toBeNull();
        });

        it('should keep styles inside the shadow root when attached to a shadow DOM', () => {
            const component = doc.createElement('div');
            const container = doc.createElement('div');
            doc.body.append(component);
            const shadow = component.attachShadow({ mode: 'open' });

            const dm = new DOMManager(eventsHub, { styleNonce: 'late-416d' }, doc, container);
            dm.addStyles('late-test', '.test { width: 100% }');

            shadow.appendChild(container);
            dm.postRenderUpdate();

            expect(shadow.querySelector('style[data-ag-charts="late-test"]')).not.toBeNull();
            expect(shadow.querySelector('style[data-ag-charts="ag-charts-community"]')).not.toBeNull();
            expect(doc.head.querySelector('style[data-ag-charts="late-test"]')).toBeNull();
            expect(doc.head.querySelector('style[data-ag-charts="ag-charts-community"]')).toBeNull();
        });
    });

    describe('getBoundingClientRect() caching', () => {
        it('should return the same object reference on repeated calls', () => {
            const container = doc.createElement('div');
            doc.body.append(container);
            const dm = new DOMManager(eventsHub, {}, doc, container);

            const rect1 = dm.getBoundingClientRect();
            const rect2 = dm.getBoundingClientRect();
            expect(rect1).toBe(rect2);
        });

        it('should not call element getBoundingClientRect on cache hit', () => {
            const container = doc.createElement('div');
            doc.body.append(container);
            const dm = new DOMManager(eventsHub, {}, doc, container);

            const canvasEl = dm.getParent('canvas');
            const spy = jest.spyOn(canvasEl, 'getBoundingClientRect');

            // First call populates cache
            dm.getBoundingClientRect();
            const callCount = spy.mock.calls.length;

            // Second call should be a cache hit
            dm.getBoundingClientRect();
            expect(spy.mock.calls.length).toBe(callCount);
        });

        it('should invalidate cache after scroll event', () => {
            const container = doc.createElement('div');
            doc.body.append(container);
            const dm = new DOMManager(eventsHub, {}, doc, container);

            const rect1 = dm.getBoundingClientRect();
            doc.window.dispatchEvent(new Event('scroll'));
            const rect2 = dm.getBoundingClientRect();

            expect(rect1).not.toBe(rect2);
        });

        it('should invalidate cache after resize event', () => {
            const container = doc.createElement('div');
            doc.body.append(container);
            const dm = new DOMManager(eventsHub, {}, doc, container);

            const rect1 = dm.getBoundingClientRect();
            doc.window.dispatchEvent(new Event('resize'));
            const rect2 = dm.getBoundingClientRect();

            expect(rect1).not.toBe(rect2);
        });

        it('should only make one real getBoundingClientRect call after invalidation', () => {
            const container = doc.createElement('div');
            doc.body.append(container);
            const dm = new DOMManager(eventsHub, {}, doc, container);

            const canvasEl = dm.getParent('canvas');
            // Populate cache first
            dm.getBoundingClientRect();

            const spy = jest.spyOn(canvasEl, 'getBoundingClientRect');

            // Invalidate
            doc.window.dispatchEvent(new Event('scroll'));

            // Two calls after invalidation
            dm.getBoundingClientRect();
            dm.getBoundingClientRect();

            // Only one real call (re-populates cache, then cache hits)
            expect(spy).toHaveBeenCalledTimes(1);
        });
    });

    describe('postRenderUpdate() flushing deferred proxies', () => {
        it('should create a proxy tracked for deferred flushing', () => {
            const container = doc.createElement('div');
            doc.body.append(container);
            const dm = new DOMManager(eventsHub, {}, doc, container);

            const proxy = dm.addDeferredProxyChild('canvas-overlay', 'test-proxy');
            expect(proxy).toBeDefined();
        });

        it('should not apply buffered writes to DOM before postRenderUpdate', () => {
            const container = doc.createElement('div');
            doc.body.append(container);
            const dm = new DOMManager(eventsHub, {}, doc, container);

            const proxy = dm.addDeferredProxyChild('canvas-overlay', 'test-proxy');
            proxy.setProperty('left', '10px');

            const childEl = dm.getParent('canvas-overlay').querySelector('div');
            expect(childEl!.style.getPropertyValue('left')).toBe('');
        });

        it('should apply buffered writes after postRenderUpdate', () => {
            const container = doc.createElement('div');
            doc.body.append(container);
            const dm = new DOMManager(eventsHub, {}, doc, container);

            const proxy = dm.addDeferredProxyChild('canvas-overlay', 'test-proxy');
            proxy.setProperty('left', '10px');

            dm.postRenderUpdate();

            const childEl = dm.getParent('canvas-overlay').querySelector('div');
            expect(childEl!.style.getPropertyValue('left')).toBe('10px');
        });

        it('should remove proxy from deferredProxies map on removeChild', () => {
            const container = doc.createElement('div');
            doc.body.append(container);
            const dm = new DOMManager(eventsHub, {}, doc, container);

            dm.addDeferredProxyChild('canvas-overlay', 'test-proxy');
            dm.removeChild('canvas-overlay', 'test-proxy');

            // Access private field to verify cleanup
            const deferredProxies = (dm as any).deferredProxies as Map<string, unknown>;
            expect(deferredProxies.has('canvas-overlay:test-proxy')).toBe(false);
        });
    });

    describe('updateCursor() compare-before-write', () => {
        it('should set cursor style on first call', () => {
            const container = doc.createElement('div');
            doc.body.append(container);
            const dm = new DOMManager(eventsHub, {}, doc, container);

            dm.updateCursor('test', 'pointer');
            expect(dm.getCursor()).toBe('pointer');
        });

        it('should skip DOM write when cursor is unchanged', () => {
            const container = doc.createElement('div');
            doc.body.append(container);
            const dm = new DOMManager(eventsHub, {}, doc, container);

            dm.updateCursor('test', 'pointer');

            // Spy on the element style cursor setter after the first write
            const element = (dm as any).element as HTMLElement;
            const descriptor = Object.getOwnPropertyDescriptor(CSSStyleDeclaration.prototype, 'cursor')!;
            const setter = jest.fn(descriptor.set!.bind(element.style));
            Object.defineProperty(element.style, 'cursor', {
                get: descriptor.get!.bind(element.style),
                set: setter,
                configurable: true,
            });

            dm.updateCursor('test', 'pointer');
            expect(setter).not.toHaveBeenCalled();

            // Restore
            Object.defineProperty(element.style, 'cursor', descriptor);
        });
    });
});
