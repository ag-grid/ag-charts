export const isString = (v: any) => typeof v === 'string';
export const isStringObject = (v: any) => !!v && Object.hasOwn(v, 'toString') && isString(v.toString());
export const isDate = (v: any) => v instanceof Date && !isNaN(+v);

export function isDiscrete(value: any): boolean {
    return isString(value) || isStringObject(value);
}

export function isContinuous(value: any): boolean {
    const isNumberObject = (v: any) => !!v && Object.hasOwn(v, 'valueOf') && isNumber(v.valueOf());
    const isDate = (v: any) => v instanceof Date && !isNaN(+v);

    return isNumber(value) || isNumberObject(value) || isDate(value);
}

export function checkDatum<T>(value: T, isContinuousScale: boolean): T | string | undefined {
    if (isContinuousScale && isContinuous(value)) {
        return value;
    } else if (!isContinuousScale) {
        if (!isDiscrete(value)) {
            return String(value);
        }
        return value;
    }
    return undefined;
}

export const isNumber = (v: any): v is number => typeof v === 'number' && Number.isFinite(v);

/**
 * To enable duplicate categories, a category axis value on a datum from integrated charts is transformed into an
 * object with `getString()` and `id` properties. The string value can be non-unique so we must instead use the
 * unique id property.
 *
 * @see https://ag-grid.atlassian.net/browse/AG-10526
 */
export function transformIntegratedCategoryValue(v: any) {
    if (isStringObject(v) && Object.hasOwn(v, 'id')) {
        return v.id;
    }
    return v;
}
