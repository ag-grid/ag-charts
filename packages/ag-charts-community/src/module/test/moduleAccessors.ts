import { expect } from 'vitest';

/**
 * A value a test passes in on purpose although the types forbid it: a misspelt `type`, a string where a number is
 * expected, `undefined` for the options, an enterprise-only option. Validation is what the test is about, so the
 * bypass is the point, and it stays in this one place rather than as a bare `as any` at every call site. It returns
 * `never`, which fits wherever the call site expects a type, so the call reads as the invalid input, not as a cast.
 */
export function invalidOption(value: unknown): never {
    return value as never;
}

/**
 * The value at `path` of an options (or theme) object, `undefined` as soon as a segment is missing. Segments are
 * separated by `.` and an array index can be written `[n]`, as in the option paths the validation messages use:
 * `series[0].label.padding`. Typed `unknown` so the caller states what it expects with the assertion it makes.
 */
export function optionAt(options: unknown, path: string): unknown {
    let value: unknown = options;
    for (const segment of path.split(/[.[\]]+/).filter(Boolean)) {
        if (value == null || typeof value !== 'object') return undefined;
        value = Reflect.get(value, segment);
    }
    return value;
}

/** The values of the object at `path` (an axes map, say), empty when nothing is there. */
export function valuesAt(options: unknown, path: string): unknown[] {
    const value = optionAt(options, path);
    return value != null && typeof value === 'object' ? Object.values(value) : [];
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

/**
 * A stand-in for the `CSSStyleDeclaration` that `getComputedStyle` returns, for tests that resolve CSS variables.
 * It answers `getPropertyValue` from `values` (an empty string for a property it does not list, as a browser does) and
 * nothing else, which is all the CSS-variable resolution reads.
 */
export function fakeComputedStyle(values: Record<string, string>): CSSStyleDeclaration {
    const style: Pick<CSSStyleDeclaration, 'getPropertyValue'> = {
        getPropertyValue: (key) => values[key] ?? '',
    };
    return style as CSSStyleDeclaration;
}
