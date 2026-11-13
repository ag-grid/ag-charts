import type { AgLineDashName } from 'ag-charts-types';

/** Makes specified keys required and non-nullable. */
type Require<T, K extends keyof T> = T & { [P in K]-?: NonNullable<T[P]> };

/** A theme resolves a named `lineDash` to its array of lengths, so only the array form remains. */
type ResolveLineDash<T> = 'lineDash' extends keyof T
    ? { [K in keyof T]: K extends 'lineDash' ? Exclude<T[K], AgLineDashName> : T[K] }
    : T;

/** Replaces specified keys with new types, preserves the rest. */
type Normalise<T, Overrides extends Partial<Record<keyof T, unknown>>> = ResolveLineDash<Omit<T, keyof Overrides>> &
    Overrides;

/**
 * Derives a normalised (post-theme-merge) type from a user-facing options interface.
 *
 * @typeParam T - The user-facing options interface
 * @typeParam R - Keys that become required after normalisation
 * @typeParam O - Keys whose type changes after normalisation (e.g. shorthand → canonical)
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type Normalised<T, R extends keyof T = never, O extends Partial<Record<keyof T, unknown>> = {}> = Require<
    Normalise<T, O>,
    R
>;

/** Callback whose parameter stays bivariant, so a leaf typed on richer params satisfies a plainer caller. */
export type BivariantCallback<P, R> = { bivarianceHack(this: void, params: P): R }['bivarianceHack'];
