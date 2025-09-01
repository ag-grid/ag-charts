import type { _ModuleSupport } from 'ag-charts-community';

export function readDatum(
    nodeDatum: _ModuleSupport.HighlightNodeDatum | undefined
): null | Partial<{ [key: string]: unknown }> {
    if (typeof nodeDatum?.datum === 'object') {
        return nodeDatum.datum;
    }
    return null;
}
