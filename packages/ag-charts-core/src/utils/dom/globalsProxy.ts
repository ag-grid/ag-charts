/**
 * Stores verified global `window` and `document` objects.
 */
const verifiedGlobals = {} as { document: Document; window: Window };

if (globalThis.window !== undefined) {
    verifiedGlobals.window = globalThis.window;
}

if (document !== undefined) {
    verifiedGlobals.document = document;
} else if (globalThis.global !== undefined) {
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
