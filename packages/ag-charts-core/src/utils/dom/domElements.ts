import type { AgDocument } from './agDocument';
import type { StrictHTMLElement } from './attributeUtil';
import { getDocument } from './globalsProxy';

/**
 * Creates an HTML element with optional class names and inline styles.
 * @param tagName - The name of the HTML element to create.
 * @param className - A space-separated string of class names or a style object (optional).
 * @param style - An object representing CSS styles (optional).
 * @returns The created HTML element.
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
    tagName: K,
    className?: string,
    style?: Partial<CSSStyleDeclaration>
): HTMLElementTagNameMap[K] & StrictHTMLElement;
export function createElement<K extends keyof HTMLElementTagNameMap>(
    tagName: K,
    style?: Partial<CSSStyleDeclaration>
): HTMLElementTagNameMap[K] & StrictHTMLElement;
export function createElement<K extends keyof HTMLElementTagNameMap>(
    tagName: K,
    className?: string | Partial<CSSStyleDeclaration>,
    style?: Partial<CSSStyleDeclaration>
) {
    const element = getDocument().createElement<K>(tagName);
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

/**
 * Creates a `<style>` element carrying the CSP nonce, where one is configured. Every dynamically
 * injected stylesheet must be created here: a nonce-only `style-src` blocks an un-nonced element
 * outright, so the nonce cannot be left to each call site to remember.
 * @param styleNonce - The configured `styleNonce` chart option, if any.
 * @param agDocument - Owning document, for elements that must belong to the chart's own document
 * rather than the global one (optional).
 * @returns The created `<style>` element.
 */
export function createStyleElement(
    styleNonce: string | undefined,
    agDocument?: AgDocument
): HTMLStyleElement & StrictHTMLElement {
    const element = agDocument ? agDocument.createElement('style') : createElement('style');
    if (styleNonce != null) {
        element.nonce = styleNonce;
    }
    return element;
}

/**
 * Creates an SVG element.
 * @param elementName - The name of the SVG element to create.
 * @returns The created SVG element.
 */
export function createSvgElement<K extends keyof SVGElementTagNameMap>(elementName: K): SVGElementTagNameMap[K] {
    return getDocument().createElementNS('http://www.w3.org/2000/svg', elementName);
}
