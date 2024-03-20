import { isFiniteNumber, isString, isValidDate } from './type-guards';
import type { PlainObject } from './types';

type StringObject = PlainObject & { toString: () => string };
type NumberObject = PlainObject & { valueOf: () => string };

export const isStringObject = (value: unknown): value is StringObject =>
    !!value && Object.hasOwn(value, 'toString') && isString(value.toString());

const isNumberObject = (value: unknown): value is NumberObject =>
    !!value && Object.hasOwn(value, 'valueOf') && isFiniteNumber(value.valueOf());

export const isContinuous = (value: unknown): value is number | Date | NumberObject =>
    isFiniteNumber(value) || isNumberObject(value) || isValidDate(value);

export function checkDatum<T>(value: T, isContinuousScale: boolean): boolean {
    return (!isContinuousScale || isContinuous(value)) && value != null;
}

/**
 * To enable duplicate categories, a category axis value on a datum from integrated charts is transformed into an
 * object with `getString()` and `id` properties. The string value can be non-unique so we must instead use the
 * unique id property.
 *
 * @see https://ag-grid.atlassian.net/browse/AG-10526
 */
export function transformIntegratedCategoryValue(value: unknown) {
    if (isStringObject(value) && Object.hasOwn(value, 'id')) {
        return value.id;
    }
    return value;
}
