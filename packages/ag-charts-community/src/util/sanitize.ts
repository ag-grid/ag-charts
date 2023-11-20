let element: HTMLElement | null = null;

export function sanitizeHtml(text: string): string;
export function sanitizeHtml(text: string | undefined): string | undefined;

export function sanitizeHtml(text: string | undefined): string | undefined {
    if (text == null) {
        return undefined;
    } else if (text === '') {
        return '';
    }
    element ??= document.createElement('div');
    element.textContent = String(text);
    return element.innerHTML;
}
