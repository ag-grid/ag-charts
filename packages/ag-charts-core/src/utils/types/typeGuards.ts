import type { CssColor } from 'ag-charts-types';

import type { PlainObject } from '../../types/global';
import { parseColor } from '../dom/domUtil';

export function isDefined<T>(val: T | undefined | null): val is T {
    return val != null;
}

export function isArray<T>(value: T | T[]): value is T[];
export function isArray(value: unknown): value is unknown[];
export function isArray(value: unknown) {
    return Array.isArray(value);
}

export function isBoolean(value: unknown): value is boolean {
    return typeof value === 'boolean';
}

export function isDate(value: unknown): value is Date {
    return value instanceof Date;
}

export function isValidDate(value: unknown): value is Date {
    return isDate(value) && !Number.isNaN(Number(value));
}

export function isRegExp(value: unknown): value is RegExp {
    return value instanceof RegExp;
}

export function isFunction(value: unknown): value is Function {
    return typeof value === 'function';
}

export function isObject(value: unknown): value is PlainObject {
    return typeof value === 'object' && value !== null && !isArray(value);
}

export function isObjectLike(value: unknown): value is PlainObject | unknown[] {
    return isArray(value) || isPlainObject(value);
}

export function isPlainObject(value: unknown): value is PlainObject {
    return typeof value === 'object' && value !== null && value.constructor?.name === 'Object';
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export function isEmptyObject(value: unknown): value is {} {
    if (typeof value !== 'object' || value === null) return false;

    // eslint-disable-next-line sonarjs/no-unused-vars -- iteration variable only used to check if object has any properties
    for (const _ in value) {
        return false;
    }

    return true;
}

export function isString(value: unknown): value is string {
    return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
    return typeof value === 'number';
}

export function isFiniteNumber(value: unknown): value is number {
    return Number.isFinite(value);
}

export function isHtmlElement(value: unknown): value is HTMLElement {
    // SSR-safe: use duck-typing via nodeType and style property instead of instanceof
    return value != null && (value as Node).nodeType === 1 && 'style' in (value as HTMLElement);
}

export function isEnumKey<T extends object>(enumObject: T, enumKey: keyof T): enumKey is keyof T {
    return isString(enumKey) && Object.keys(enumObject).includes(enumKey);
}

export function isEnumValue<T extends object>(enumObject: T, enumValue: unknown): enumValue is T[keyof T] {
    return Object.values(enumObject).includes(enumValue);
}

export function isSymbol(value: unknown): value is symbol {
    return typeof value === 'symbol';
}

export function isColor(value: unknown): value is CssColor {
    return isString(value) && (value === 'none' || parseColor(value) != null);
}

export function isKeyOf<T extends object>(value: keyof any, container: T): value is keyof T {
    return value in container;
}
