export function isDefined<T>(val: T | undefined | null): val is T {
    return val != null;
}

export function isArray<T>(value: T | T[]): value is T[] {
    return Array.isArray(value);
}

export function isBoolean(value: unknown): value is boolean {
    return typeof value === 'boolean';
}

export function isDate(value: unknown): value is Date {
    return value instanceof Date;
}

export function isValidDate(value: unknown): value is Date {
    return isDate(value) && !isNaN(Number(value));
}

export function isFunction(value: unknown): value is Function {
    return typeof value === 'function';
}

export function isObject(value: unknown): value is object {
    return typeof value === 'object' && value !== null && !isArray(value);
}

export function isString(value: unknown): value is string {
    return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
    return typeof value === 'number';
}

export function isFiniteNumber(value: unknown): value is number {
    return isNumber(value) && Number.isFinite(value);
}
