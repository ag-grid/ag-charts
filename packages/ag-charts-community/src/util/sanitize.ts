let element: HTMLElement | null = null;

export function sanitizeHtml(text?: string): string {
    if (!text) {
        return '';
    }
    element ??= document.createElement('div');
    element.textContent = text;
    return element.innerHTML;
}
