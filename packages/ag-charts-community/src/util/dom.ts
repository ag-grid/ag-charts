import type { AgIconName } from 'ag-charts-types';

import type { BBoxValues } from './bboxinterface';

const verifiedGlobals = {} as { document: Document; window: Window };

if (typeof window !== 'undefined') {
    verifiedGlobals.window = window;
} else if (typeof global !== 'undefined') {
    verifiedGlobals.window = global.window;
}

if (typeof document !== 'undefined') {
    verifiedGlobals.document = document;
} else if (typeof global !== 'undefined') {
    verifiedGlobals.document = global.document;
}

export function getDocument<E>(): Document & E;
export function getDocument<K extends keyof Document>(propertyName: K): Document[K];
export function getDocument<K extends keyof Document>(propertyName?: K) {
    return propertyName ? verifiedGlobals.document?.[propertyName] : verifiedGlobals.document;
}

export function getWindow<E>(): Window & E;
export function getWindow<K extends keyof Window>(propertyName: K): Window[K];
export function getWindow<R = unknown>(propertyName: string): R;
export function getWindow<K extends keyof Window>(propertyName?: K) {
    return propertyName ? verifiedGlobals.window?.[propertyName] : verifiedGlobals.window;
}

export function createElement<K extends keyof HTMLElementTagNameMap>(
    tagName: K,
    style?: Partial<CSSStyleDeclaration>
): HTMLElementTagNameMap[K];
export function createElement<K extends keyof HTMLElementTagNameMap>(
    tagName: K,
    className?: string,
    style?: Partial<CSSStyleDeclaration>
): HTMLElementTagNameMap[K];
export function createElement<K extends keyof HTMLElementTagNameMap>(
    tagName: K,
    className?: string | Partial<CSSStyleDeclaration>,
    style?: Partial<CSSStyleDeclaration>
) {
    const element = getDocument().createElement<K>(tagName);
    if (typeof className === 'object') {
        style = className;
        className = undefined;
    }
    if (className) {
        for (const name of className.split(' ')) {
            element.classList.add(name);
        }
    }
    if (style) {
        Object.assign(element.style, style);
    }
    return element;
}

export function createElementNS<K extends keyof SVGElementTagNameMap>(
    namespaceURI: 'http://www.w3.org/2000/svg',
    qualifiedName: K
): SVGElementTagNameMap[K];
export function createElementNS(namespaceURI: 'http://www.w3.org/2000/svg', qualifiedName: string) {
    return getDocument().createElementNS(namespaceURI, qualifiedName);
}

export function downloadUrl(dataUrl: string, fileName: string) {
    const { body } = getDocument();
    const element = createElement('a', { display: 'none' });
    element.href = dataUrl;
    element.download = fileName;
    body.appendChild(element);
    element.click();
    setTimeout(() => body.removeChild(element));
}

export function setDocument(document: Document) {
    verifiedGlobals.document = document;
}

export function setWindow(window: Window) {
    verifiedGlobals.window = window;
}

export function setElementBBox(element: HTMLElement | undefined, bbox: Partial<BBoxValues>) {
    if (!element) return;

    if (bbox.width == null) {
        element.style.removeProperty('width');
    } else {
        element.style.width = `${bbox.width}px`;
    }

    if (bbox.height == null) {
        element.style.removeProperty('height');
    } else {
        element.style.height = `${bbox.height}px`;
    }

    if (bbox.x == null) {
        element.style.removeProperty('left');
    } else {
        element.style.left = `${bbox.x}px`;
    }

    if (bbox.y == null) {
        element.style.removeProperty('top');
    } else {
        element.style.top = `${bbox.y}px`;
    }
}

export function getElementBBox(element: HTMLElement): BBoxValues {
    const width = parseFloat(element.style.width) || 0;
    const height = parseFloat(element.style.height) || 0;
    const x = parseFloat(element.style.left) || 0;
    const y = parseFloat(element.style.top) || 0;
    return { x, y, width, height };
}

export function focusCursorAtEnd(element: HTMLElement) {
    element.focus({ preventScroll: true });

    if (element.lastChild?.textContent == null) return;

    const range = getDocument().createRange();
    range.setStart(element.lastChild, element.lastChild.textContent.length);
    range.setEnd(element.lastChild, element.lastChild.textContent.length);

    const selection = getWindow().getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
}

let _id = 0;
export function createElementId(label?: string) {
    return `${label ?? 'ag-charts-element'}-${_id++}`;
}

export function isInputPending() {
    // Chrome-specific API for checking if user-input is pending, and we should yield the main thread
    // to allow it to be processed.
    const navigator = getWindow().navigator;
    if ('scheduling' in navigator) {
        const scheduling: { isInputPending(opts?: { includeContinuous?: boolean }): void } =
            navigator.scheduling as any;
        if ('isInputPending' in scheduling) {
            return scheduling.isInputPending({ includeContinuous: true });
        }
    }

    return false;
}

export function getIconClassNames(icon: AgIconName) {
    return `ag-charts-icon ag-charts-icon-${icon}`;
}
