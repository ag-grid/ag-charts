import { toPlainText } from '../data/strings';
import type { NormalisedTextOrSegments } from '../options/normalised/normalisedCommonOptions';
import { createElement } from './domElements';

let element: HTMLElement | null = null;

export function sanitizeHtml(text: NormalisedTextOrSegments): string {
    const plainText = toPlainText(text);
    if (plainText === '') return '';

    element ??= createElement('div');
    element.textContent = plainText;
    return element.innerHTML.replaceAll('\n', '<br>');
}

const HTML_ESCAPES: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
};

/** Escapes markup characters so `text` displays literally when inserted as HTML. Newlines are left as-is. */
export function escapeHtml(text: string): string {
    return text.replaceAll(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}
