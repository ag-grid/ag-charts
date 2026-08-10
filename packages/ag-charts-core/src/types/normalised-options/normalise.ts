/** Makes specified keys required and non-nullable. */
type Require<T, K extends keyof T> = T & { [P in K]-?: NonNullable<T[P]> };

/** Replaces specified keys with new types, preserves the rest. */
type Normalise<T, Overrides extends Partial<Record<keyof T, unknown>>> = Omit<T, keyof Overrides> & Overrides;

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
