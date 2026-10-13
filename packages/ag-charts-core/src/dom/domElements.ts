import type { AgIconName } from 'ag-charts-types';

import type { AgDocument } from './agDocument';
import {
    type AttributeSet,
    type InputAttributeSet,
    type StrictHTMLElement,
    setAttribute,
    setAttributes,
} from './attributeUtil';
import { getDocument } from './globalsProxy';
import { isButtonClickEvent } from './keynavUtil';

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
    if (className != null && className !== '') {
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

// These types force a compilation error if the developer tries to add an icon-only
// menu item without an accessible text alternative.
type LabelAndIcon = { label: string; icon?: AgIconName };
type IconOnly = { label?: never; icon: AgIconName; altText: string };
export type LabelIcon = LabelAndIcon | IconOnly;

export type ButtonOptions = LabelIcon & {
    onPress: (event: MouseEvent) => void;
};
export function createButton(options: ButtonOptions, attrs?: AttributeSet) {
    const button = createElement('button', getClassName('ag-charts-input ag-charts-button', attrs));
    if (options.label === undefined) {
        button.append(createIcon(options.icon));
        button.ariaLabel = options.altText;
    } else {
        button.append(options.label);
    }
    button.addEventListener('click', options.onPress);
    setAttributes(button, attrs);
    return button;
}

export interface CheckboxOptions {
    checked: boolean;
    onChange: (checked: boolean, event: Event) => void;
}
export function createCheckbox(options: CheckboxOptions, attrs?: AttributeSet) {
    const checkbox = createElement('input', getClassName('ag-charts-input ag-charts-checkbox', attrs));
    checkbox.type = 'checkbox';
    checkbox.checked = options.checked;
    checkbox.addEventListener('change', (event) => options.onChange(checkbox.checked, event));
    checkbox.addEventListener('keydown', (event) => {
        if (isButtonClickEvent(event)) {
            event.preventDefault();
            checkbox.click();
        }
    });
    setAttributes(checkbox, attrs);
    return checkbox;
}

export interface SelectOptions {
    options: Array<{ label: string; value: string }>;
    value: string;
    onChange: (value: string, event: Event) => void;
}
export function createSelect(options: SelectOptions, attrs?: AttributeSet) {
    const select = createElement('select', getClassName('ag-charts-input ag-charts-select', attrs));
    select.append(
        ...options.options.map((option) => {
            const optionEl = createElement('option');
            optionEl.value = option.value;
            optionEl.textContent = option.label;
            return optionEl;
        })
    );
    setAttribute(select, 'data-preventdefault', false);
    select.value = options.value;
    select.addEventListener('change', (event) => options.onChange(select.value, event));
    setAttributes(select, attrs);
    return select;
}

export interface TextAreaOptions {
    value: string;
    onChange: (value: string, event: Event) => void;
}
export function createTextArea(options: TextAreaOptions, attrs?: InputAttributeSet) {
    const textArea = createElement('textarea', getClassName('ag-charts-input ag-charts-textarea', attrs));
    textArea.value = options.value;
    textArea.addEventListener('input', (event) => options.onChange(textArea.value, event));
    setAttributes(textArea, attrs);
    setAttribute(textArea, 'data-preventdefault', false); // AG-13715
    return textArea;
}

export function createIcon(icon?: AgIconName) {
    const el = createElement('span', `ag-charts-icon ag-charts-icon-${icon}`);
    setAttribute(el, 'aria-hidden', true);
    return el;
}

function getClassName(baseClass: string, attrs?: AttributeSet) {
    if (attrs == null) return baseClass;
    return `${baseClass} ${attrs.class}`;
}
