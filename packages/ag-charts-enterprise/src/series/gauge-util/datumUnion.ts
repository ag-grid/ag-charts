import type { _ModuleSupport } from 'ag-charts-community';

export class DatumUnion<
    TNode extends _ModuleSupport.Shape,
    TDatum extends _ModuleSupport.SeriesNodeDatum<_ModuleSupport.DatumIndexType>,
> {
    node?: TNode;
    datum?: TDatum;

    *[Symbol.iterator](): IterableIterator<{ node: TNode; datum: TDatum }> {
        const { node, datum } = this;
        if (node && datum) yield { node, datum };
    }
    nodes(): Iterable<TNode> {
        return this.node ? [this.node] : [];
    }
    update(
        datumSelection: { nodes(): TNode[] },
        group: { appendChild(child: TNode): void },
        ctor: new () => TNode,
        nodeUpdater: (unionNode: TNode, first: TNode, last: TNode) => void
    ) {
        const nodes = datumSelection.nodes();
        if (nodes.length === 0) {
            this.node?.remove();
            this.node = undefined;
        } else {
            if (this.node === undefined) {
                this.node = new ctor();
                this.node.fillOpacity = 0;
                this.node.strokeOpacity = 0;
                group.appendChild(this.node);
            }
            const first = nodes[0];
            const last =
                nodes.toReversed().find((n) => n.datum.datum.value > n.datum.datum.segmentStart) ?? nodes.at(-1)!;

            this.node.datum = this.datum = first.datum;
            nodeUpdater(this.node, first, last);
        }
    }
}
