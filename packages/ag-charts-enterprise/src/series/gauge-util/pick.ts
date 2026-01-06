import type { _ModuleSupport } from 'ag-charts-community';
import { type Point, clamp, iterate } from 'ag-charts-core';

type SceneNode = _ModuleSupport.Node;
type SeriesNodeDatum = _ModuleSupport.SeriesNodeDatum<_ModuleSupport.DatumIndexType>;
type SeriesNodePickMatch = _ModuleSupport.SeriesNodePickMatch;
type SelectionNode = { node: _ModuleSupport.Path; datum: SeriesNodeDatum };
type SelectionLike = Iterable<SelectionNode> & { nodes(): Iterable<SceneNode> };
type PickFocusInputs = _ModuleSupport.PickFocusInputs;
type PickFocusOutputs = _ModuleSupport.PickFocusOutputs;

type GaugeSeries = {
    contextNodeData?: {
        nodeData: SeriesNodeDatum[];
        targetData: SeriesNodeDatum[];
    };
    datumUnion: SelectionLike;
    targetSelection: SelectionLike;
    pickNodeNearestDistantObject(point: Point, items: Iterable<SceneNode>): SeriesNodePickMatch | undefined;
};

export function pickGaugeNearestDatum(self: GaugeSeries, point: Point): SeriesNodePickMatch | undefined {
    const it = iterate(self.datumUnion.nodes(), self.targetSelection.nodes());
    return self.pickNodeNearestDistantObject(point, it);
}

export function pickGaugeFocus(self: GaugeSeries, opts: PickFocusInputs): PickFocusOutputs | undefined {
    const others = [
        { data: self.contextNodeData?.nodeData, selection: self.datumUnion },
        { data: self.contextNodeData?.targetData, selection: self.targetSelection },
    ].filter((v) => v.data && v.data.length > 0);
    const otherIndex = clamp(0, opts.otherIndex + opts.otherIndexDelta, others.length - 1);
    if (others.length === 0) return;

    const { data, selection } = others[otherIndex];
    if (data == null || data.length === 0) return;

    const datumIndex = clamp(0, opts.datumIndex, data.length - 1);
    const datum = data[datumIndex];

    for (const node of selection) {
        if (node.datum === datum) {
            const bounds = node.node;
            return { bounds, clipFocusBox: true, datum, datumIndex, otherIndex };
        }
    }
}

export function findGaugeNodeDatum<D extends SeriesNodeDatum>(
    nodeData: D[] | undefined,
    itemId: _ModuleSupport.ItemId
): D | undefined {
    for (const node of nodeData ?? []) {
        if (node.itemId === itemId) {
            return node;
        }
    }
    return undefined;
}
