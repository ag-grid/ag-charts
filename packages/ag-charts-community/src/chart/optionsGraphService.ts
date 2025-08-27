import type { PlainObject } from 'ag-charts-core';

export type ResolvePartialCallback = (
    path: Array<string>,
    partialOptions?: PlainObject,
    resolveOptions?: ResolvePartialOpts
) => Resolved;

type Resolved = Pick<PlainObject, string> | undefined;
type ResolvePartialOpts = {
    permissivePath?: boolean;
    pick?: boolean;
    proxyPaths?: Record<string, Array<string>>;
};

export class OptionsGraphService {
    private resolvePartialCallback?: ResolvePartialCallback;

    updateCallback(resolvePartialCallback: ResolvePartialCallback) {
        this.resolvePartialCallback = resolvePartialCallback;
    }

    resolvePartial(path: Array<string>, partialOptions?: PlainObject, resolveOptions?: ResolvePartialOpts) {
        return this.resolvePartialCallback?.(path, partialOptions, resolveOptions);
    }
}
