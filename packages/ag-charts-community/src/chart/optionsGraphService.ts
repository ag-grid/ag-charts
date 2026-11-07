import { type Logger, type PlainObject, type Resolved, isPlainObject } from 'ag-charts-core';

import type { OptionsGraphAccessor, OptionsGraphAccessorResolvePartialOptions } from '../module/optionsGraph';

/**
 * Note: Do not use this service to expose direct access to the OptionsGraph. Instead, use operations to resolve
 * against the graph.
 */
export class OptionsGraphService {
    private resolvePartialCallback?: OptionsGraphAccessor['resolvePartial'];

    updateCallback(resolvePartialCallback: OptionsGraphAccessor['resolvePartial']) {
        this.resolvePartialCallback = resolvePartialCallback;
    }

    constructor(private readonly logger: Logger) {}

    resolvePartial<T extends PlainObject>(
        path: Array<string>,
        partialOptions?: T,
        resolveOptions?: OptionsGraphAccessorResolvePartialOptions,
        cssVariables?: Record<string, string>
    ): Resolved<Partial<T>> | undefined {
        const resolve = this.resolvePartialCallback;
        if (resolve == null) return;
        if (partialOptions == null) {
            return resolve(this.logger, path, partialOptions, resolveOptions, cssVariables) as
                Resolved<Partial<T>> | undefined;
        }

        if (resolveOptions?.proxyPaths != null && ITEM_CAST_KEYS.some((key) => isPlainObject(partialOptions[key]))) {
            // A partial with proxy paths is never cached, so its casts resolve apart, to keep the identity of an equal cast.
            const rest: PlainObject = { ...partialOptions };
            const casts: PlainObject = {};
            for (const key of ITEM_CAST_KEYS) {
                if (!isPlainObject(rest[key])) continue;
                casts[key] = rest[key];
                delete rest[key];
            }

            const resolvedRest = resolve(this.logger, path, rest, resolveOptions, cssVariables);
            if (resolvedRest == null) return;

            const noProxies = { ...resolveOptions, proxyPaths: undefined };
            const resolvedCasts = resolve(this.logger, path, casts, noProxies, cssVariables);
            return restoreItemCasts(casts, { ...resolvedRest, ...resolvedCasts }) as Resolved<Partial<T>>;
        }

        const resolved = resolve(this.logger, path, partialOptions, resolveOptions, cssVariables);
        return resolved == null ? resolved : restoreItemCasts(partialOptions, resolved);
    }
}

/** The options of an item styler's result that are the item's own `shadow` and `glow`, to be merged over the cascade later. */
const ITEM_CAST_KEYS = ['shadow', 'glow'] as const;

/**
 * What {@link restoreItemCasts} made of each resolved `shadow` or `glow`. The partial cache hands out a copy of a result whose
 * nested objects are shared, so this returns the same object for an equal cast, which lets the series recognise a cast
 * it has already merged.
 */
const restoredCasts = new WeakMap<object, PlainObject>();

/**
 * Resolving a partial fills each of its nested objects from the series options and theme. For the `shadow` and `glow`
 * that an item styler returns, that would settle the fields it left unset to the series and theme values before the
 * highlight state's `shadow` and `glow` get to supply them, so these keep only the fields that the styler set, in
 * their resolved form. Only a styler that returns them pays for the copy.
 */
function restoreItemCasts<T extends PlainObject>(partial: T, resolved: Resolved<Partial<T>>): Resolved<Partial<T>> {
    let result: PlainObject | undefined;
    for (const key of ITEM_CAST_KEYS) {
        const given = (partial as PlainObject)[key];
        const filled = (resolved as PlainObject)[key];
        if (!isPlainObject(given) || !isPlainObject(filled)) continue;

        let own = restoredCasts.get(filled);
        if (own === undefined) {
            own = {};
            for (const field of Object.keys(given)) {
                if (given[field] !== undefined && field in filled) own[field] = filled[field];
            }
            restoredCasts.set(filled, own);
        }
        result ??= { ...(resolved as PlainObject) };
        result[key] = own;
    }
    return (result ?? resolved) as Resolved<Partial<T>>;
}
