import { deepClone, isPlainObject } from 'ag-charts-core';

type OptionsRecord = Record<string, unknown>;

/**
 * Apply annotation options onto an existing datum, merging into nested option objects so unspecified
 * nested keys keep their current values.
 */
export function mergeAnnotationOptions<Options extends object, Datum extends Partial<Options>>(
    datum: Datum,
    options: Options
) {
    mergeRecord(datum, options);
    return datum;
}

/** Apply externally supplied options, whose shape is not tracked against the datum type. */
export function applyAnnotationOptions<Datum extends object>(datum: Datum, options: object) {
    mergeRecord(datum, options);
    return datum;
}

function mergeRecord(target: object, source: object) {
    const targetRecord = target as OptionsRecord;
    const sourceRecord = source as OptionsRecord;
    for (const key of Object.keys(sourceRecord)) {
        const value = sourceRecord[key];
        const current = targetRecord[key];
        if (isPlainObject(value) && isPlainObject(current)) {
            mergeRecord(current, value);
        } else if (isPlainObject(value)) {
            targetRecord[key] = deepClone(value);
        } else {
            targetRecord[key] = value;
        }
    }
}

export function serialiseAnnotation<T extends { id: string }>(datum: T): Omit<T, 'id'> {
    const { id: _id, ...options } = datum;
    return deepClone(options);
}

export function isWriteable(datum: { locked?: boolean; readOnly?: boolean }) {
    return !datum.locked && !datum.readOnly;
}
