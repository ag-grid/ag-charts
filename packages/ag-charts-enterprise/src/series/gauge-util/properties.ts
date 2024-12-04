import { _ModuleSupport } from 'ag-charts-community';

const { MARKER_SHAPE, UNION, OR } = _ModuleSupport;

export const FILL_MODE = UNION(['continuous', 'discrete'], 'a fill mode');
export const TARGET_MARKER_SHAPE = OR(MARKER_SHAPE, UNION(['line'], 'a marker shape'));
export const CORNER_MODE = UNION(['container', 'item'], 'a corner mode');

export type UnknownGaugeNodeDatum = _ModuleSupport.SeriesNodeDatum & { value?: unknown; text?: unknown };

export function parseUnknownGaugeNodeDatum(nodeDatum: UnknownGaugeNodeDatum): { value?: number; text?: string } {
    let value: number | undefined;
    let text: string | undefined;
    if (typeof nodeDatum.value === 'number') value = nodeDatum.value;
    if (typeof nodeDatum.text === 'string') text = nodeDatum.text;
    return { value, text };
}
