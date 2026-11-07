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

/** The `shadow` and `glow` of an item styler's result. */
const ITEM_CAST_KEYS = ['shadow', 'glow'] as const;

/** The cast that {@link restoreItemCasts} made of each resolved `shadow` or `glow`, so that an equal cast is the same object. */
const restoredCasts = new WeakMap<object, PlainObject>();

/** For each restored cast, the resolved `shadow` or `glow` it came from, which is the series' and the theme's under it. */
const castBases = new WeakMap<object, PlainObject>();

/** What a restored `shadow` or `glow` of an item styler is merged over last: the series' own and the theme's values. */
export function getItemCastBase(restored: object): PlainObject | undefined {
    return castBases.get(restored);
}

/**
 * Keeps only the fields that an item styler set in its `shadow` and `glow`, so that the highlight state's get to supply
 * the rest; the resolved cast stays on as {@link getItemCastBase}, the bottom layer.
 */
function restoreItemCasts<T extends PlainObject>(partial: T, resolved: Resolved<Partial<T>>): Resolved<Partial<T>> {
    // `resolved` is the caller's own top level object (the graph builds it afresh, and its partial cache copies on
    // both read and write), so the restored casts are assigned onto it without another copy.
    const target = resolved as PlainObject;
    for (const key of ITEM_CAST_KEYS) {
        const given = (partial as PlainObject)[key];
        const filled = target[key];
        if (!isPlainObject(given) || !isPlainObject(filled)) continue;

        let own = restoredCasts.get(filled);
        if (own === undefined) {
            own = {};
            for (const field of Object.keys(given)) {
                if (given[field] !== undefined && field in filled) own[field] = filled[field];
            }
            restoredCasts.set(filled, own);
            castBases.set(own, filled);
        }
        target[key] = own;
    }
    return resolved;
}
