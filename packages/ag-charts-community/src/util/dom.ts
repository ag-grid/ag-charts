import { getDocument, getWindow } from 'ag-charts-core';
import type { AgIconName } from 'ag-charts-types';

import { BBoxValues } from './bboxinterface';

export function setElementBBox(element: HTMLElement | undefined, bbox: Partial<BBoxValues>) {
    if (!element) return;
    bbox = BBoxValues.normalize(bbox);

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

let _id = 0;
export function createElementId(label?: string) {
    return `${label ?? 'ag-charts-element'}-${_id++}`;
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
