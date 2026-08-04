import { describe, expect, it, vi } from 'vitest';

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

    // Builds a chart container nested inside a scrollable ancestor whose client rect is `scrollableRect`.
    // jsdom does not implement computedStyleMap(); stub it so findScrollableContainer() detects the
    // ancestor as scrollable (overflow-y: auto).
    const buildScrollableContainer = (scrollableRect: DOMRect) => {
        const scrollable = doc.createElement('div');
        const container = doc.createElement('div');
        scrollable.append(container);
        doc.body.append(scrollable);
        (scrollable as any).computedStyleMap = () => ({ get: () => 'auto' });
        vi.spyOn(scrollable, 'getBoundingClientRect').mockReturnValue(scrollableRect);
        return container;
    };

    describe('for normal container cases', () => {
        it('should initialize the expected DOM', () => {
            const container = doc.createElement('div');
            doc.body.append(container);

            const dm = new DOMManager(eventsHub, '416d1177', doc, container);
            dm.addStyles('test', '.test { width: 100% }');

            expect(container).toMatchSnapshot();
            expect(doc.head).toMatchSnapshot();
        });
    });

    describe('for disconnected container cases', () => {
        it('should initialize the expected DOM', () => {
            const container = doc.createElement('div');
            const dm = new DOMManager(eventsHub, '416d1171', doc, container);
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

            const dm = new DOMManager(eventsHub, '416d1177', doc, container);
            dm.addStyles('test', '.test { width: 100% }');

            expect(container).toMatchSnapshot();
            expect(doc.head).toMatchInlineSnapshot(`<head />`);
        });
    });

    // These assertions guard the CSSOM declaration: the watcher transition must carry an
    // `!important` priority so it survives users globally disabling transitions. jsdom does not
    // run transitions or emit `transitionend`, so the runtime refresh path is covered by browser e2e.
    describe('updateCSSVariableWatchers() — CSS change detection', () => {
        it('sets an important transition on the sensor element (normal DOM)', () => {
            const container = doc.createElement('div');
            doc.body.append(container);
            const dm = new DOMManager(eventsHub, 'css-watch-normal', doc, container);

            dm.updateCSSVariableWatchers({ 'var(--my-color)': 'red' });

            const sensor = dm.getParent('style-sensors').firstElementChild as HTMLElement | null;
            expect(sensor).not.toBeNull();
            expect(sensor!.style.getPropertyValue('transition')).toBe('--my-color 1ms');
            expect(sensor!.style.getPropertyPriority('transition')).toBe('important');
        });

        it('sets an important transition on the combined style element (shadow DOM)', () => {
            const component = doc.createElement('div');
            const container = doc.createElement('div');
            doc.body.append(component);
            const shadow = component.attachShadow({ mode: 'open' });
            shadow.appendChild(container);
            const dm = new DOMManager(eventsHub, 'css-watch-shadow', doc, container);

            dm.updateCSSVariableWatchers({ 'var(--my-color)': 'red' });

            const styleEl = shadow.querySelector<HTMLElement>('[data-variable-name="--my-color"]');
            expect(styleEl).not.toBeNull();
            expect(styleEl!.style.getPropertyValue('transition')).toBe('color 1ms');
            expect(styleEl!.style.getPropertyPriority('transition')).toBe('important');
        });

        // A `style-src` nonce disables `'unsafe-inline'` for style elements, so an un-nonced
        // `@property` element is blocked and the watcher never fires. The shadow-DOM path needs no
        // equivalent: it styles a div through the CSSOM, which CSP does not govern.
        it('sets the style nonce on the @property element of every watcher (normal DOM)', () => {
            const container = doc.createElement('div');
            doc.body.append(container);
            const dm = new DOMManager(eventsHub, 'css-watch-nonce', doc, container);

            dm.updateCSSVariableWatchers({ 'var(--my-color)': 'red', 'var(--my-other-color)': 'blue' });

            const styleEls = Array.from(container.querySelectorAll<HTMLStyleElement>('style[data-variable-name]'));
            expect(styleEls).toHaveLength(2);
            for (const styleEl of styleEls) {
                expect(styleEl.getAttribute('nonce')).toBe('css-watch-nonce');
            }
        });

        it('omits the nonce attribute when no style nonce is configured', () => {
            const container = doc.createElement('div');
            doc.body.append(container);
            const dm = new DOMManager(eventsHub, undefined, doc, container);

            dm.updateCSSVariableWatchers({ 'var(--my-color)': 'red' });

            const styleEl = container.querySelector<HTMLStyleElement>('style[data-variable-name="--my-color"]');
            expect(styleEl).not.toBeNull();
            expect(styleEl!.hasAttribute('nonce')).toBe(false);
        });
    });

    describe('when connecting after initialisation', () => {
        beforeEach(() => vi.useFakeTimers());
        afterEach(() => vi.useRealTimers());

        it('should move styles to head when the container is attached to the document', () => {
            const container = doc.createElement('div');
            const dm = new DOMManager(eventsHub, 'late-416d', doc, container);
            dm.addStyles('late-test', '.test { width: 100% }');

            expect(container.querySelector('style[data-ag-charts="late-test"]')).not.toBeNull();
            expect(doc.head.querySelector('style[data-ag-charts="late-test"]')).toBeNull();

            doc.body.append(container);
            dm.setDeferring(false);
            vi.runAllTimers();

            expect(container.querySelector('style[data-ag-charts="late-test"]')).toBeNull();
            expect(doc.head.querySelector('style[data-ag-charts="late-test"]')).not.toBeNull();
            expect(doc.head.querySelector('style[data-ag-charts="ag-charts-community"]')).not.toBeNull();
        });

        it('should measure the container size when a detached small container is later attached', () => {
            const container = doc.createElement('div');
            const dm = new DOMManager(eventsHub, 'late-416d', doc, container);

            // Created detached: nothing to measure yet.
            expect(dm.containerSize).toBeUndefined();

            // Attach to the document and give it a laid-out size. jsdom never fires a
            // layout-driven ResizeObserver callback, so the attach-transition re-measure
            // is the only thing that can produce a size here.
            doc.body.append(container);
            Object.defineProperty(container, 'clientWidth', { value: 400, configurable: true });
            Object.defineProperty(container, 'clientHeight', { value: 250, configurable: true });
            vi.spyOn(doc.window, 'getComputedStyle').mockReturnValue({
                paddingLeft: '0px',
                paddingRight: '0px',
                paddingTop: '0px',
                paddingBottom: '0px',
            } as any);

            dm.setDeferring(false);
            vi.runAllTimers();

            expect(dm.containerSize).toMatchObject({ width: 400, height: 250 });
        });

        it('should measure the container size when attachment happens after the deferred flush completes', async () => {
            const container = doc.createElement('div');
            const dm = new DOMManager(eventsHub, 'late-416e', doc, container);

            // The deferred flush completes while the container is still detached, mirroring an
            // async-data flow where all updates settle before the container is appended.
            dm.setDeferring(false);
            await vi.runAllTimersAsync();
            expect(dm.containerSize).toBeUndefined();

            // Attach to the document and give it a laid-out size. jsdom never fires a
            // layout-driven ResizeObserver callback, so the attach-transition re-measure
            // is the only thing that can produce a size here.
            doc.body.append(container);
            Object.defineProperty(container, 'clientWidth', { value: 400, configurable: true });
            Object.defineProperty(container, 'clientHeight', { value: 250, configurable: true });
            vi.spyOn(doc.window, 'getComputedStyle').mockReturnValue({
                paddingLeft: '0px',
                paddingRight: '0px',
                paddingTop: '0px',
                paddingBottom: '0px',
            } as any);
            await vi.runAllTimersAsync();

            expect(dm.containerSize).toMatchObject({ width: 400, height: 250 });
        });

        it('should measure the container size when a detached shadow-DOM host is later attached', async () => {
            const component = doc.createElement('div');
            const shadow = component.attachShadow({ mode: 'open' });
            const container = doc.createElement('div');
            shadow.appendChild(container);

            const dm = new DOMManager(eventsHub, 'late-shadow', doc, container);

            // The deferred flush completes while the shadow host is still detached.
            dm.setDeferring(false);
            await vi.runAllTimersAsync();
            expect(dm.containerSize).toBeUndefined();

            // Connecting the host connects the container; jsdom never fires a layout-driven
            // ResizeObserver callback, so the attach-transition re-measure is the only thing
            // that can produce a size here.
            doc.body.append(component);
            Object.defineProperty(container, 'clientWidth', { value: 400, configurable: true });
            Object.defineProperty(container, 'clientHeight', { value: 250, configurable: true });
            vi.spyOn(doc.window, 'getComputedStyle').mockReturnValue({
                paddingLeft: '0px',
                paddingRight: '0px',
                paddingTop: '0px',
                paddingBottom: '0px',
            } as any);
            await vi.runAllTimersAsync();

            expect(dm.containerSize).toMatchObject({ width: 400, height: 250 });
        });

        it('should keep styles inside the shadow root when attached to a shadow DOM', () => {
            const component = doc.createElement('div');
            const container = doc.createElement('div');
            doc.body.append(component);
            const shadow = component.attachShadow({ mode: 'open' });

            const dm = new DOMManager(eventsHub, 'late-416d', doc, container);
            dm.addStyles('late-test', '.test { width: 100% }');

            shadow.appendChild(container);
            dm.setDeferring(false);
            vi.runAllTimers();

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
            const dm = new DOMManager(eventsHub, undefined, doc, container);

            const rect1 = dm.getBoundingClientRect();
            const rect2 = dm.getBoundingClientRect();
            expect(rect1).toBe(rect2);
        });

        it('should not call element getBoundingClientRect on cache hit', () => {
            const container = doc.createElement('div');
            doc.body.append(container);
            const dm = new DOMManager(eventsHub, undefined, doc, container);

            const canvasEl = dm.getParent('canvas');
            const spy = vi.spyOn(canvasEl, 'getBoundingClientRect');

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
            const dm = new DOMManager(eventsHub, undefined, doc, container);

            const rect1 = dm.getBoundingClientRect();
            doc.window.dispatchEvent(new Event('scroll'));
            const rect2 = dm.getBoundingClientRect();

            expect(rect1).not.toBe(rect2);
        });

        it('should invalidate cache after resize event', () => {
            const container = doc.createElement('div');
            doc.body.append(container);
            const dm = new DOMManager(eventsHub, undefined, doc, container);

            const rect1 = dm.getBoundingClientRect();
            doc.window.dispatchEvent(new Event('resize'));
            const rect2 = dm.getBoundingClientRect();

            expect(rect1).not.toBe(rect2);
        });

        it('should only make one real getBoundingClientRect call after invalidation', () => {
            const container = doc.createElement('div');
            doc.body.append(container);
            const dm = new DOMManager(eventsHub, undefined, doc, container);

            const canvasEl = dm.getParent('canvas');
            // Populate cache first
            dm.getBoundingClientRect();

            const spy = vi.spyOn(canvasEl, 'getBoundingClientRect');

            // Invalidate
            doc.window.dispatchEvent(new Event('scroll'));

            // Two calls after invalidation
            dm.getBoundingClientRect();
            dm.getBoundingClientRect();

            // Only one real call (re-populates cache, then cache hits)
            expect(spy).toHaveBeenCalledTimes(1);
        });

        it('should re-measure the cached rect on pointer re-entry after a container move', () => {
            const container = doc.createElement('div');
            doc.body.append(container);
            const dm = new DOMManager(eventsHub, undefined, doc, container);

            const canvasEl = dm.getParent('canvas');
            const chartEl = canvasEl.closest('.ag-charts-wrapper') as HTMLElement;
            expect(chartEl).not.toBeNull();

            const rectAt = (left: number, top: number) =>
                ({ ...new DOMRect(0, 0, 0, 0).toJSON(), left, top }) as DOMRect;
            const spy = vi.spyOn(canvasEl, 'getBoundingClientRect').mockReturnValue(rectAt(0, 0));

            // Populate the cache at the original position.
            expect(dm.getBoundingClientRect().left).toBe(0);

            // Container moved within the page: no scroll/resize/fullscreenchange fires, so the cache
            // stays stale at the pre-move position.
            spy.mockReturnValue(rectAt(200, 150));
            expect(dm.getBoundingClientRect().left).toBe(0);

            // The pointer must leave and re-enter the chart to hover it again; that re-entry
            // invalidates the cache so the next positioning read re-measures the moved rect.
            chartEl.dispatchEvent(new Event('pointerenter'));

            const rect = dm.getBoundingClientRect();
            expect(rect.left).toBe(200);
            expect(rect.top).toBe(150);
        });
    });

    describe('getOverlayClientRect() scrollable container', () => {
        const proto = HTMLElement.prototype;
        const originalDescriptor = Object.getOwnPropertyDescriptor(proto, 'togglePopover');

        function stubTogglePopover(this: void) {
            return true;
        }

        const setPopoverSupported = (popoverApiAvailable: boolean) => {
            if (popoverApiAvailable) {
                Object.defineProperty(proto, 'togglePopover', { value: stubTogglePopover, configurable: true });
            } else {
                delete (proto as Partial<HTMLElement>).togglePopover;
            }
        };

        afterEach(() => {
            if (originalDescriptor == null) {
                delete (proto as Partial<HTMLElement>).togglePopover;
            } else {
                Object.defineProperty(proto, 'togglePopover', originalDescriptor);
            }
        });

        // Distinct from the jsdom viewport (innerWidth/innerHeight) so the two outcomes
        // are distinguishable.
        const scrollableRect = {
            x: 10,
            y: 20,
            width: 100,
            height: 50,
            top: 20,
            left: 10,
            right: 110,
            bottom: 70,
        } as DOMRect;

        it('returns the viewport rect (not the scrollable ancestor) when popover is supported', () => {
            setPopoverSupported(true);
            const container = buildScrollableContainer(scrollableRect);
            const dm = new DOMManager(eventsHub, undefined, doc, container);

            const rect = dm.getOverlayClientRect();
            expect(rect.left).toBe(0);
            expect(rect.top).toBe(0);
            expect(rect.width).toBe(doc.innerWidth);
            expect(rect.height).toBe(doc.innerHeight);
        });

        it('returns the scrollable ancestor rect when popover is not supported', () => {
            setPopoverSupported(false);
            const container = buildScrollableContainer(scrollableRect);
            const dm = new DOMManager(eventsHub, undefined, doc, container);

            const rect = dm.getOverlayClientRect();
            expect(rect.left).toBe(scrollableRect.left);
            expect(rect.top).toBe(scrollableRect.top);
            expect(rect.width).toBe(scrollableRect.width);
            expect(rect.height).toBe(scrollableRect.height);
        });

        it('returns the viewport rect with no scrollable ancestor regardless of popover support', () => {
            const container = doc.createElement('div');
            doc.body.append(container);

            for (const supported of [true, false]) {
                setPopoverSupported(supported);
                const dm = new DOMManager(eventsHub, undefined, doc, container);

                const rect = dm.getOverlayClientRect();
                expect(rect.left).toBe(0);
                expect(rect.top).toBe(0);
                expect(rect.width).toBe(doc.innerWidth);
                expect(rect.height).toBe(doc.innerHeight);
            }
        });
    });

    describe('getVisibleChartRect()', () => {
        // Canvas spans x:0..200, y:0..200; scrollable window only reveals x:50..150, y:60..120.
        const canvasRect = {
            x: 0,
            y: 0,
            width: 200,
            height: 200,
            top: 0,
            left: 0,
            right: 200,
            bottom: 200,
        } as DOMRect;
        const scrollableRect = {
            x: 50,
            y: 60,
            width: 100,
            height: 60,
            top: 60,
            left: 50,
            right: 150,
            bottom: 120,
        } as DOMRect;

        it('returns null when the chart has no scrollable ancestor', () => {
            const container = doc.createElement('div');
            doc.body.append(container);
            const dm = new DOMManager(eventsHub, undefined, doc, container);

            expect(dm.getVisibleChartRect()).toBeNull();
        });

        it('returns the canvas rect clipped to the scrollable ancestor', () => {
            const container = buildScrollableContainer(scrollableRect);
            const dm = new DOMManager(eventsHub, undefined, doc, container);
            vi.spyOn(dm.getParent('canvas'), 'getBoundingClientRect').mockReturnValue(canvasRect);

            const rect = dm.getVisibleChartRect();
            expect(rect).not.toBeNull();
            expect(rect!.left).toBe(scrollableRect.left);
            expect(rect!.top).toBe(scrollableRect.top);
            expect(rect!.right).toBe(scrollableRect.right);
            expect(rect!.bottom).toBe(scrollableRect.bottom);
        });

        it('caches the result and re-computes after a scroll invalidation', () => {
            const container = buildScrollableContainer(scrollableRect);
            const dm = new DOMManager(eventsHub, undefined, doc, container);
            const canvasEl = dm.getParent('canvas');
            vi.spyOn(canvasEl, 'getBoundingClientRect').mockReturnValue(canvasRect);

            const rect1 = dm.getVisibleChartRect();
            const rect2 = dm.getVisibleChartRect();
            expect(rect1).toBe(rect2);

            doc.window.dispatchEvent(new Event('scroll'));
            const rect3 = dm.getVisibleChartRect();
            expect(rect3).not.toBe(rect1);
        });
    });

    describe('deferred proxy flushing', () => {
        it('should create a proxy tracked for deferred flushing', () => {
            const container = doc.createElement('div');
            doc.body.append(container);
            const dm = new DOMManager(eventsHub, undefined, doc, container);

            const proxy = dm.addDeferredProxyChild('canvas-overlay', 'test-proxy');
            expect(proxy).toBeDefined();
        });

        it('should not apply buffered writes to DOM before flush', () => {
            const container = doc.createElement('div');
            doc.body.append(container);
            const dm = new DOMManager(eventsHub, undefined, doc, container);

            const proxy = dm.addDeferredProxyChild('canvas-overlay', 'test-proxy');
            dm.setDeferring(true); // simulate being inside performUpdate()
            proxy.setProperty('left', '10px');

            const childEl = dm.getParent('canvas-overlay').querySelector('div');
            expect(childEl!.style.getPropertyValue('left')).toBe('');
        });

        it('should apply buffered writes after setDeferring(false)', () => {
            vi.useFakeTimers();
            const container = doc.createElement('div');
            doc.body.append(container);
            const dm = new DOMManager(eventsHub, undefined, doc, container);

            const proxy = dm.addDeferredProxyChild('canvas-overlay', 'test-proxy');
            dm.setDeferring(true); // simulate being inside performUpdate()
            proxy.setProperty('left', '10px');

            dm.setDeferring(false);
            vi.runAllTimers();
            vi.useRealTimers();

            const childEl = dm.getParent('canvas-overlay').querySelector('div');
            expect(childEl!.style.getPropertyValue('left')).toBe('10px');
        });

        it('should remove proxy from deferredProxies map on removeChild', () => {
            const container = doc.createElement('div');
            doc.body.append(container);
            const dm = new DOMManager(eventsHub, undefined, doc, container);

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
            const dm = new DOMManager(eventsHub, undefined, doc, container);

            dm.updateCursor('test', 'pointer');
            expect(dm.getCursor()).toBe('pointer');
        });

        it('should skip DOM write when cursor is unchanged', () => {
            const container = doc.createElement('div');
            doc.body.append(container);
            const dm = new DOMManager(eventsHub, undefined, doc, container);

            dm.updateCursor('test', 'pointer');

            // Spy on the element style cursor setter after the first write
            const element = (dm as any).element as HTMLElement;
            const descriptor = Object.getOwnPropertyDescriptor(CSSStyleDeclaration.prototype, 'cursor')!;
            const setter = vi.fn(descriptor.set!.bind(element.style));
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

    describe('canvas-center sizing at fractional DPR', () => {
        const centerSize = (dm: DOMManager) => {
            const center = dm.getParent('canvas-center').style;
            return { width: center.width, height: center.height };
        };

        it('floors a fractional container size so the observed subtree matches the floored canvas size', () => {
            const container = doc.createElement('div');
            doc.body.append(container);
            const dm = new DOMManager(eventsHub, undefined, doc, container);

            // A fractional content-box arrives at fractional zoom (e.g. 110% → DPR 1.1).
            dm.containerSize = { width: 108.9, height: 99.9, pixelRatio: 1.1 };
            (dm as any).updateContainerSize();

            // canvas-center must match the floored canvas size, else the observer ping-pongs by 1px.
            expect(centerSize(dm)).toEqual({ width: '108px', height: '99px' });
        });

        it('keeps canvas-center size stable across the float jitter ResizeObserver reports while dragging', () => {
            const container = doc.createElement('div');
            doc.body.append(container);
            const dm = new DOMManager(eventsHub, undefined, doc, container);

            // The observer reports sub-pixel values straddling an integer while dragging; the applied size must not oscillate.
            const heights: string[] = [];
            for (const reported of [99.9, 99.4, 99.7, 99.2, 99.8]) {
                dm.containerSize = { width: 200, height: reported, pixelRatio: 1.1 };
                (dm as any).updateContainerSize();
                heights.push(dm.getParent('canvas-center').style.height);
            }

            expect(new Set(heights)).toEqual(new Set(['99px']));
        });
    });

    describe('setThemeParameters()', () => {
        // Consumers cache DOM measurements that the theme CSS variables feed into, so the event
        // must track the variable writes exactly: fired whenever they happen, silent otherwise.
        function setup() {
            const ownEventsHub: EventsHub = new EventEmitter();
            const container = doc.createElement('div');
            doc.body.append(container);
            const dm = new DOMManager(ownEventsHub, undefined, doc, container);
            const handler = vi.fn();
            ownEventsHub.on('theme:params-change', handler);
            return { dm, handler };
        }

        it('emits theme:params-change when the resolved parameters change', () => {
            const { dm, handler } = setup();

            dm.setThemeParameters({ chromeFontSize: 12 });
            dm.setThemeParameters({ chromeFontSize: 14 });

            expect(handler).toHaveBeenCalledTimes(2);
        });

        it('stays silent when called again with the same parameters', () => {
            const { dm, handler } = setup();
            const params = { chromeFontSize: 12 };

            dm.setThemeParameters(params);
            dm.setThemeParameters(params);

            expect(handler).toHaveBeenCalledTimes(1);
        });

        it('emits when a parameter is lazily added to the same object', () => {
            const { dm, handler } = setup();
            const params: { chromeFontSize?: number; chromeFontFamily?: string } = { chromeFontSize: 12 };

            dm.setThemeParameters(params);
            params.chromeFontFamily = 'Verdana';
            dm.setThemeParameters(params);

            expect(handler).toHaveBeenCalledTimes(2);
        });
    });

    // The canvas is centred inside canvas-center, so a canvas whose size disagrees with that box
    // sits half the difference down the container.
    describe('AG-17927 alignment of an unreconciled canvas size', () => {
        const newManager = () => {
            const container = doc.createElement('div');
            doc.body.append(container);
            const dm = new DOMManager(eventsHub, undefined, doc, container);
            return { dm, wrapper: container.firstElementChild! };
        };
        const isTopLeftAligned = (wrapper: Element) => ({
            vertical: wrapper.classList.contains('ag-charts-wrapper--safe-vertical'),
            horizontal: wrapper.classList.contains('ag-charts-wrapper--safe-horizontal'),
        });

        it('aligns to the start when the size comes from the container', () => {
            const { dm, wrapper } = newManager();
            dm.containerSize = { width: 1666, height: 1290, pixelRatio: 1 };
            dm.setSizeOptions(0, 0);

            // Without this the placeholder-sized canvas is centred, offsetting the chart by
            // (1290 - canvasHeight) / 2.
            expect(isTopLeftAligned(wrapper)).toEqual({ vertical: true, horizontal: true });
        });

        it('still centres a canvas the caller explicitly sized smaller than its container', () => {
            const { dm, wrapper } = newManager();
            dm.containerSize = { width: 1666, height: 1290, pixelRatio: 1 };
            dm.setSizeOptions(0, 0, 600, 400);

            expect(isTopLeftAligned(wrapper)).toEqual({ vertical: false, horizontal: false });
        });

        it('keeps aligning an explicitly sized canvas to the start when it exceeds its container', () => {
            const { dm, wrapper } = newManager();
            dm.containerSize = { width: 300, height: 200, pixelRatio: 1 };
            dm.setSizeOptions(0, 0, 600, 400);

            // Centring a canvas larger than the box would hide its top-left.
            expect(isTopLeftAligned(wrapper)).toEqual({ vertical: true, horizontal: true });
        });
    });

    describe('destroy()', () => {
        it('removes children it owns but leaves a transferred (re-homed) child intact', () => {
            const container = doc.createElement('div');
            doc.body.append(container);
            const dm = new DOMManager(eventsHub, undefined, doc, container);

            // A child still parented under this manager is torn down on destroy().
            const owned = dm.addChild('canvas', 'owned');
            // A transferred canvas (keepTransferableResources) re-parented into a replacement
            // chart's DOM must survive this manager's deferred teardown (AG-17444).
            const transferred = dm.addChild('canvas', 'transferred');
            const newOwner = doc.createElement('div');
            doc.body.append(newOwner);
            newOwner.append(transferred);

            dm.destroy();

            expect(transferred.isConnected).toBe(true);
            expect(newOwner.contains(transferred)).toBe(true);
            expect(owned.isConnected).toBe(false);
        });
    });
});
