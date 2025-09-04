import type { PlainObject } from 'ag-charts-core';

type Resolved = Pick<PlainObject, string> | undefined;
type ResolvePartialOpts = {
    permissivePath?: boolean;
    pick?: boolean;
    proxyPaths?: Record<string, Array<string>>;
};

interface GraphInterface {
    resolvePartial(path: Array<string>, partialOptions?: PlainObject, resolveOptions?: ResolvePartialOpts): Resolved;
    quickAutoEnable(path: Array<string>, partialOptions?: PlainObject): Resolved;
}

export class OptionsGraphService {
    private graph?: GraphInterface;

    updateGraph(graph: GraphInterface) {
        this.graph = graph;
    }

    resolvePartial(path: Array<string>, partialOptions?: PlainObject, resolveOptions?: ResolvePartialOpts) {
        return this.graph?.resolvePartial(path, partialOptions, resolveOptions);
    }

    quickAutoEnable(path: Array<string>, partialOptions?: PlainObject) {
        return this.graph?.quickAutoEnable(path, partialOptions);
    }
}
