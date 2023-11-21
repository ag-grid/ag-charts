export function injectStyle(document: Document, cssStyle: string) {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = cssStyle;
    // Make sure these styles are injected before other styles, so it can be overridden.
    document.head.insertBefore(styleElement, document.head.querySelector('style'));
}
