import { type BoundingBox, getDocument, getWindow } from 'ag-charts-core';
import type { AgIconName } from 'ag-charts-types';

export function setElementBBox(element: HTMLElement | undefined, bbox: Partial<BoundingBox>) {
    if (!element) return;
    const { x, y, width, height } = normalizeBounds(bbox);
    setPixelValue(element.style, 'width', width);
    setPixelValue(element.style, 'height', height);
    setPixelValue(element.style, 'left', x);
    setPixelValue(element.style, 'top', y);
}

export function getElementBBox(element: HTMLElement): BoundingBox {
    const width = parseFloat(element.style.width) || element.offsetWidth;
    const height = parseFloat(element.style.height) || element.offsetHeight;
    const x = parseFloat(element.style.left) || element.offsetLeft;
    const y = parseFloat(element.style.top) || element.offsetTop;
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

export function isInputPending() {
    // Chrome-specific API for checking if user-input is pending, and we should yield the main thread
    // to allow it to be processed.
    const navigator = getWindow('navigator');
    if ('scheduling' in navigator) {
        const scheduling = navigator.scheduling as { isInputPending(opts?: { includeContinuous?: boolean }): void };
        if ('isInputPending' in scheduling) {
            return scheduling.isInputPending({ includeContinuous: true });
        }
    }

    return false;
}

export function getIconClassNames(icon: AgIconName) {
    return `ag-charts-icon ag-charts-icon-${icon}`;
}

function normalizeBounds(bbox: Partial<BoundingBox>): Partial<BoundingBox> {
    let { x, y, width, height } = bbox;
    if ((width == null || width > 0) && (height == null || height > 0)) {
        return bbox;
    }
    if (x != null && width != null && width < 0) {
        width = -width;
        x = x - width;
    }
    if (y != null && height != null && height < 0) {
        height = -height;
        y = y - height;
    }
    return { x, y, width, height };
}

function setPixelValue(style: CSSStyleDeclaration, key: string, value: number | undefined) {
    if (value == null) {
        style.removeProperty(key);
    } else {
        style.setProperty(key, `${value}px`);
    }
}
