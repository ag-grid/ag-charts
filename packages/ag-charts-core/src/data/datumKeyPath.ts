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

export type DatumKeyReader = (datum: unknown) => any;

function isKeyPath(key: string): boolean {
    return key.includes('.') || key.includes('[');
}

const pathReaders = new Map<string, DatumKeyReader>();

function pathReader(key: string): DatumKeyReader {
    let reader = pathReaders.get(key);
    if (reader == null) {
        const components = getPathComponents(key) ?? [key];
        reader = function readDatumPath(datum) {
            let current = datum as any;
            for (const component of components) {
                current = current?.[component];
            }
            return current;
        };
        pathReaders.set(key, reader);
    }
    return reader;
}

/**
 * Reads `key` from a datum the way the data model does: as a dot path unless `suppressFieldDotNotation`
 * is set, and as a plain property read when the key is not a path or is not a valid one.
 */
export function readDatumKey(datum: unknown, key: string, suppressFieldDotNotation: boolean): any {
    if (suppressFieldDotNotation || !isKeyPath(key)) return (datum as Record<string, unknown> | undefined)?.[key];
    return pathReader(key)(datum);
}

/** A reader for `key`, as {@link readDatumKey} reads it, for a loop over datums. */
export function datumKeyReader(key: string, suppressFieldDotNotation: boolean): DatumKeyReader {
    if (suppressFieldDotNotation || !isKeyPath(key)) {
        return function readDatumProperty(datum) {
            return (datum as Record<string, unknown> | undefined)?.[key];
        };
    }
    return pathReader(key);
}

/** A copy of `datum` with `value` written where {@link readDatumKey} reads `key`, nesting objects along a path. */
export function withDatumKey(datum: object, key: string, value: unknown, suppressFieldDotNotation: boolean): object {
    const components = suppressFieldDotNotation || !isKeyPath(key) ? [key] : (getPathComponents(key) ?? [key]);
    const result: Record<string, unknown> = { ...datum };
    let target = result;
    for (const component of components.slice(0, -1)) {
        const nested: Record<string, unknown> = { ...(target[component] as object | undefined) };
        target[component] = nested;
        target = nested;
    }
    target[components.at(-1)!] = value;
    return result;
}

/** The name a key is shown under when no display name is set: the last segment of a path. */
export function datumKeyName(key: string, suppressFieldDotNotation: boolean): string {
    if (suppressFieldDotNotation || !isKeyPath(key)) return key;
    return getPathComponents(key)?.at(-1) ?? key;
}
