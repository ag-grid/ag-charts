/**
 * Helper functions for DataModel processing.
 * Extracted from dataModel.ts as part of Phase 2.1 refactoring.
 */
import { isObject } from 'ag-charts-core';
import type { AgNumericValue } from 'ag-charts-types';

import type { DataChangeDescription } from '../../dataChangeDescription';
import type { MissMap, ScopeId, ScopeProvider } from '../../dataModelTypes';

// Sentinel values for null and undefined keys to avoid collision with strings "null" and "undefined"
export const NULL_KEY_STRING = '\0__AG_NULL__\0';
export const UNDEFINED_KEY_STRING = '\0__AG_UNDEFINED__\0';

/**
 * Converts a single key to its string representation.
 * Arrays are recursively processed to preserve null/undefined distinction within elements.
 */
function keyToString(key: unknown): string {
    if (key === null) return NULL_KEY_STRING;
    if (key === undefined) return UNDEFINED_KEY_STRING;
    if (Array.isArray(key)) {
        return '[' + key.map(keyToString).join(',') + ']';
    }
    return isObject(key) ? JSON.stringify(key) : String(key);
}

/**
 * Converts an array of keys to a string representation.
 * Objects are JSON-stringified, other values are joined with '-'.
 * Null and undefined values use distinct sentinel strings to avoid collision with each other
 * and with the literal strings "null" and "undefined".
 * Arrays are recursively processed to preserve null/undefined distinction within elements.
 */
export function toKeyString(keys: any[]): string {
    return keys.map(keyToString).join('-');
}

/** Type guard: every entry is a bigint, so the array can be returned as an exact `bigint[]`. */
function isBigIntArray(values: ReadonlyArray<number | Date | bigint>): values is readonly bigint[] {
    return values.every((v) => typeof v === 'bigint');
}

/**
 * Fixes a numeric extent to a uniformly-typed array, or `[]` when the input is null or contains a non-finite
 * value. The extent may be a `[min, max]` pair or the flat-mapped per-key domains a clipped range produces
 * (e.g. OHLC's `[highMin, highMax, lowMin, lowMax]`), so every entry is preserved for the scale to span. An
 * all-bigint extent is kept exact for full-precision positioning; otherwise Date/number entries narrow to
 * Number. The result is never a mixed number/bigint array (a numeric column is uniformly typed by this point).
 */
export function fixNumericExtent(extent: ReadonlyArray<number | Date | bigint> | null): number[] | bigint[] {
    if (extent == null) return [];
    if (isBigIntArray(extent)) return [...extent];
    const mapped = extent.map(Number);
    return mapped.every(Number.isFinite) ? mapped : [];
}

/**
 * Extends a numeric `[min, max]` extent to include the zero baseline, so bars and areas anchor at zero.
 * Both endpoints keep their type: a bigint extent emits `0n` baselines; a numeric `0` would narrow them.
 */
export function extendDomainToZero(extent: ReadonlyArray<AgNumericValue>): [] | [number, number] | [bigint, bigint] {
    if (extent.length < 2) return [];
    const [e0, e1] = extent;
    if (typeof e0 === 'bigint' && typeof e1 === 'bigint') {
        return [e0 < 0n ? e0 : 0n, e1 > 0n ? e1 : 0n];
    }
    const n0 = Number(e0);
    const n1 = Number(e1);
    return Number.isFinite(n1 - n0) ? [Math.min(n0, 0), Math.max(n1, 0)] : [];
}

/**
 * Gets the miss count for a given scope provider from the miss map.
 */
export function getMissCount(scopeProvider: ScopeProvider, missMap: MissMap | undefined): number {
    return missMap?.get(scopeProvider.id) ?? 0;
}

/**
 * Type guard to check if an object has a scopes property.
 */
export function isScoped<T extends object>(obj: T): obj is T & { scopes: string[] } {
    return 'scopes' in obj && Array.isArray(obj.scopes);
}

/**
 * Creates an array of a given length filled with a value.
 * More efficient than Array.fill for large arrays.
 */
export function createArray<T>(length: number, value: T): T[] {
    const out: T[] = [];
    for (let i = 0; i < length; i += 1) {
        out[i] = value;
    }
    return out;
}

/**
 * Deduplicate change descriptions (multiple scopes can share the same DataSet/change descriptor).
 */
export function uniqueChangeDescriptions(
    scopeChanges: Map<ScopeId, DataChangeDescription>
): Set<DataChangeDescription> {
    const deduped = new Set<DataChangeDescription>();
    for (const changeDesc of scopeChanges.values()) {
        if (changeDesc) {
            deduped.add(changeDesc);
        }
    }
    return deduped;
}

/**
 * Extracts keys from arrays at a specific datum index.
 * Returns undefined if any key is null or undefined (unless allowNull is true).
 * When allowNull is true, both null and undefined are allowed as valid keys.
 */
export function datumKeys(
    keys: Array<unknown[] | undefined>,
    datumIndex: number,
    allowNull: boolean = false
): any[] | undefined {
    const out: any = [];

    for (const k of keys) {
        const key = k?.[datumIndex];
        if (key == null && !allowNull) return;
        out.push(key);
    }

    return out;
}

/**
 * Parses a property path string into components.
 * Supports dot notation (a.b), bracket notation (a['b']), and array indices (a[0]).
 * Returns undefined if the path is invalid.
 */
export function getPathComponents(path: string): string[] | undefined {
    const components: string[] = [];
    let matchIndex = 0;
    let matchGroup: RegExpExecArray | null;
    const regExp = /((?:(?:^|\.)\s*\w+|\[\s*(?:'(?:[^']|(?<!\\)\\')*'|"(?:[^"]|(?<!\\)\\")*"|-?\d+)\s*\])\s*)/g;
    /**              ^                         ^                      ^                      ^
     *               |                         |                      |                      |
     *                - .dotAccessor or initial property (i.e. a in "a.b")                   |
     *                                         |                      |                      |
     *                                          - ['single-quoted']                          |
     *                                                                |                      |
     *                                                                 - ["double-quoted"]   |
     *                                                                                       |
     *                                                                                        - [0] index properties
     */
    while ((matchGroup = regExp.exec(path))) {
        if (matchGroup.index !== matchIndex) {
            return;
        }
        matchIndex = matchGroup.index + matchGroup[0].length;
        const match = matchGroup[1].trim();
        if (match.startsWith('.')) {
            // .property
            components.push(match.slice(1).trim());
        } else if (match.startsWith('[')) {
            const accessor = match.slice(1, -1).trim();
            if (accessor.startsWith(`'`)) {
                // ['string-property']
                components.push(accessor.slice(1, -1).replaceAll(/(?<!\\)\\'/g, `'`));
            } else if (accessor.startsWith(`"`)) {
                // ["string-property"]
                components.push(accessor.slice(1, -1).replaceAll(/(?<!\\)\\"/g, `"`));
            } else {
                // ["number-property"]
                components.push(accessor);
            }
        } else {
            // thisProperty.other["properties"]['afterwards']
            components.push(match);
        }
    }

    if (matchIndex !== path.length) return;

    return components;
}

/**
 * Creates an accessor function for a given property path.
 * The accessor traverses the path components to retrieve nested values.
 */
export function createPathAccessor(components: string[]): (datum: any) => any {
    return (datum: any): any => {
        let current = datum;
        for (const component of components) {
            current = current[component];
        }
        return current;
    };
}
