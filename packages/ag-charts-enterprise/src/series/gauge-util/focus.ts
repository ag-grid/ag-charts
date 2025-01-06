import { _ModuleSupport } from 'ag-charts-community';

const { clamp } = _ModuleSupport;

type SelectionNode = { node: _ModuleSupport.Path; datum: _ModuleSupport.SeriesNodeDatum };
type GaugeSeriesProperties = {
    contextNodeData?: {
        nodeData: _ModuleSupport.SeriesNodeDatum[];
        targetData: _ModuleSupport.SeriesNodeDatum[];
    };
    datumSelection: Iterable<SelectionNode>;
    targetSelection: Iterable<SelectionNode>;
};

export function pickGaugeFocus(
    self: GaugeSeriesProperties,
    opts: _ModuleSupport.PickFocusInputs
): _ModuleSupport.PickFocusOutputs | undefined {
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
