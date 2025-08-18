import type { PlainObject } from 'ag-charts-core';

type Resolved = Pick<PlainObject, string> | undefined;
type ResolvePartialOpts = { pick?: boolean; proxyPaths?: Record<string, Array<string>> };

interface Graph {
    resolvePartial(path: Array<string>, partialOptions?: PlainObject, opts?: ResolvePartialOpts): Resolved;
}

export class OptionsGraphService {
    private graph?: Graph;

    setGraph(graph: Graph) {
        this.graph = graph;
    }

    resolvePartial(path: Array<string>, partialOptions?: PlainObject, opts?: ResolvePartialOpts): Resolved {
        return this.graph?.resolvePartial(path, partialOptions, opts);
    }
}
