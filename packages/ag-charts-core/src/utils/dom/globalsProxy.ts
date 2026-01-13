/**
 * Stores verified global `window` and `document` objects.
 */
const verifiedGlobals = {} as { document: Document; window: Window };

if (typeof globalThis.window !== 'undefined') {
    verifiedGlobals.window = globalThis.window;
}

if (typeof document !== 'undefined') {
    verifiedGlobals.document = document;
} else if (typeof globalThis.global !== 'undefined') {
    verifiedGlobals.document = globalThis.document;
}

/**
 * Retrieves the global `document` object or a specific property of it.
 * @param propertyName - The name of the `document` property to retrieve (optional).
 * @returns The `document` object or the specified property.
 */
export function getDocument<E>(): Document & E;
export function getDocument<K extends keyof Document>(propertyName: K): Document[K];
export function getDocument<K extends keyof Document>(propertyName?: K) {
    return propertyName ? verifiedGlobals.document?.[propertyName] : verifiedGlobals.document;
}

/**
 * Retrieves the global `window` object or a specific property of it.
 * @param propertyName - The name of the `window` property to retrieve (optional).
 * @returns The `window` object or the specified property.
 */
export function getWindow<E>(): Window & E;
export function getWindow<K extends keyof Window>(propertyName: K): Window[K];
export function getWindow<R = unknown>(propertyName: string): R;
export function getWindow<K extends keyof Window>(propertyName?: K) {
    return propertyName ? verifiedGlobals.window?.[propertyName] : verifiedGlobals.window;
}

/**
 * Sets the global `document` object.
 * @param document - The `document` object to set.
 */
export function setDocument(document: Document) {
    verifiedGlobals.document = document;
}

/**
 * Sets the global `window` object.
 * @param window - The `window` object to set.
 */
export function setWindow(window: Window) {
    verifiedGlobals.window = window;
}

/**
 * Retrieves the OffscreenCanvas constructor from the injected window.
 * Falls back to globalThis if window doesn't have it.
 */
export function getOffscreenCanvas(): typeof OffscreenCanvas {
    return (verifiedGlobals.window as any)?.OffscreenCanvas ?? globalThis.OffscreenCanvas;
}

/**
 * Retrieves the Path2D constructor from the injected window.
 * Falls back to globalThis if window doesn't have it.
 */
export function getPath2D(): typeof Path2D {
    return (verifiedGlobals.window as any)?.Path2D ?? globalThis.Path2D;
}

/**
 * Retrieves the DOMMatrix constructor from the injected window.
 * Falls back to globalThis if window doesn't have it.
 */
export function getDOMMatrix(): typeof DOMMatrix {
    return (verifiedGlobals.window as any)?.DOMMatrix ?? globalThis.DOMMatrix;
}

/**
 * Retrieves the Image constructor from the injected window.
 * Falls back to globalThis if window doesn't have it.
 */
export function getImage(): typeof HTMLImageElement {
    return (verifiedGlobals.window as any)?.Image ?? globalThis.Image;
}

// Standard DOM nodeType constants (SSR-safe, no global references needed)
const ELEMENT_NODE = 1;
const DOCUMENT_FRAGMENT_NODE = 11;

/**
 * SSR-safe check for whether an object is a DOM Node.
 * Uses duck-typing via nodeType property instead of instanceof.
 */
export function isNode(obj: unknown): obj is Node {
    return obj != null && typeof (obj as Node).nodeType === 'number';
}

/**
 * SSR-safe check for whether an object is a DOM Element.
 * Uses duck-typing via nodeType property instead of instanceof.
 */
export function isElement(obj: unknown): obj is Element {
    return obj != null && (obj as Node).nodeType === ELEMENT_NODE;
}

/**
 * SSR-safe check for whether an object is a DocumentFragment (e.g. Shadow DOM root).
 * Uses duck-typing via nodeType property instead of instanceof.
 */
export function isDocumentFragment(obj: unknown): obj is DocumentFragment {
    return obj != null && (obj as Node).nodeType === DOCUMENT_FRAGMENT_NODE;
}

/**
 * SSR-safe check for whether an object is an HTMLElement.
 * Uses duck-typing via nodeType and style property instead of instanceof.
 */
export function isHTMLElement(obj: unknown): obj is HTMLElement {
    return obj != null && (obj as Node).nodeType === ELEMENT_NODE && 'style' in (obj as HTMLElement);
}
