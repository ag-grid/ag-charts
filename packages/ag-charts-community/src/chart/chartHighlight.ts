import { BaseProperties, Property } from 'ag-charts-core';
import type { AgDrawingMode } from 'ag-charts-types';

export class ChartHighlight extends BaseProperties {
    @Property
    public range: 'tooltip' | 'node' = 'tooltip';

    @Property
    drawingMode: AgDrawingMode = 'cutout';
}
