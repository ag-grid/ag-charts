/**
 * Helper functions for DataModel processing.
 * Extracted from dataModel.ts as part of Phase 2.1 refactoring.
 */
import { isObject } from 'ag-charts-core';

import type { DataChangeDescription } from '../../dataChangeDescription';
import type { MissMap, ScopeId, ScopeProvider } from '../../dataModelTypes';

// Sentinel value for null keys to avoid collision with string "null"
const NULL_KEY_STRING = '\0__AG_NULL__\0';

/**
 * Converts an array of keys to a string representation.
 * Objects are JSON-stringified, other values are joined with '-'.
 * Null values use a sentinel string to avoid collision with the string "null".
 */
export function toKeyString(keys: any[]): string {
    return keys
        .map((key) => {
            if (key === null) return NULL_KEY_STRING;
            return isObject(key) ? JSON.stringify(key) : key;
        })
        .join('-');
}

/**
 * Fixes a numeric extent to ensure both values are finite numbers.
 * Returns empty array if extent is null or contains non-finite values.
 */
export function fixNumericExtent(extent: Array<number | Date> | null): [] | [number, number] {
    const numberExtent = extent?.map(Number) as [number, number] | undefined;
    return numberExtent?.every(Number.isFinite) ? numberExtent : [];
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
 * When allowNull is true, only returns undefined for undefined keys.
 */
export function datumKeys(
    keys: Array<unknown[] | undefined>,
    datumIndex: number,
    allowNull: boolean = false
): any[] | undefined {
    const out: any = [];

    for (const k of keys) {
        const key = k?.[datumIndex];
        if (key === undefined) return; // Undefined = missing datum
        if (key === null && !allowNull) return; // Null = invalid unless allowed
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
    // eslint-disable-next-line sonarjs/regex-complexity
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
