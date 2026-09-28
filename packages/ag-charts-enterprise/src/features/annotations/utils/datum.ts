import { SKIP_JS_BUILTINS, deepClone, isPlainObject } from 'ag-charts-core';

type OptionsRecord = Record<string, unknown>;

/** Apply options onto a datum, merging into nested option objects so unspecified nested keys keep their values. */
export function applyAnnotationOptions<Datum extends object>(datum: Datum, options: object) {
    mergeRecord(datum, options);
    return datum;
}

function mergeRecord(target: object, source: object) {
    const targetRecord = target as OptionsRecord;
    const sourceRecord = source as OptionsRecord;
    for (const key of Object.keys(sourceRecord)) {
        if (SKIP_JS_BUILTINS.has(key)) continue;
        const value = sourceRecord[key];
        const current = targetRecord[key];
        if (isPlainObject(current) && value == null) continue;

        if (isPlainObject(value) && isPlainObject(current)) {
            mergeRecord(current, value);
        } else if (isPlainObject(value)) {
            targetRecord[key] = deepClone(value);
        } else {
            targetRecord[key] = value;
        }
    }
}

/** Reset a datum to its defaults, keeping its identity and id, then apply the restored options. */
export function resetAnnotationDatum<Datum extends { id: string }>(datum: Datum, defaults: Datum, options: object) {
    const record = datum as OptionsRecord;
    for (const key of Object.keys(record)) {
        if (key !== 'id') delete record[key];
    }
    Object.assign(datum, defaults, { id: datum.id });
    return applyAnnotationOptions(datum, options);
}

export function serialiseAnnotation<T extends { id: string }>(datum: T): Omit<T, 'id'> {
    const { id: _id, ...options } = datum;
    return deepClone(options);
}

export function isWriteable(datum: { locked?: boolean; readOnly?: boolean }) {
    return !datum.locked && !datum.readOnly;
}
