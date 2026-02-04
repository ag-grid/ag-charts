import type { PlainObject } from 'ag-charts-core';

export type ResolvePartialCallback = (
    path: Array<string>,
    partialOptions?: PlainObject,
    resolveOptions?: ResolvePartialOpts
) => Resolved;
export type HasUserOptionCallback = (path: Array<string>) => boolean;

type Resolved = Pick<PlainObject, string> | undefined;
type ResolvePartialOpts = {
    permissivePath?: boolean;
    pick?: boolean;
    proxyPaths?: Record<string, Array<string>>;
};

export class OptionsGraphService {
    private resolvePartialCallback?: ResolvePartialCallback;
    private hasUserOptionCallback?: HasUserOptionCallback;

    updateCallback(resolvePartialCallback: ResolvePartialCallback, hasUserOptionCallback?: HasUserOptionCallback) {
        this.resolvePartialCallback = resolvePartialCallback;
        this.hasUserOptionCallback = hasUserOptionCallback;
    }

    resolvePartial(path: Array<string>, partialOptions?: PlainObject, resolveOptions?: ResolvePartialOpts) {
        return this.resolvePartialCallback?.(path, partialOptions, resolveOptions);
    }

    hasUserOption(path: Array<string>) {
        return this.hasUserOptionCallback?.(path) ?? false;
    }
}
