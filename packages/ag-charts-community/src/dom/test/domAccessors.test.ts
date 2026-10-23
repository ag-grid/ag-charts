import { describe, expect, it } from 'vitest';

import { AgDocument, EventEmitter, getDocument } from 'ag-charts-core';

import { DOMManager } from '../domManager';
import {
    applyContainerSize,
    clearInjectedHeadStyles,
    getManagerElement,
    getManagerSizeMonitor,
    hasDeferredProxy,
    stubScrollableOverflow,
    zeroPaddingComputedStyle,
} from './domAccessors';

describe('domAccessors', () => {
    const doc = new AgDocument(getDocument());

    const createManager = () => {
        const container = doc.createElement('div');
        doc.body.append(container);
        return new DOMManager(new EventEmitter(), undefined, doc, container);
    };

    it('getManagerElement returns the wrapper the manager built', () => {
        const element = getManagerElement(createManager());
        expect(element.classList.contains('ag-charts-wrapper')).toBe(true);
    });

    it('getManagerSizeMonitor returns the monitor the manager observes with', () => {
        expect(getManagerSizeMonitor(createManager())).toBeDefined();
    });

    it('hasDeferredProxy follows addDeferredProxyChild and removeChild', () => {
        const dm = createManager();
        expect(hasDeferredProxy(dm, 'canvas-overlay', 'proxy')).toBe(false);
        dm.addDeferredProxyChild('canvas-overlay', 'proxy');
        expect(hasDeferredProxy(dm, 'canvas-overlay', 'proxy')).toBe(true);
        dm.removeChild('canvas-overlay', 'proxy');
        expect(hasDeferredProxy(dm, 'canvas-overlay', 'proxy')).toBe(false);
    });

    it('applyContainerSize writes the floored container size to canvas-center', () => {
        const dm = createManager();
        dm.containerSize = { width: 10.9, height: 20.9, pixelRatio: 1 };
        applyContainerSize(dm);
        expect(dm.getParent('canvas-center').style.width).toBe('10px');
        expect(dm.getParent('canvas-center').style.height).toBe('20px');
    });

    it('clearInjectedHeadStyles lets the manager inject its head styles again', () => {
        doc.head.innerHTML = '';
        clearInjectedHeadStyles(DOMManager, doc.head);
        createManager();
        expect(doc.head.children.length).toBeGreaterThan(0);

        // The manager remembers it already injected, so an emptied head stays empty until the memory is cleared.
        doc.head.innerHTML = '';
        createManager();
        expect(doc.head.children.length).toBe(0);

        clearInjectedHeadStyles(DOMManager, doc.head);
        createManager();
        expect(doc.head.children.length).toBeGreaterThan(0);

        doc.head.innerHTML = '';
        clearInjectedHeadStyles(DOMManager, doc.head);
    });

    it('stubScrollableOverflow makes computedStyleMap report overflow auto', () => {
        const element = doc.createElement('div');
        stubScrollableOverflow(element);
        expect(
            (element as unknown as { computedStyleMap(): { get(p: string): string } })
                .computedStyleMap()
                .get('overflow')
        ).toBe('auto');
    });

    it('zeroPaddingComputedStyle reports zero padding on every side', () => {
        const style = zeroPaddingComputedStyle();
        expect([style.paddingLeft, style.paddingRight, style.paddingTop, style.paddingBottom]).toEqual([
            '0px',
            '0px',
            '0px',
            '0px',
        ]);
    });
});
