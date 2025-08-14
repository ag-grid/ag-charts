import type { PlainObject } from 'ag-charts-core';

type Resolved = Pick<PlainObject, string> | undefined;

interface Graph {
    resolvePartial(path: Array<string>, partialOptions?: PlainObject): Resolved;
    hasUserOption(path: Array<string>): boolean;
}

export class OptionsGraphService {
    private graph?: Graph;

    setGraph(graph: Graph | undefined) {
        this.graph = graph;
    }

    resolvePartial(path: Array<string>, partialOptions?: PlainObject): Resolved {
        return this.graph?.resolvePartial(path, partialOptions);
    }

    hasUserOption(path: Array<string>): boolean {
        return this.graph?.hasUserOption(path) ?? false;
    }
}
