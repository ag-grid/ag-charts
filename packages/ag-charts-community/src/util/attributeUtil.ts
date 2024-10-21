import type { Nullable } from './types';

type ElementID = string;

type BaseAttributeTypeMap = {
    role: 'figure' | 'img' | 'radio' | 'radiogroup' | 'status' | 'switch' | 'tab' | 'tablist' | 'tabpanel';
    'aria-checked': boolean;
    'aria-controls': ElementID;
    'aria-expanded': boolean;
    'aria-haspopup': boolean;
    'aria-hidden': boolean;
    'aria-label': string;
    'aria-labelledby': ElementID;
    'aria-live': 'assertive' | 'polite';
    'aria-selected': boolean;
    'data-preventdefault': boolean;
    class: string;
    id: ElementID;
    tabindex: 0 | -1;
    title: string;
};

type InputAttributeTypeMap = BaseAttributeTypeMap & {
    placeholder: string;
};

export type AttributeSet = Partial<{ [K in keyof BaseAttributeTypeMap]: BaseAttributeTypeMap[K] }>;
export type InputAttributeSet = Partial<{ [K in keyof InputAttributeTypeMap]: InputAttributeTypeMap[K] }>;

type BaseStyleTypeMap = {
    cursor: 'pointer';
};

export function setAttribute<A extends keyof BaseAttributeTypeMap>(
    e: Nullable<HTMLElement>,
    qualifiedName: A,
    value: BaseAttributeTypeMap[A] | undefined
): void;

export function setAttribute<A extends keyof InputAttributeTypeMap>(
    e: Nullable<HTMLTextAreaElement>,
    qualifiedName: A,
    value: InputAttributeTypeMap[A] | undefined
): void;

export function setAttribute<A extends keyof BaseAttributeTypeMap>(
    e: Nullable<HTMLElement>,
    qualifiedName: A,
    value: BaseAttributeTypeMap[A] | undefined
) {
    if (value === undefined || value === '') {
        e?.removeAttribute(qualifiedName);
    } else {
        e?.setAttribute(qualifiedName, value.toString());
    }
}

export function setAttributes(e: Nullable<HTMLElement>, attrs: AttributeSet | undefined): void;
export function setAttributes(e: Nullable<HTMLTextAreaElement>, attrs: InputAttributeTypeMap | undefined): void;
export function setAttributes(e: Nullable<HTMLElement>, attrs: AttributeSet | undefined) {
    if (attrs == null) return;

    let key: keyof typeof attrs;
    for (key in attrs) {
        if (key === 'class') continue;
        setAttribute(e as HTMLElement, key, attrs[key]);
    }
}

export function getAttribute<A extends keyof BaseAttributeTypeMap>(
    e: Nullable<HTMLElement | EventTarget>,
    qualifiedName: A,
    defaultValue?: BaseAttributeTypeMap[A]
): BaseAttributeTypeMap[A] | undefined;

export function getAttribute<A extends keyof InputAttributeTypeMap>(
    e: Nullable<HTMLTextAreaElement>,
    qualifiedName: A,
    defaultValue?: InputAttributeTypeMap[A]
): InputAttributeTypeMap[A] | undefined;

export function getAttribute<A extends keyof BaseAttributeTypeMap>(
    e: Nullable<EventTarget>,
    qualifiedName: A,
    defaultValue?: BaseAttributeTypeMap[A]
): BaseAttributeTypeMap[A] | undefined {
    if (!(e instanceof HTMLElement)) return undefined;

    const value = e.getAttribute(qualifiedName);
    if (value === null) return defaultValue;

    // Do not validate value. Tthis function assumes that setAttribute would be used.
    const type = typeof ({} as BaseAttributeTypeMap)[qualifiedName];
    if (type === 'boolean') return (value === 'true') as BaseAttributeTypeMap[A];
    if (type === 'number') return Number(value) as BaseAttributeTypeMap[A];
    if (type === 'string') return value as BaseAttributeTypeMap[A];

    return undefined;
}

export function setElementStyle<P extends keyof BaseStyleTypeMap>(
    e: Nullable<Pick<HTMLElement, 'style'>>,
    property: P,
    value: BaseStyleTypeMap[P] | undefined
) {
    if (e == null) return;

    if (value == null) {
        e.style.removeProperty(property);
    } else {
        e.style.setProperty(property, value);
    }
}
