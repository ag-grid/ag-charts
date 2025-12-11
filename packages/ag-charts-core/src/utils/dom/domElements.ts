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
 * Creates an SVG element.
 * @param elementName - The name of the SVG element to create.
 * @returns The created SVG element.
 */
export function createSvgElement<K extends keyof SVGElementTagNameMap>(elementName: K): SVGElementTagNameMap[K] {
    return getDocument().createElementNS('http://www.w3.org/2000/svg', elementName);
}
