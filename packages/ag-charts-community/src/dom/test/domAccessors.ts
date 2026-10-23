import { expect } from 'vitest';

import type { SizeMonitor } from 'ag-charts-core';

import type { DOMManager } from '../domManager';

// `DOMManager` keeps these private; they are the state its public behaviour is built from.
interface DOMManagerInternals {
    element: HTMLElement;
    sizeMonitor: SizeMonitor;
    deferredProxies: Map<string, unknown>;
    updateContainerSize(): void;
}

interface DOMManagerStatics {
    headStyles: WeakMap<HTMLHeadElement, Set<string>>;
}

function internalsOf(dm: DOMManager): DOMManagerInternals {
    return dm as unknown as DOMManagerInternals;
}

/** The wrapper element the manager built for the chart, asserted to exist. */
export function getManagerElement(dm: DOMManager): HTMLElement {
    const { element } = internalsOf(dm);
    expect(element, 'DOMManager element').toBeInstanceOf(HTMLElement);
    return element;
}

/** The size monitor the manager observes its container with, so a test can spy on it. */
export function getManagerSizeMonitor(dm: DOMManager): SizeMonitor {
    const { sizeMonitor } = internalsOf(dm);
    expect(sizeMonitor, 'DOMManager size monitor').toBeDefined();
    return sizeMonitor;
}

/** Whether a deferred proxy is still registered under `<domElementClass>:<id>`. */
export function hasDeferredProxy(dm: DOMManager, domElementClass: string, id: string): boolean {
    return internalsOf(dm).deferredProxies.has(`${domElementClass}:${id}`);
}

/** Re-applies `containerSize` to the canvas-center element, as the size monitor does when the container resizes. */
export function applyContainerSize(dm: DOMManager): void {
    internalsOf(dm).updateContainerSize();
}

/**
 * Forgets which styles the manager already injected into `head`. They are shared per document, so a test that
 * inspects the head has to reset them to stay independent of the tests before it.
 */
export function clearInjectedHeadStyles(managerClass: typeof DOMManager, head: HTMLHeadElement): void {
    const { headStyles } = managerClass as unknown as DOMManagerStatics;
    expect(headStyles, 'DOMManager head styles').toBeInstanceOf(WeakMap);
    headStyles.delete(head);
}

/**
 * jsdom does not implement `computedStyleMap()`; stubs it so the element reads as `overflow: auto`, which is what
 * makes `findScrollableContainer()` accept it as a scrollable ancestor.
 */
export function stubScrollableOverflow(element: Element): void {
    Reflect.set(element, 'computedStyleMap', () => ({ get: () => 'auto' }));
}

/** A `getComputedStyle()` result that carries only the zero container padding the size measurement reads. */
export function zeroPaddingComputedStyle(): CSSStyleDeclaration {
    // Only the four padding properties are read; a full declaration would add nothing to what the tests assert.
    return {
        paddingLeft: '0px',
        paddingRight: '0px',
        paddingTop: '0px',
        paddingBottom: '0px',
    } as unknown as CSSStyleDeclaration;
}
