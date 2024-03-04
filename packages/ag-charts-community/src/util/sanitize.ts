import { createElement } from './dom';

let element: HTMLElement | null = null;

export function sanitizeHtml(text: string): string;
export function sanitizeHtml(text: string | undefined): string | undefined;

export function sanitizeHtml(text: string | undefined): string | undefined {
    if (text == null) {
        return;
    } else if (text === '') {
        return '';
    }
    element ??= createElement('div');
    element.textContent = String(text);
    return element.innerHTML;
}
