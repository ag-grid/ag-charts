import type { NormalisedTextOrSegments } from '../../types/normalised-options/normalisedCommonOptions';
import { toPlainText } from '../data/strings';
import { createElement } from './domElements';

let element: HTMLElement | null = null;

export function sanitizeHtml(text: NormalisedTextOrSegments): string {
    const plainText = toPlainText(text);
    if (plainText === '') return '';

    element ??= createElement('div');
    element.textContent = plainText;
    return element.innerHTML.replaceAll('\n', '<br>');
}
