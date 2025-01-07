import { _ModuleSupport } from 'ag-charts-community';

const { clamp } = _ModuleSupport;
type SeriesNodeDatum = _ModuleSupport.SeriesNodeDatum<unknown>;
type SelectionNode = { node: _ModuleSupport.Path; datum: SeriesNodeDatum };
type PickFocusInputs = _ModuleSupport.PickFocusInputs;
type PickFocusOutputs = _ModuleSupport.PickFocusOutputs;
type GaugeSeriesProperties = {
    contextNodeData?: {
        nodeData: SeriesNodeDatum[];
        targetData: SeriesNodeDatum[];
    };
    datumSelection: Iterable<SelectionNode>;
    targetSelection: Iterable<SelectionNode>;
};

export function pickGaugeFocus(self: GaugeSeriesProperties, opts: PickFocusInputs): PickFocusOutputs | undefined {
    const others = [
        { data: self.contextNodeData?.nodeData, selection: self.datumSelection },
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
            return { bounds, showFocusBox: true, clipFocusBox: true, datum, datumIndex, otherIndex };
        }
    }
}
