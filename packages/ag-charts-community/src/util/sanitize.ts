let element: HTMLElement | null = null;

export function sanitizeHtml(text: string): string;
export function sanitizeHtml(text: string | undefined): string | undefined;

export function sanitizeHtml(text: string | undefined): string | undefined {
    if (typeof text !== 'string') {
        return undefined;
    } else if (text === '') {
        return '';
    }
    element ??= document.createElement('div');
    element.textContent = text;
    return element.innerHTML;
}
