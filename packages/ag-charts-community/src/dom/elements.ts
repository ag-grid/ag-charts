import type { AgIconName } from 'ag-charts-types';

import { type AttributeSet, type InputAttributeSet, setAttribute, setAttributes } from '../util/attributeUtil';
import { createElement } from '../util/dom';
import { isButtonClickEvent } from '../util/keynavUtil';

// These types force a compilation error if the developer tries to add an icon-only
// menu item without an accessible text alternative.
type LabelAndIcon = { label: string; icon?: AgIconName };
type IconOnly = { label?: undefined; icon: AgIconName; altText: string };
export type LabelIcon = LabelAndIcon | IconOnly;

export type ButtonOptions = LabelIcon & {
    onPress: (event: MouseEvent) => void;
};
export function createButton(options: ButtonOptions, attrs?: AttributeSet) {
    const button = createElement('button', getClassName('ag-charts-input ag-charts-button', attrs));
    if (options.label !== undefined) {
        button.append(options.label);
    } else {
        button.append(createIcon(options.icon));
        button.ariaLabel = options.altText;
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
