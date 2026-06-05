import type { PlainObject } from 'ag-charts-core';

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

    resolvePartial<T extends PlainObject>(
        path: Array<string>,
        partialOptions?: T,
        resolveOptions?: OptionsGraphAccessorResolvePartialOptions
    ): Partial<T> | undefined {
        return this.resolvePartialCallback?.(path, partialOptions, resolveOptions);
    }
}
