import type { AgIconName } from 'ag-charts-types';

import type { BoxBounds } from '../geometry/boxBounds';
import { getWindow } from './globalsProxy';

type StyledElement = new () => { style: CSSStyleDeclaration };

// getWindow is required to make sure this works on our CI.
// Using Option instead of createElement because it should be faster.
let styleDeclaration: CSSStyleDeclaration;
export function parseColor(color: string): string | null {
    if (styleDeclaration == null) {
        const OptionConstructor = getWindow<StyledElement>('Option');
        styleDeclaration = new OptionConstructor().style;
    }
    styleDeclaration.color = color;
    const result = styleDeclaration.color || null;
    styleDeclaration.color = '';
    return result;
}

export function isDirectionRtl(element?: HTMLElement): boolean {
    return element?.ownerDocument.defaultView?.getComputedStyle(element).direction === 'rtl';
}

export function setElementBBox(element: HTMLElement | undefined, bbox: Partial<BoxBounds>) {
    if (!element) return;
    const { x, y, width, height } = normalizeBounds(bbox);
    setPixelValue(element.style, 'width', width);
    setPixelValue(element.style, 'height', height);
    setPixelValue(element.style, 'left', x);
    setPixelValue(element.style, 'top', y);
}

export function getElementBBox(element: HTMLElement): BoxBounds {
    // Try to read from style first to avoid triggering layout/reflow
    // Only fallback to offsetWidth/offsetHeight if style values aren't set
    const styleWidth = Number.parseFloat(element.style.width);
    const styleHeight = Number.parseFloat(element.style.height);
    const styleX = Number.parseFloat(element.style.left);
    const styleY = Number.parseFloat(element.style.top);

    // Use style values if they're valid numbers, otherwise fallback to offset values
    const width = Number.isFinite(styleWidth) ? styleWidth : element.offsetWidth;
    const height = Number.isFinite(styleHeight) ? styleHeight : element.offsetHeight;
    const x = Number.isFinite(styleX) ? styleX : element.offsetLeft;
    const y = Number.isFinite(styleY) ? styleY : element.offsetTop;

    return { x, y, width, height };
}

export function focusCursorAtEnd(element: HTMLElement) {
    element.focus({ preventScroll: true });

    if (element.lastChild?.textContent == null) return;

    const { ownerDocument } = element;
    const range = ownerDocument.createRange();
    range.setStart(element.lastChild, element.lastChild.textContent.length);
    range.setEnd(element.lastChild, element.lastChild.textContent.length);

    const selection = ownerDocument.defaultView?.getSelection();
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

function normalizeBounds(bbox: Partial<BoxBounds>): Partial<BoxBounds> {
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
