import type { PlainObject } from 'ag-charts-core';

export type ResolvePartialCallback = (path: Array<string>, partialOptions?: PlainObject) => any;

export class OptionsGraphService {
    private resolvePartialCallback?: ResolvePartialCallback;

    updateCallback(resolvePartialCallback: ResolvePartialCallback) {
        this.resolvePartialCallback = resolvePartialCallback;
    }

    resolvePartial(path: Array<string>, partialOptions?: PlainObject) {
        return this.resolvePartialCallback?.(path, partialOptions);
    }
}
