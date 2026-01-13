import type { Direction } from 'ag-charts-types';

import type { Nullable } from '../../types/global';
import type { ElementID } from '../../types/idBranding';
import { entries } from '../data/iterators';
import { isHTMLElement } from './globalsProxy';

export type StrictHTMLElement = HTMLElement & { id: ElementID };

type AriaRole =
    | 'figure'
    | 'group'
    | 'img'
    | 'list'
    | 'listitem'
    | 'menu'
    | 'menuitem'
    | 'menuitemradio'
    | 'presentation'
    | 'radio'
    | 'radiogroup'
    | 'separator'
    | 'status'
    | 'switch'
    | 'tab'
    | 'tablist'
    | 'tabpanel'
    | 'textbox'
    | 'toolbar';

export type BaseAttributeTypeMap = {
    role: AriaRole;
    'aria-checked': boolean;
    'aria-controls': ElementID;
    'aria-describedby': ElementID;
    'aria-disabled': boolean;
    'aria-expanded': boolean;
    'aria-haspopup': 'true' | 'false' | 'menu' | 'dialog' | 'grid' | 'listbox' | 'tree';
    'aria-hidden': boolean;
    'aria-label': string;
    'aria-labelledby': ElementID;
    'aria-live': 'assertive' | 'polite';
    'aria-orientation': Direction;
    'aria-selected': boolean;
    'data-focus-override': boolean;
    'data-focus-visible-override': boolean;
    'data-preventdefault': boolean;
    class: string;
    for: ElementID;
    id: ElementID;
    tabindex: 0 | -1;
    title: string;
};

type InputAttributeTypeMap = BaseAttributeTypeMap & {
    placeholder: string;
};

// Map used to getAttribute:
// Do not validate values, getAttribute assumes that setAttribute would be used.
function booleanParser(value: string): boolean {
    return value === 'true';
}
function numberParser<T extends number = number>(value: string): T {
    return Number(value) as T;
}
function stringParser<T extends string = string>(value: string): T {
    return value as T;
}
const AttributeTypeParsers: { [K in keyof InputAttributeTypeMap]: (value: string) => InputAttributeTypeMap[K] } = {
    role: stringParser<AriaRole>,
    'aria-checked': booleanParser,
    'aria-controls': stringParser<ElementID>,
    'aria-describedby': stringParser<ElementID>,
    'aria-disabled': booleanParser,
    'aria-expanded': booleanParser,
    'aria-haspopup': stringParser<BaseAttributeTypeMap['aria-haspopup']>,
    'aria-hidden': booleanParser,
    'aria-label': stringParser,
    'aria-labelledby': stringParser<ElementID>,
    'aria-live': stringParser<BaseAttributeTypeMap['aria-live']>,
    'aria-orientation': stringParser<Direction>,
    'aria-selected': booleanParser,
    'data-focus-override': booleanParser,
    'data-focus-visible-override': booleanParser,
    'data-preventdefault': booleanParser,
    class: stringParser,
    for: stringParser<ElementID>,
    id: stringParser<ElementID>,
    tabindex: numberParser<0 | -1>,
    title: stringParser,
    placeholder: stringParser,
};

export type AttributeSet = Partial<{ [K in keyof BaseAttributeTypeMap]: BaseAttributeTypeMap[K] }>;
export type InputAttributeSet = Partial<{ [K in keyof InputAttributeTypeMap]: InputAttributeTypeMap[K] }>;

export type BaseStyleTypeMap = {
    cursor: 'default' | 'pointer' | 'ew-resize' | 'ns-resize' | 'grab' | 'grabbing';
    display: 'none';
    position: 'absolute';
    'pointer-events': 'auto' | 'none';
    width: '100%';
    height: '100%';
};

type StyleSet = Partial<{ [K in keyof BaseStyleTypeMap]: BaseStyleTypeMap[K] }>;

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
    // eslint-disable-next-line sonarjs/different-types-comparison
    if (value == null || value === '' || value === '') {
        e?.removeAttribute(qualifiedName);
    } else {
        e?.setAttribute(qualifiedName, value.toString());
    }
}

export function setAttributes(e: Nullable<HTMLElement>, attrs: AttributeSet | undefined): void;
export function setAttributes(e: Nullable<HTMLTextAreaElement>, attrs: InputAttributeTypeMap | undefined): void;
export function setAttributes(e: Nullable<HTMLElement>, attrs: AttributeSet | undefined) {
    if (attrs == null) return;

    for (const [key, value] of entries(attrs)) {
        if (key === 'class') continue;
        setAttribute(e as HTMLElement, key as any, value as any);
    }
}

export function getAttribute<
    A extends keyof BaseAttributeTypeMap,
    DefaultType extends BaseAttributeTypeMap[A] | undefined,
>(
    e: Nullable<HTMLElement | EventTarget>,
    qualifiedName: A,
    defaultValue?: DefaultType
): BaseAttributeTypeMap[A] | (DefaultType extends undefined ? undefined : never);

export function getAttribute<
    A extends keyof InputAttributeTypeMap,
    DefaultType extends InputAttributeTypeMap[A] | undefined,
>(
    e: Nullable<HTMLTextAreaElement>,
    qualifiedName: A,
    defaultValue?: DefaultType
): InputAttributeTypeMap[A] | (DefaultType extends undefined ? undefined : never);

export function getAttribute<A extends keyof BaseAttributeTypeMap>(
    e: Nullable<EventTarget>,
    qualifiedName: A,
    defaultValue?: BaseAttributeTypeMap[A]
): BaseAttributeTypeMap[A] | undefined {
    if (!isHTMLElement(e)) return undefined;

    const value = e.getAttribute(qualifiedName);
    if (value === null) return defaultValue;

    return AttributeTypeParsers[qualifiedName]?.(value) ?? undefined;
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
        e.style.setProperty(property, value.toString());
    }
}
export function setElementStyles(e: Nullable<HTMLElement>, styles: StyleSet) {
    for (const [key, value] of entries(styles)) {
        setElementStyle(e as HTMLElement, key as any, value);
    }
}
