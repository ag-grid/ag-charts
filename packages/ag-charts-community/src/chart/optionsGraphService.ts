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

    resolvePartial(
        path: Array<string>,
        partialOptions?: PlainObject,
        resolveOptions?: OptionsGraphAccessorResolvePartialOptions
    ) {
        return this.resolvePartialCallback?.(path, partialOptions, resolveOptions);
    }
}
