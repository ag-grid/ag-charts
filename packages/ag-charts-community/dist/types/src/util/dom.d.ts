export declare function getDocument(): Document;
export declare function getWindow<E>(): Window & E;
export declare function getWindow<K extends keyof Window>(propertyName: K): Window[K];
export declare function getWindow<R = unknown>(propertyName: string): R;
export declare function createElement<K extends keyof HTMLElementTagNameMap>(tagName: K, options?: ElementCreationOptions): HTMLElementTagNameMap[K];
export declare function downloadUrl(dataUrl: string, fileName: string): void;
export declare function injectStyle(cssStyle: string, uniqueId?: string): void;
export declare function setDocument(document: Document): void;
export declare function setWindow(window: Window): void;
