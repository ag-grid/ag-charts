const verifiedGlobals = {} as { document: Document; window: Window };
const injectCache = new WeakMap<Document, Set<string>>();

if (typeof window !== 'undefined') {
    verifiedGlobals.window = window;
} else if (typeof global !== 'undefined') {
    verifiedGlobals.window = global.window;
}

if (typeof document !== 'undefined') {
    verifiedGlobals.document = document;
} else if (typeof global !== 'undefined') {
    verifiedGlobals.document = global.document;
}

export function getDocument<E>(): Document & E;
export function getDocument<K extends keyof Document>(propertyName: K): Document[K];
export function getDocument<K extends keyof Document>(propertyName?: K) {
    return propertyName ? verifiedGlobals.document?.[propertyName] : verifiedGlobals.document;
}

export function getWindow<E>(): Window & E;
export function getWindow<K extends keyof Window>(propertyName: K): Window[K];
export function getWindow<R = unknown>(propertyName: string): R;
export function getWindow<K extends keyof Window>(propertyName?: K) {
    return propertyName ? verifiedGlobals.window?.[propertyName] : verifiedGlobals.window;
}

export function createElement<K extends keyof HTMLElementTagNameMap>(tagName: K, style?: Partial<CSSStyleDeclaration>) {
    const element = getDocument().createElement<K>(tagName);
    if (style) {
        Object.assign(element.style, style);
    }
    return element;
}

export function createDiv(style: Partial<CSSStyleDeclaration>, ...classNames: string[]) {
    const element = createElement('div');
    element.classList.add(...classNames);
    Object.assign(element.style, style);
    return element;
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

export function injectStyle(cssStyle: string, uniqueId?: string) {
    const document = getDocument();

    if (uniqueId && injectCache.get(document)?.has(uniqueId)) return;

    const styleElement = createElement('style');
    styleElement.innerHTML = cssStyle;
    // Make sure these styles are injected before other styles, so it can be overridden.
    document.head.insertBefore(styleElement, document.head.querySelector('style'));

    if (uniqueId && !injectCache.has(document)) {
        injectCache.set(document, new Set([uniqueId]));
    } else if (uniqueId) {
        injectCache.get(document)?.add(uniqueId);
    }
}

export function setDocument(document: Document) {
    verifiedGlobals.document = document;
}

export function setWindow(window: Window) {
    verifiedGlobals.window = window;
}
