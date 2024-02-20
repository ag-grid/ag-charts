const verifiedGlobals = {} as { document: Document; window: Window };

if (typeof window !== 'undefined') {
    verifiedGlobals.window = window;
} else if (typeof global !== 'undefined') {
    verifiedGlobals.window = global.window;
} else {
    throw new Error('AG Charts - unable to resolve global window.');
}
if (typeof document !== 'undefined') {
    verifiedGlobals.document = document;
} else if (typeof global !== 'undefined') {
    verifiedGlobals.document = global.document;
} else {
    throw new Error('AG Charts - unable to resolve global document.');
}

export function getDocument() {
    return verifiedGlobals.document;
}

export function getWindow(): Window;
export function getWindow<K extends keyof Window>(propertyName: K): Window[K];
export function getWindow<K extends string>(propertyName: K): unknown;
export function getWindow<K extends keyof Window>(propertyName?: K) {
    return propertyName ? verifiedGlobals.window[propertyName] : verifiedGlobals.window;
}

export function createElement<K extends keyof HTMLElementTagNameMap>(tagName: K, options?: ElementCreationOptions) {
    return getDocument().createElement<K>(tagName, options);
}

export function downloadUrl(dataUrl: string, fileName: string) {
    const { body } = getDocument();
    const element = createElement('a');
    element.href = dataUrl;
    element.download = fileName;
    element.style.display = 'none';
    body.appendChild(element);
    element.click();
    setTimeout(() => body.removeChild(element));
}

export function injectStyle(cssStyle: string) {
    const document = getDocument();
    const styleElement = document.createElement('style');
    styleElement.innerHTML = cssStyle;
    // Make sure these styles are injected before other styles, so it can be overridden.
    document.head.insertBefore(styleElement, document.head.querySelector('style'));
}
