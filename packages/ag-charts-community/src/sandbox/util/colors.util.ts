import { createElement, getDocument } from '../../util/dom';

export function toRgb(colorName: string): number[] {
    const span = getDocument('body').appendChild(createElement('span', { color: colorName }));
    const { color } = getComputedStyle(span);
    getDocument('body').removeChild(span);
    return color
        .slice(color.indexOf('(') + 1, -1)
        .split(',')
        .map(Number);
}
