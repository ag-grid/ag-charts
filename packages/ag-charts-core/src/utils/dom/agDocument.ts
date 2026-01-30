import type { StrictHTMLElement } from './attributeUtil';

export class AgDocument {
    constructor(
        public readonly ownerDocument: Document,
        public readonly window: Window = ownerDocument.defaultView ??
            (() => {
                throw new Error('AG Charts - unable to resolve window');
            })()
    ) {}

    get body() {
        return this.ownerDocument.body;
    }

    get head() {
        return this.ownerDocument.head;
    }

    get activeElement() {
        return this.ownerDocument.activeElement;
    }

    isReady(): boolean {
        return this.ownerDocument.readyState === 'complete';
    }

    createElement<K extends keyof HTMLElementTagNameMap>(
        tagName: K,
        className?: string,
        style?: Partial<CSSStyleDeclaration>
    ): HTMLElementTagNameMap[K] & StrictHTMLElement;
    createElement<K extends keyof HTMLElementTagNameMap>(
        tagName: K,
        style?: Partial<CSSStyleDeclaration>
    ): HTMLElementTagNameMap[K] & StrictHTMLElement;
    createElement<K extends keyof HTMLElementTagNameMap>(
        tagName: K,
        className?: string | Partial<CSSStyleDeclaration>,
        style?: Partial<CSSStyleDeclaration>
    ) {
        const element = this.ownerDocument.createElement<K>(tagName);
        if (typeof className === 'object') {
            style = className;
            className = undefined;
        }
        if (className) {
            for (const name of className.split(' ')) {
                element.classList.add(name);
            }
        }
        if (style) {
            Object.assign(element.style, style);
        }
        return element;
    }

    createSvgElement<K extends keyof SVGElementTagNameMap>(elementName: K): SVGElementTagNameMap[K] {
        return this.ownerDocument.createElementNS('http://www.w3.org/2000/svg', elementName);
    }
}

const agDocumentCache = new WeakMap<Document, AgDocument>();

export type AgDocumentLike = AgDocument | Document;

export function toAgDocument(document?: AgDocumentLike): AgDocument | undefined {
    if (!document) return undefined;
    if (document instanceof AgDocument) return document;
    let resolved = agDocumentCache.get(document);
    if (!resolved) {
        resolved = new AgDocument(document);
        agDocumentCache.set(document, resolved);
    }
    return resolved;
}
