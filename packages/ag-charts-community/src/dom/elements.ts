import type { AgIconName } from 'ag-charts-types';

import { createElement } from '../util/dom';
import { isPlainObject } from '../util/type-guards';

type Attrs<T extends HTMLElement = HTMLElement> = string | Partial<T & MissingAriaAttrs>;
interface MissingAriaAttrs {
    ariaControls?: string;
}

export interface ButtonOptions {
    label: string | HTMLElement;
    onPress: (event: MouseEvent) => void;
}
export function createButton(options: ButtonOptions, attrs?: Attrs<HTMLButtonElement>) {
    const button = createElement('button', getClassName('ag-charts-input ag-charts-button', attrs));
    button.append(options.label);
    button.addEventListener('click', options.onPress);
    applyAttrs(button, attrs);
    return button;
}

export interface CheckboxOptions {
    checked: boolean;
    onChange: (checked: boolean, event: Event) => void;
}
export function createCheckbox(options: CheckboxOptions, attrs?: Attrs<HTMLInputElement>) {
    const checkbox = createElement('input', getClassName('ag-charts-input ag-charts-checkbox', attrs));
    checkbox.type = 'checkbox';
    checkbox.checked = options.checked;
    checkbox.addEventListener('change', (event) => options.onChange(checkbox.checked, event));
    applyAttrs(checkbox, attrs);
    return checkbox;
}

export interface SelectOptions {
    options: Array<{ label: string; value: string }>;
    value: string;
    onChange: (value: string, event: Event) => void;
}
export function createSelect(options: SelectOptions, attrs?: Attrs<HTMLSelectElement>) {
    const select = createElement('select', getClassName('ag-charts-input ag-charts-select', attrs));
    select.append(
        ...options.options.map((option) => {
            const optionEl = createElement('option');
            optionEl.value = option.value;
            optionEl.label = option.label;
            return optionEl;
        })
    );
    select.value = options.value;
    select.addEventListener('change', (event) => options.onChange(select.value, event));
    applyAttrs(select, attrs);
    return select;
}

export interface TextAreaOptions {
    value: string;
    onChange: (value: string, event: Event) => void;
}
export function createTextArea(options: TextAreaOptions, attrs?: Attrs<HTMLTextAreaElement>) {
    const textArea = createElement('textarea', getClassName('ag-charts-input ag-charts-textarea', attrs));
    textArea.value = options.value;
    textArea.addEventListener('input', (event) => options.onChange(textArea.value, event));
    applyAttrs(textArea, attrs);
    return textArea;
}

export function createIcon(icon?: AgIconName) {
    const el = createElement('span', `ag-charts-icon ag-charts-icon-${icon}`);
    el.ariaHidden = 'true';
    return el;
}

function getClassName(baseClass: string, attrs?: Attrs) {
    if (attrs == null) return baseClass;
    if (typeof attrs === 'string') return `${baseClass} ${attrs}`;
    return `${baseClass} ${attrs.className}`;
}

function applyAttrs(element: HTMLElement, attrs?: Attrs) {
    if (!isPlainObject(attrs)) return;
    for (const [key, value] of Object.entries(attrs)) {
        if (key === 'className') continue;
        if (value != null) element.setAttribute(normaliseMissingAriaAttrs(key), `${value}`);
    }
}

function normaliseMissingAriaAttrs(key: string) {
    // Convert camelCaseString to kebab-case-string
    return key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}
