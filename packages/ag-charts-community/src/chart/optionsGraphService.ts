import type { PlainObject } from 'ag-charts-core';

export type ResolvePartialCallback = (path: Array<string>, partialOptions?: PlainObject) => any;

export class OptionsGraphService {
    constructor(private readonly resolvePartialCallback: ResolvePartialCallback) {}

    resolvePartial(path: Array<string>, partialOptions?: PlainObject) {
        return this.resolvePartialCallback(path, partialOptions);
    }
}
