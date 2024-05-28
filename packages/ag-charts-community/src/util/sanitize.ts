import { createElement } from './dom';

let element: HTMLElement | null = null;

export function sanitizeHtml<T extends string | undefined>(text: T): T;
export function sanitizeHtml(text: string | undefined) {
    if (text == null) return;
    if (text === '') {
        return '';
    }
    element ??= createElement('div');
    element.textContent = String(text);
    return element.innerHTML;
}
