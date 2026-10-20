import { describe, expect, it, vi } from 'vitest';

import { AgDocument, EventEmitter, getDocument } from 'ag-charts-core';

import { locateChartWrapper } from '../chart/test/utils';
import type { EventsHub } from '../core/eventsHub';
import { DOMManager } from './domManager';

describe('DOMManager', () => {
    const doc = new AgDocument(getDocument());

    beforeEach(() => {
        // Prevent bleed of state between tests.
        doc.head.innerHTML = '';
        (DOMManager as any).headStyles.delete(doc.head);
    });

    const eventsHub: EventsHub = new EventEmitter();

    // jsdom does not implement computedStyleMap(); stub it so findScrollableContainer() detects the ancestor
    // as scrollable.
    const buildScrollableContainer = (scrollableRect: DOMRect) => {
        const scrollable = doc.createElement('div');
        const container = doc.createElement('div');
        scrollable.append(container);
        doc.body.append(scrollable);
        (scrollable as any).computedStyleMap = () => ({ get: () => 'auto' });
        vi.spyOn(scrollable, 'getBoundingClientRect').mockReturnValue(scrollableRect);
        return container;
    };

    // component (in body) > shadow root > outer > inner > container. `outer` is the element directly inside the shadow
    // root, which is what DOMManager treats as the shadow document root.
    const buildShadowTree = () => {
        const component = doc.createElement('div');
        doc.body.append(component);
        const shadow = component.attachShadow({ mode: 'open' });
        const outer = doc.createElement('div');
        const inner = doc.createElement('div');
        const container = doc.createElement('div');
        inner.append(container);
        outer.append(inner);
        shadow.append(outer);
        return { component, shadow, outer, inner, container };
    };

    // The shadow-path watchers are direct children of the shadow root.
    const shadowWatchers = (shadow: ShadowRoot, name = '--my-color') =>
        Array.from(shadow.children).filter((child) => (child as HTMLElement).dataset.variableName === name);

    // The shadow root DOMManager creates for itself, on a host it puts first in the container.
    const isolatedRoot = (container: HTMLElement) => container.firstElementChild?.shadowRoot;

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

    describe('for minimal-mode containers', () => {
        it('resolves the series area and its bounds element to the same attached element', () => {
            const container = doc.createElement('div');
            doc.body.append(container);

            const dm = new DOMManager(eventsHub, '416d1178', doc, container, undefined, undefined, 'minimal');
            const seriesArea = dm.getParent('series-area');

            expect(dm.getParent('series-area-bounds')).toBe(seriesArea);
            expect(container.contains(seriesArea)).toBe(true);
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

    describe('inside the claude.ai visualiser', () => {
        // The visualiser's base rule, whose `form.elicit` exemption identifies the page.
        const visualiserCss = `button:not(#action-btns button):not(form.elicit button) { padding: 8px 16px; }`;

        const buildContainer = ({ stylesheet = true, insideVisContainer = true } = {}) => {
            if (stylesheet) {
                const style = doc.createElement('style');
                style.textContent = visualiserCss;
                doc.head.append(style);
            }
            const container = doc.createElement('div');
            const wrapper = doc.createElement('div');
            if (insideVisContainer) wrapper.setAttribute('id', 'vis-container');
            wrapper.append(container);
            doc.body.append(wrapper);
            return { container, wrapper };
        };

        it('mounts the chart in a shadow root of its own, with its styles inside it', () => {
            const { container } = buildContainer();
            new DOMManager(eventsHub, 'vis', doc, container).addStyles('test', '.test {}');

            const root = isolatedRoot(container);
            expect(container.childElementCount).toBe(1);
            expect(locateChartWrapper(container)).toBe('shadow-root');
            expect(root?.querySelector('style[data-ag-charts="ag-charts-community"]')).not.toBeNull();
            expect(root?.querySelector('style[data-ag-charts="test"]')).not.toBeNull();
            expect(doc.head.querySelector('style[data-ag-charts]')).toBeNull();
        });

        it.each([
            ['outside #vis-container', { insideVisContainer: false }, undefined],
            ['without the visualiser stylesheet', { stylesheet: false }, undefined],
            ['with a styleContainer', {}, doc.head],
        ] as const)('stays in the light DOM %s', (_, setup, styleContainer) => {
            const { container } = buildContainer(setup);
            const dm = new DOMManager(eventsHub, 'vis-light', doc, container, styleContainer);

            expect(dm.getParent('canvas').getRootNode()).toBe(doc.document);
        });

        it('stays in the light DOM when enableShadowDom is false', () => {
            const { container } = buildContainer();
            const dm = new DOMManager(
                eventsHub,
                'vis-opt-out',
                doc,
                container,
                undefined,
                undefined,
                'normal',
                undefined,
                false
            );

            expect(dm.getParent('canvas').getRootNode()).toBe(doc.document);
        });

        it('stays in the light DOM for a minimal-mode chart', () => {
            const { container } = buildContainer();
            const dm = new DOMManager(eventsHub, 'vis-minimal', doc, container, undefined, undefined, 'minimal');

            expect(dm.getParent('canvas').getRootNode()).toBe(doc.document);
        });

        describe('when the container is attached after initialisation', () => {
            beforeEach(() => vi.useFakeTimers());
            afterEach(() => vi.useRealTimers());

            it('isolates the chart once the container joins the visualiser', () => {
                const { wrapper } = buildContainer();
                const container = doc.createElement('div');
                const dm = new DOMManager(eventsHub, 'vis-late', doc, container);
                expect(locateChartWrapper(container)).toBe('light-dom');

                wrapper.append(container);
                dm.setDeferring(false);
                vi.runAllTimers();

                expect(locateChartWrapper(container)).toBe('shadow-root');
                expect(doc.head.querySelector('style[data-ag-charts]')).toBeNull();
            });

            it('watches CSS variables from its shadow root once the container joins the visualiser', () => {
                const { wrapper } = buildContainer();
                const container = doc.createElement('div');
                const dm = new DOMManager(eventsHub, 'vis-late-css', doc, container);
                dm.updateCSSVariableWatchers({ 'var(--my-color)': 'red' });

                wrapper.append(container);
                dm.setDeferring(false);
                vi.runAllTimers();

                const root = isolatedRoot(container);
                expect(root).not.toBeNull();
                expect(shadowWatchers(root!)).toHaveLength(1);
            });
        });

        it('bounds overlays by the window, as in the light DOM', () => {
            const { container } = buildContainer();
            const dm = new DOMManager(eventsHub, 'vis-overlay', doc, container);

            const { width, height } = dm.getOverlayClientRect();
            expect({ width, height }).toEqual({ width: doc.innerWidth, height: doc.innerHeight });
        });

        it('leaves the container empty when destroyed', () => {
            const { container } = buildContainer();
            const dm = new DOMManager(eventsHub, 'vis-destroy', doc, container);

            dm.destroy();

            expect(container.childElementCount).toBe(0);
        });

        it('watches CSS variables from the light DOM once moved out of the visualiser', () => {
            const { container } = buildContainer();
            const dm = new DOMManager(eventsHub, 'vis-move-out', doc, container);
            dm.updateCSSVariableWatchers({ 'var(--my-color)': 'red' });

            const outside = doc.createElement('div');
            doc.body.append(outside);
            dm.setContainer(outside);
            dm.updateContainer();

            expect(outside.querySelector('style[data-variable-name="--my-color"]')).not.toBeNull();
        });
    });

    describe('with enableShadowDom', () => {
        const cssVariables = { 'var(--my-color)': 'red' };

        const buildManager = (enableShadowDom: boolean | undefined, styleContainer?: HTMLElement) => {
            const container = doc.createElement('div');
            doc.body.append(container);
            const dm = new DOMManager(
                eventsHub,
                undefined,
                doc,
                container,
                styleContainer,
                undefined,
                'normal',
                undefined,
                enableShadowDom
            );
            dm.addStyles('test', '.test {}');
            dm.updateCSSVariableWatchers(cssVariables);
            return { container, dm };
        };

        it('renders in a shadow root of its own on any page when true', () => {
            const { container } = buildManager(true);

            const root = isolatedRoot(container);
            expect(locateChartWrapper(container)).toBe('shadow-root');
            expect(root?.querySelector('style[data-ag-charts="test"]')).not.toBeNull();
            expect(doc.head.querySelector('style[data-ag-charts]')).toBeNull();
        });

        it('stays in the light DOM when true but the caller places the styles', () => {
            const { dm } = buildManager(true, doc.head);

            expect(dm.getParent('canvas').getRootNode()).toBe(doc.document);
        });

        it('moves into a shadow root of its own, with its styles and CSS-variable watchers, when turned on', () => {
            const { container, dm } = buildManager(undefined);

            dm.setEnableShadowDom(true);

            const root = isolatedRoot(container);
            expect(root).not.toBeNull();
            expect(locateChartWrapper(container)).toBe('shadow-root');
            expect(root!.querySelector('style[data-ag-charts="test"]')).not.toBeNull();
            expect(shadowWatchers(root!)).toHaveLength(1);
        });

        it('moves back to the light DOM, with its styles in the head, when turned off', () => {
            const { container, dm } = buildManager(true);

            dm.setEnableShadowDom(false);

            expect(locateChartWrapper(container)).toBe('light-dom');
            expect(container.childElementCount).toBe(1);
            expect(doc.head.querySelector('style[data-ag-charts="test"]')).not.toBeNull();
            expect(container.querySelector('style[data-variable-name="--my-color"]')).not.toBeNull();
        });

        it('watches CSS variables from the light DOM when turned off before a detached container attaches', () => {
            vi.useFakeTimers();
            try {
                const container = doc.createElement('div');
                const dm = new DOMManager(
                    eventsHub,
                    undefined,
                    doc,
                    container,
                    undefined,
                    undefined,
                    'normal',
                    undefined,
                    true
                );
                dm.updateCSSVariableWatchers(cssVariables);

                dm.setEnableShadowDom(false);
                doc.body.append(container);
                dm.setDeferring(false);
                vi.runAllTimers();

                expect(locateChartWrapper(container)).toBe('light-dom');
                expect(container.querySelector('style[data-variable-name="--my-color"]')).not.toBeNull();
            } finally {
                vi.useRealTimers();
            }
        });
    });

    describe('for charts in a second document', () => {
        // A chart in an iframe must not stop a later chart in the main document from getting its stylesheet.
        it('adds the head styles to each document', () => {
            const otherDocument = getDocument().implementation.createHTMLDocument('other');
            const otherDoc = new AgDocument(otherDocument, getDocument().defaultView!);
            const otherContainer = otherDocument.createElement('div');
            otherDocument.body.append(otherContainer);
            new DOMManager(eventsHub, 'other-doc', otherDoc, otherContainer).addStyles('test', '.test {}');

            const container = doc.createElement('div');
            doc.body.append(container);
            new DOMManager(eventsHub, 'main-doc', doc, container).addStyles('test', '.test {}');

            const selector = 'style[data-ag-charts="test"]';
            expect(otherDocument.head.querySelector(selector)).not.toBeNull();
            expect(doc.head.querySelector(selector)).not.toBeNull();
        });
    });

    // The watcher transition must carry an `!important` priority so it survives users globally disabling
    // transitions. jsdom runs no transitions, so the runtime refresh path is covered by browser e2e.
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

        // A `style-src` nonce disables `'unsafe-inline'`, so an un-nonced `@property` element is blocked and
        // the watcher never fires. The shadow-DOM path styles via the CSSOM, which CSP does not govern.
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

        describe('in a shadow root', () => {
            const countRefreshes = (dispatch: () => void) => {
                const refresh = vi.fn();
                const off = eventsHub.on('chart:request-refresh', refresh);
                dispatch();
                off();
                return refresh.mock.calls.length;
            };
            const transitionEnd = (target: Element) =>
                target.dispatchEvent(new Event('transitionend', { bubbles: true }));

            it('refreshes once per watched transition however often the watchers are updated', () => {
                const { shadow, container } = buildShadowTree();
                const dm = new DOMManager(eventsHub, undefined, doc, container);
                for (let i = 0; i < 3; i++) {
                    dm.updateCSSVariableWatchers({});
                    dm.updateCSSVariableWatchers({ 'var(--my-color)': 'red' });
                }

                expect(countRefreshes(() => transitionEnd(shadowWatchers(shadow)[0]))).toBe(1);
            });

            it("ignores transitions on the chart's own elements", () => {
                const { container } = buildShadowTree();
                const dm = new DOMManager(eventsHub, undefined, doc, container);
                dm.updateCSSVariableWatchers({ 'var(--my-color)': 'red' });

                expect(countRefreshes(() => transitionEnd(dm.getParent('canvas')))).toBe(0);
            });
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

            // jsdom never fires a layout-driven ResizeObserver callback, so the attach-transition re-measure
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

            // jsdom never fires a layout-driven ResizeObserver callback, so the attach-transition re-measure
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

            // jsdom never fires a layout-driven ResizeObserver callback, so the attach-transition re-measure
            // is the only thing that can produce a size here.
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

        describe('when the container is detached, its chart replaced and the container then attached', () => {
            const wrappers = (container: HTMLElement) => container.querySelectorAll('.ag-charts-wrapper');

            // Drives attachment through the deferred flush, as the other late-attach tests do.
            it('does not re-append a detached manager element when the flush runs', () => {
                const container = doc.createElement('div');
                const dm = new DOMManager(eventsHub, 'replaced-flush', doc, container);
                expect(wrappers(container)).toHaveLength(1);

                dm.detachFromContainer();
                expect(wrappers(container)).toHaveLength(0);

                doc.body.append(container);
                dm.setDeferring(false);
                vi.runAllTimers();

                expect(wrappers(container)).toHaveLength(0);
            });

            // Drives attachment through the attach MutationObserver alone (jsdom has no IntersectionObserver),
            // with no flush scheduled.
            it('does not re-append a detached manager element when the attach observer fires', async () => {
                const container = doc.createElement('div');
                const dm = new DOMManager(eventsHub, 'replaced-observer', doc, container);
                const refresh = vi.spyOn((dm as any).sizeMonitor, 'refresh');

                dm.detachFromContainer();
                doc.body.append(container);
                await vi.runAllTimersAsync();

                // The attach transition ran (it re-measures the container) and still left the element out.
                expect(refresh).toHaveBeenCalledWith(container);
                expect(wrappers(container)).toHaveLength(0);
            });

            it('ends up with exactly one wrapper once the replacement manager is attached and the old one destroyed', async () => {
                const container = doc.createElement('div');
                const oldDm = new DOMManager(eventsHub, 'replaced-old', doc, container);

                oldDm.detachFromContainer();
                const newDm = new DOMManager(eventsHub, 'replaced-new', doc, container);
                doc.body.append(container);

                oldDm.setDeferring(false);
                newDm.setDeferring(false);
                await vi.runAllTimersAsync();
                expect(wrappers(container)).toHaveLength(1);

                oldDm.destroy();
                await vi.runAllTimersAsync();
                expect(wrappers(container)).toHaveLength(1);
                expect(newDm.getParent('canvas').closest('.ag-charts-wrapper')).toBe(wrappers(container)[0]);
            });
        });

        it('registers the shadow-path CSS-variable watcher when a detached container is attached into a shadow root', () => {
            const component = doc.createElement('div');
            const container = doc.createElement('div');
            const dm = new DOMManager(eventsHub, 'late-watchers', doc, container);

            dm.updateCSSVariableWatchers({ 'var(--my-color)': 'red' });
            expect(container.querySelector('style[data-variable-name="--my-color"]')).not.toBeNull();

            doc.body.append(component);
            const shadow = component.attachShadow({ mode: 'open' });
            shadow.appendChild(container);
            dm.setDeferring(false);
            vi.runAllTimers();

            expect(shadowWatchers(shadow)).toHaveLength(1);
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

        describe('inside a shadow root', () => {
            // Within the jsdom viewport so the window intersection leaves it unchanged.
            const shadowRect = {
                x: 30,
                y: 40,
                width: 200,
                height: 100,
                top: 40,
                left: 30,
                right: 230,
                bottom: 140,
            } as DOMRect;

            const expectRect = (rect: DOMRect, expected: DOMRect) => {
                expect(rect.left).toBe(expected.left);
                expect(rect.top).toBe(expected.top);
                expect(rect.width).toBe(expected.width);
                expect(rect.height).toBe(expected.height);
            };

            it('uses the rect of the element directly inside the shadow root when there is no scrollable ancestor', () => {
                setPopoverSupported(false);
                const { outer, inner, container } = buildShadowTree();
                vi.spyOn(outer, 'getBoundingClientRect').mockReturnValue(shadowRect);
                // Nested elements and the host must not be used.
                vi.spyOn(inner, 'getBoundingClientRect').mockReturnValue(scrollableRect);
                vi.spyOn(container, 'getBoundingClientRect').mockReturnValue(scrollableRect);
                const dm = new DOMManager(eventsHub, undefined, doc, container);

                expectRect(dm.getOverlayClientRect(), shadowRect);
            });

            it('uses the container itself when it is the element directly inside the shadow root', () => {
                setPopoverSupported(false);
                const component = doc.createElement('div');
                doc.body.append(component);
                const container = doc.createElement('div');
                component.attachShadow({ mode: 'open' }).append(container);
                vi.spyOn(container, 'getBoundingClientRect').mockReturnValue(shadowRect);
                const dm = new DOMManager(eventsHub, undefined, doc, container);

                expectRect(dm.getOverlayClientRect(), shadowRect);
            });

            it('clips the shadow root element rect to the window', () => {
                setPopoverSupported(false);
                const { outer, container } = buildShadowTree();
                const overhang = { ...shadowRect, left: -50, x: -50, right: 150, width: 200 } as DOMRect;
                vi.spyOn(outer, 'getBoundingClientRect').mockReturnValue(overhang);
                const dm = new DOMManager(eventsHub, undefined, doc, container);

                const rect = dm.getOverlayClientRect();
                expect(rect.left).toBe(0);
                expect(rect.right).toBe(150);
            });

            it('prefers a scrollable ancestor inside the shadow root when popover is not supported', () => {
                setPopoverSupported(false);
                const { outer, inner, container } = buildShadowTree();
                vi.spyOn(outer, 'getBoundingClientRect').mockReturnValue(shadowRect);
                (inner as any).computedStyleMap = () => ({ get: () => 'auto' });
                vi.spyOn(inner, 'getBoundingClientRect').mockReturnValue(scrollableRect);
                const dm = new DOMManager(eventsHub, undefined, doc, container);

                expectRect(dm.getOverlayClientRect(), scrollableRect);
            });

            it('treats the shadow root fullscreen element as the container when popover is not supported', () => {
                setPopoverSupported(false);
                const { shadow, outer, inner, container } = buildShadowTree();
                vi.spyOn(outer, 'getBoundingClientRect').mockReturnValue(shadowRect);
                vi.spyOn(inner, 'getBoundingClientRect').mockReturnValue(scrollableRect);
                Object.defineProperty(shadow, 'fullscreenElement', { value: inner, configurable: true });
                const dm = new DOMManager(eventsHub, undefined, doc, container);

                expectRect(dm.getOverlayClientRect(), scrollableRect);
            });
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

        describe('inside a shadow root', () => {
            it('returns the canvas rect clipped to a scrollable ancestor inside the shadow root', () => {
                const { inner, container } = buildShadowTree();
                (inner as any).computedStyleMap = () => ({ get: () => 'auto' });
                vi.spyOn(inner, 'getBoundingClientRect').mockReturnValue(scrollableRect);
                const dm = new DOMManager(eventsHub, undefined, doc, container);
                vi.spyOn(dm.getParent('canvas'), 'getBoundingClientRect').mockReturnValue(canvasRect);

                const rect = dm.getVisibleChartRect();
                expect(rect).not.toBeNull();
                expect(rect!.left).toBe(scrollableRect.left);
                expect(rect!.top).toBe(scrollableRect.top);
                expect(rect!.right).toBe(scrollableRect.right);
                expect(rect!.bottom).toBe(scrollableRect.bottom);
            });

            it('returns null when nothing inside the shadow root is scrollable', () => {
                const { container } = buildShadowTree();
                const dm = new DOMManager(eventsHub, undefined, doc, container);

                expect(dm.getVisibleChartRect()).toBeNull();
            });

            it('treats the fullscreen element of the shadow root as the container', () => {
                const { shadow, inner, container } = buildShadowTree();
                Object.defineProperty(shadow, 'fullscreenElement', { value: inner, configurable: true });
                vi.spyOn(inner, 'getBoundingClientRect').mockReturnValue(scrollableRect);
                const dm = new DOMManager(eventsHub, undefined, doc, container);
                vi.spyOn(dm.getParent('canvas'), 'getBoundingClientRect').mockReturnValue(canvasRect);

                const rect = dm.getVisibleChartRect();
                expect(rect).not.toBeNull();
                expect(rect!.left).toBe(scrollableRect.left);
                expect(rect!.top).toBe(scrollableRect.top);
                expect(rect!.right).toBe(scrollableRect.right);
                expect(rect!.bottom).toBe(scrollableRect.bottom);
            });
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

    describe('setContainer() moving between light DOM and shadow roots', () => {
        beforeEach(() => vi.useFakeTimers());
        afterEach(() => vi.useRealTimers());

        const STYLE_ID = 'move-test';
        const styleSelector = `style[data-ag-charts="${STYLE_ID}"]`;
        const cssVariables = { 'var(--my-color)': 'red' };

        const newLightContainer = () => {
            const container = doc.createElement('div');
            doc.body.append(container);
            return container;
        };

        // Moving a manager that already has a container is deferred to the flush.
        const moveTo = (dm: DOMManager, container: HTMLElement) => {
            dm.setContainer(container);
            dm.updateContainer();
        };

        it('moves the styles from the head into the shadow root when moving light DOM to shadow DOM', () => {
            const { shadow, container: shadowContainer } = buildShadowTree();
            const dm = new DOMManager(eventsHub, undefined, doc, newLightContainer());
            dm.addStyles(STYLE_ID, '.test { width: 100% }');
            expect(doc.head.querySelector(styleSelector)).not.toBeNull();
            expect(shadow.querySelector(styleSelector)).toBeNull();

            moveTo(dm, shadowContainer);

            expect(shadowContainer.contains(dm.getParent('canvas'))).toBe(true);
            expect(shadow.querySelector(styleSelector)).not.toBeNull();
            expect(shadow.querySelector('style[data-ag-charts="ag-charts-community"]')).not.toBeNull();
            // The head styles are shared with other charts on the page, so they stay.
            expect(doc.head.querySelector(styleSelector)).not.toBeNull();
        });

        it('moves the styles from the shadow root into the head when moving shadow DOM to light DOM', () => {
            const { shadow, container: shadowContainer } = buildShadowTree();
            const dm = new DOMManager(eventsHub, undefined, doc, shadowContainer);
            dm.addStyles(STYLE_ID, '.test { width: 100% }');
            expect(shadow.querySelector(styleSelector)).not.toBeNull();
            expect(doc.head.querySelector(styleSelector)).toBeNull();

            const lightContainer = newLightContainer();
            moveTo(dm, lightContainer);

            expect(lightContainer.contains(dm.getParent('canvas'))).toBe(true);
            expect(shadow.querySelector(styleSelector)).toBeNull();
            expect(shadow.querySelector('style[data-ag-charts]')).toBeNull();
            // The wrapper moves with its styles element, so stale shadow styles must not travel with it.
            expect(lightContainer.querySelector('style[data-ag-charts]')).toBeNull();
            expect(doc.head.querySelector(styleSelector)).not.toBeNull();
            expect(doc.head.querySelector('style[data-ag-charts="ag-charts-community"]')).not.toBeNull();
        });

        it('moves the styles to the new shadow root and leaves none in the old one when moving between shadow roots', () => {
            const { shadow: shadowA, container: containerA } = buildShadowTree();
            const { shadow: shadowB, container: containerB } = buildShadowTree();
            const dm = new DOMManager(eventsHub, undefined, doc, containerA);
            dm.addStyles(STYLE_ID, '.test { width: 100% }');
            const staleStyle = shadowA.querySelector(styleSelector);
            expect(staleStyle).not.toBeNull();

            moveTo(dm, containerB);

            expect(shadowA.querySelector('style[data-ag-charts]')).toBeNull();
            expect(shadowB.querySelector(styleSelector)).not.toBeNull();
            expect(shadowB.querySelector('style[data-ag-charts="ag-charts-community"]')).not.toBeNull();
            expect(doc.head.querySelector('style[data-ag-charts]')).toBeNull();
            // Shadow-root styles live inside the wrapper; they are dropped and recreated rather than carried
            // along with it into the new root.
            expect(containerB.querySelectorAll(styleSelector)).toHaveLength(1);
            expect(containerB.querySelector(styleSelector)).not.toBe(staleStyle);
        });

        it('applies a deferred move through setContainer() and the flush', async () => {
            const { shadow, container: shadowContainer } = buildShadowTree();
            const dm = new DOMManager(eventsHub, undefined, doc, newLightContainer());
            dm.addStyles(STYLE_ID, '.test { width: 100% }');

            dm.setContainer(shadowContainer);
            // Not applied until the flush.
            expect(shadowContainer.contains(dm.getParent('canvas'))).toBe(false);

            dm.setDeferring(false);
            await vi.runAllTimersAsync();

            expect(shadowContainer.contains(dm.getParent('canvas'))).toBe(true);
            expect(shadow.querySelector(styleSelector)).not.toBeNull();
        });

        it('registers the CSS-variable watchers again on the new shadow root when moving between shadow roots', () => {
            const { shadow: shadowA, container: containerA } = buildShadowTree();
            const { shadow: shadowB, container: containerB } = buildShadowTree();
            const dm = new DOMManager(eventsHub, undefined, doc, containerA);
            dm.updateCSSVariableWatchers(cssVariables);
            expect(shadowWatchers(shadowA)).toHaveLength(1);
            expect(shadowWatchers(shadowB)).toHaveLength(0);

            moveTo(dm, containerB);
            dm.updateCSSVariableWatchers(cssVariables);

            expect(shadowWatchers(shadowB)).toHaveLength(1);
        });

        it('does not register duplicate CSS-variable watchers when moving within the same shadow root', () => {
            const { shadow, container: firstContainer } = buildShadowTree();
            const secondContainer = doc.createElement('div');
            shadow.append(secondContainer);
            const dm = new DOMManager(eventsHub, undefined, doc, firstContainer);
            dm.updateCSSVariableWatchers(cssVariables);

            moveTo(dm, secondContainer);
            dm.updateCSSVariableWatchers(cssVariables);

            expect(shadowWatchers(shadow)).toHaveLength(1);
        });

        it('registers the CSS-variable watchers on the shadow root when moving light DOM to shadow DOM', () => {
            const lightContainer = newLightContainer();
            const { shadow, container: shadowContainer } = buildShadowTree();
            const dm = new DOMManager(eventsHub, undefined, doc, lightContainer);
            dm.updateCSSVariableWatchers(cssVariables);
            expect(lightContainer.querySelector('style[data-variable-name="--my-color"]')).not.toBeNull();

            moveTo(dm, shadowContainer);
            dm.updateCSSVariableWatchers(cssVariables);

            expect(shadowWatchers(shadow)).toHaveLength(1);
        });

        // Leaving a shadow root only clears the registration set: the watcher elements and the shadow root's
        // transitionend listener stay, so returning registers them a second time (AG-18986).
        it.fails(
            'does not leave shadow-path CSS-variable watchers behind when moving out of and back into a shadow root',
            () => {
                const { shadow, container: shadowContainer } = buildShadowTree();
                const dm = new DOMManager(eventsHub, undefined, doc, shadowContainer);
                dm.updateCSSVariableWatchers(cssVariables);
                expect(shadowWatchers(shadow)).toHaveLength(1);

                moveTo(dm, newLightContainer());
                moveTo(dm, shadowContainer);
                dm.updateCSSVariableWatchers(cssVariables);

                expect(shadowWatchers(shadow)).toHaveLength(1);
            }
        );
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

    describe('lockCursor()/unlockCursor() cursor-locked class', () => {
        const LOCKED_CLASS = 'ag-charts-wrapper--cursor-locked';

        const setupManager = () => {
            const container = doc.createElement('div');
            doc.body.append(container);
            const dm = new DOMManager(eventsHub, undefined, doc, container);
            return { dm, element: (dm as any).element as HTMLElement };
        };

        it('should toggle the cursor-locked class across a lock/unlock round-trip', () => {
            const { dm, element } = setupManager();

            dm.updateCursor('a', 'pointer');
            expect(element.classList.contains(LOCKED_CLASS)).toBe(false);

            dm.lockCursor('a', 'grabbing');
            expect(element.classList.contains(LOCKED_CLASS)).toBe(true);
            expect(dm.getCursor()).toBe('grabbing');

            dm.unlockCursor('a');
            expect(element.classList.contains(LOCKED_CLASS)).toBe(false);
            expect(dm.getCursor()).toBe('pointer');
        });

        it('should keep the cursor-locked class when a non-holder unlocks', () => {
            const { dm, element } = setupManager();

            dm.lockCursor('a', 'grabbing');
            expect(element.classList.contains(LOCKED_CLASS)).toBe(true);

            dm.unlockCursor('b');
            expect(element.classList.contains(LOCKED_CLASS)).toBe(true);
            expect(dm.getCursor()).toBe('grabbing');

            dm.unlockCursor('a');
            expect(element.classList.contains(LOCKED_CLASS)).toBe(false);
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

        describe('button state borders', () => {
            const cssVar = (dm: DOMManager, name: string) =>
                (dm as any).element.style.getPropertyValue(`--ag-charts-button-${name}`);

            it('a state border set to true inherits the buttonBorder colour and width', () => {
                const { dm } = setup();

                dm.setThemeParameters({ buttonBorder: { color: 'black', width: 2 }, buttonHoverBorder: true });

                expect(cssVar(dm, 'hover-border-color')).toBe('var(--ag-charts-button-border-color)');
                expect(cssVar(dm, 'hover-border-width')).toBe('var(--ag-charts-button-border-width)');
            });

            it('a state border object applies its colour and width', () => {
                const { dm } = setup();

                dm.setThemeParameters({ buttonActiveBorder: { color: 'green', width: 6 } });

                expect(cssVar(dm, 'active-border-color')).toBe('green');
                expect(cssVar(dm, 'active-border-width')).toBe('6px');
            });

            it('a state border object fills an unset colour or width from buttonBorder', () => {
                const { dm } = setup();

                dm.setThemeParameters({ buttonHoverBorder: { width: 4 }, buttonDisabledBorder: { color: 'red' } });

                expect(cssVar(dm, 'hover-border-color')).toBe('var(--ag-charts-button-border-color)');
                expect(cssVar(dm, 'hover-border-width')).toBe('4px');
                expect(cssVar(dm, 'disabled-border-color')).toBe('red');
                expect(cssVar(dm, 'disabled-border-width')).toBe('var(--ag-charts-button-border-width)');
            });

            it('a state border set to false hides the colour and keeps the base width', () => {
                const { dm } = setup();

                dm.setThemeParameters({ buttonDisabledBorder: false });

                expect(cssVar(dm, 'disabled-border-color')).toBe('transparent');
                expect(cssVar(dm, 'disabled-border-width')).toBe('var(--ag-charts-button-border-width)');
            });
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
            // A canvas re-parented into a replacement chart's DOM must survive the deferred teardown.
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
