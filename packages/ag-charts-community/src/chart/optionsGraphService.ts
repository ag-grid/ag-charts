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
        const resolved = this.resolvePartialCallback?.(this.logger, path, partialOptions, resolveOptions, cssVariables);
        return resolved == null || partialOptions == null ? resolved : restoreItemCasts(partialOptions, resolved);
    }
}

/** The options of an item styler's result that are the item's own `shadow` and `glow`, to be merged over the cascade later. */
const ITEM_CAST_KEYS = ['shadow', 'glow'] as const;

/**
 * Resolving a partial fills each of its nested objects from the series options and theme. For the `shadow` and `glow`
 * that an item styler returns, that would settle the fields it left unset to the series and theme values before the
 * highlight state's `shadow` and `glow` get to supply them, so these keep only the fields that the styler set, in
 * their resolved form. Only a styler that returns them pays for the copy.
 */
function restoreItemCasts<T extends PlainObject>(partial: T, resolved: Resolved<Partial<T>>): Resolved<Partial<T>> {
    let result: Record<string, unknown> | undefined;
    for (const key of ITEM_CAST_KEYS) {
        const given = (partial as PlainObject)[key];
        const filled = (resolved as PlainObject)[key];
        if (!isPlainObject(given) || !isPlainObject(filled)) continue;

        const own: PlainObject = {};
        for (const field of Object.keys(given)) {
            if (given[field] !== undefined && field in filled) own[field] = filled[field];
        }
        result ??= { ...(resolved as PlainObject) };
        result[key] = own;
    }
    return (result ?? resolved) as Resolved<Partial<T>>;
}
