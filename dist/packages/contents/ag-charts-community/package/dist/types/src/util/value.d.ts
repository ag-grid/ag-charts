import type { PlainObject } from './types';
type StringObject = PlainObject & {
    toString: () => string;
};
type NumberObject = PlainObject & {
    valueOf: () => number;
};
export declare function isStringObject(value: unknown): value is StringObject;
export declare function isNumberObject(value: unknown): value is NumberObject;
export declare function isContinuous(value: unknown): value is number | Date | NumberObject;
export declare function checkDatum<T>(value: T, isContinuousScale: boolean): boolean;
/**
 * To enable duplicate categories, a category axis value on a datum from integrated charts is transformed into an
 * object with `getString()` and `id` properties. The string value can be non-unique so we must instead use the
 * unique id property.
 *
 * @see https://ag-grid.atlassian.net/browse/AG-10526
 */
export declare function transformIntegratedCategoryValue(value: unknown): any;
export {};
