import { describe, expect, it, vi } from 'vitest';

import type { Size } from './sizeMonitor';
import { SizeMonitor } from './sizeMonitor';

// Capture the ResizeObserver callback registered by SizeMonitor so we can
// simulate browser-fired resize events in tests.
let resizeObserverCallback: ResizeObserverCallback | undefined;

function createMockAgDocument({ ready = true } = {}) {
    return {
        isReady: () => ready,
        attachListener: () => () => {},
        createResizeObserver(callback: ResizeObserverCallback) {
            resizeObserverCallback = callback;
            return { observe: () => {}, unobserve: () => {}, disconnect: () => {} };
        },
        createIntersectionObserver: () => undefined,
        devicePixelRatio: 1,
        matchMedia: () => ({ addEventListener: () => {}, removeEventListener: () => {} }),
    } as any;
}

function fireResizeObserver(element: HTMLElement, width: number, height: number) {
    resizeObserverCallback?.([{ target: element, contentRect: { width, height } } as any], {} as any);
}

function mockElement(opts: {
    clientWidth: number;
    clientHeight: number;
    paddingLeft?: string;
    paddingRight?: string;
    paddingTop?: string;
    paddingBottom?: string;
}): HTMLElement {
    const element = document.createElement('div');
    Object.defineProperty(element, 'clientWidth', { value: opts.clientWidth });
    Object.defineProperty(element, 'clientHeight', { value: opts.clientHeight });

    const style = {
        paddingLeft: opts.paddingLeft ?? '0px',
        paddingRight: opts.paddingRight ?? '0px',
        paddingTop: opts.paddingTop ?? '0px',
        paddingBottom: opts.paddingBottom ?? '0px',
    };
    vi.spyOn(element.ownerDocument.defaultView!, 'getComputedStyle').mockReturnValue(style as any);

    return element;
}

describe('SizeMonitor', () => {
    beforeEach(() => {
        resizeObserverCallback = undefined;
    });

    describe('CRT-1065: synchronous initial read must use content-box dimensions', () => {
        it('should report content-box size matching ResizeObserver contentRect', () => {
            const sizeMonitor = new SizeMonitor(createMockAgDocument());

            // clientWidth/clientHeight include padding, so the content box is 1166 by 586.
            const element = mockElement({
                clientWidth: 1200,
                clientHeight: 620,
                paddingLeft: '17px',
                paddingRight: '17px',
                paddingTop: '17px',
                paddingBottom: '17px',
            });

            const sizes: Size[] = [];
            sizeMonitor.observe(element, (size) => sizes.push({ ...size }));

            // Synchronous initial read should report content-box: 1166×586.
            expect(sizes).toHaveLength(1);
            expect(sizes[0]).toMatchObject({ width: 1166, height: 586 });

            // ResizeObserver fires with identical content-box dimensions.
            fireResizeObserver(element, 1166, 586);

            // No second callback — sizes match, no spurious resize.
            expect(sizes).toHaveLength(1);
        });

        it('should report exact size when element has no padding', () => {
            const sizeMonitor = new SizeMonitor(createMockAgDocument());

            const element = mockElement({ clientWidth: 800, clientHeight: 600 });

            const sizes: Size[] = [];
            sizeMonitor.observe(element, (size) => sizes.push({ ...size }));

            expect(sizes).toHaveLength(1);
            expect(sizes[0]).toMatchObject({ width: 800, height: 600 });

            // ResizeObserver fires with same dimensions — no second callback.
            fireResizeObserver(element, 800, 600);
            expect(sizes).toHaveLength(1);
        });

        it('should still fire callback when ResizeObserver reports a genuinely different size', () => {
            const sizeMonitor = new SizeMonitor(createMockAgDocument());

            const element = mockElement({ clientWidth: 800, clientHeight: 600 });

            const sizes: Size[] = [];
            sizeMonitor.observe(element, (size) => sizes.push({ ...size }));
            expect(sizes).toHaveLength(1);

            // ResizeObserver fires with a genuinely different size (e.g. container resized).
            fireResizeObserver(element, 900, 700);
            expect(sizes).toHaveLength(2);
            expect(sizes[1]).toMatchObject({ width: 900, height: 700 });
        });
    });

    describe('refresh() re-reads an observed element after it gains a size', () => {
        it('emits the laid-out size when a detached element is later attached', () => {
            const sizeMonitor = new SizeMonitor(createMockAgDocument());

            // Observed while detached: clientWidth/Height 0, so the initial read emits nothing.
            let measured = { width: 0, height: 0 };
            const element = document.createElement('div');
            Object.defineProperty(element, 'clientWidth', { get: () => measured.width });
            Object.defineProperty(element, 'clientHeight', { get: () => measured.height });
            vi.spyOn(element.ownerDocument.defaultView!, 'getComputedStyle').mockReturnValue({
                paddingLeft: '0px',
                paddingRight: '0px',
                paddingTop: '0px',
                paddingBottom: '0px',
            } as any);

            const sizes: Size[] = [];
            sizeMonitor.observe(element, (size) => sizes.push({ ...size }));
            expect(sizes).toHaveLength(0);

            // Element is attached and laid out; refresh() re-reads the now-available size.
            measured = { width: 400, height: 250 };
            sizeMonitor.refresh(element);

            expect(sizes).toHaveLength(1);
            expect(sizes[0]).toMatchObject({ width: 400, height: 250 });
        });

        it('is a no-op for an element that is not observed', () => {
            const sizeMonitor = new SizeMonitor(createMockAgDocument());
            const element = mockElement({ clientWidth: 400, clientHeight: 250 });

            expect(() => sizeMonitor.refresh(element)).not.toThrow();
        });
    });
});
