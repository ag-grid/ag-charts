export interface Node {
    id: string;
}
export interface Link<N extends Node> {
    fromNode: N;
    toNode: N;
}
export interface LinkedNode<N extends Node, L extends Link<N>> {
    node: NodeGraphEntry<N, L>;
    link: L;
}
export interface NodeGraphEntry<N extends Node, L extends Link<N>> {
    datum: N;
    linksBefore: LinkedNode<N, L>[];
    linksAfter: LinkedNode<N, L>[];
    maxPathLengthBefore: number;
    maxPathLengthAfter: number;
}
export declare function computeNodeGraph<N extends Node, L extends Link<N>>(nodes: Iterable<N>, links: L[], includeCircularReferences: boolean): {
    links: L[];
    nodeGraph: Map<string, NodeGraphEntry<N, L>>;
    maxPathLength: number;
};
