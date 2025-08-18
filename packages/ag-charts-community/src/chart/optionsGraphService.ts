import type { PlainObject } from 'ag-charts-core';

export type ResolvePartialCallback = (
    path: Array<string>,
    partialOptions?: PlainObject,
    proxyPaths?: Record<string, Array<string>>
) => any;

export class OptionsGraphService {
    private resolvePartialCallback?: ResolvePartialCallback;

    updateCallback(resolvePartialCallback: ResolvePartialCallback) {
        this.resolvePartialCallback = resolvePartialCallback;
    }

    resolvePartial(path: Array<string>, partialOptions?: PlainObject, proxyPaths?: Record<string, Array<string>>) {
        return this.resolvePartialCallback?.(path, partialOptions, proxyPaths);
    }
}
