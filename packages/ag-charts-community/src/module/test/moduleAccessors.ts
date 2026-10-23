import { expect } from 'vitest';

import type { ModuleRegistry } from 'ag-charts-core';

/** A value a validation test passes in on purpose although the types forbid it; returns `never` to fit any slot. */
export function invalidOption(value: unknown): never {
    return value as never;
}

type ModuleToRegister = Parameters<typeof ModuleRegistry.register>[0];

/** A module definition holding only the members the code under test reads (no `create`); the cast is that gap. */
export function partialModule(members: object): ModuleToRegister {
    return members as ModuleToRegister;
}

/** The value at `path` (`series[0].label.padding`) of an options object, `undefined` once a segment is missing. */
export function optionAt(options: unknown, path: string): unknown {
    let value: unknown = options;
    for (const segment of path.split(/[.[\]]+/).filter(Boolean)) {
        if (value == null || typeof value !== 'object') return undefined;
        value = Reflect.get(value, segment);
    }
    return value;
}

/** Like `optionAt`, but fails unless the object holding the leaf exists, so an absence check cannot pass vacuously. */
export function strictOptionAt(options: unknown, path: string): unknown {
    const parentPath = path.replace(/(?:\.[^.[\]]+|\[\d+\]|^[^.[\]]+)$/, '');
    expect(optionAt(options, parentPath), `the parent of ${path}`).toBeInstanceOf(Object);
    return optionAt(options, path);
}

/** The values of the object at `path` (an axes map, say); fails if there is no object there. */
export function valuesAt(options: unknown, path: string): unknown[] {
    const value = optionAt(options, path);
    expect(value, path).toBeInstanceOf(Object);
    return Object.values(value as object);
}

/** A copy of `options` whose series carry no `data`, for a snapshot of everything but the (large) series data. */
export function omitSeriesData<T extends object>(options: T): T {
    const series = optionAt(options, 'series');
    if (!Array.isArray(series)) return { ...options };
    return {
        ...options,
        series: series.map((entry: object) => {
            const copy = { ...entry };
            Reflect.deleteProperty(copy, 'data');
            return copy;
        }),
    };
}

/** The function at `path` (a tooltip `renderer`, say), asserted to be one: a missing option fails here, not on the call. */
export function functionAt(options: unknown, path: string): (params: object) => unknown {
    const value = optionAt(options, path);
    expect(value, path).toBeTypeOf('function');
    return value as (params: object) => unknown;
}

/** A `CSSStyleDeclaration` stand-in that answers `getPropertyValue` from `values`, `''` for any other property. */
export function fakeComputedStyle(values: Record<string, string>): CSSStyleDeclaration {
    const style: Pick<CSSStyleDeclaration, 'getPropertyValue'> = {
        getPropertyValue: (key) => values[key] ?? '',
    };
    return style as CSSStyleDeclaration;
}
