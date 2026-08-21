import { BaseProperties, Property } from 'ag-charts-core';
import type { AgChartHighlightMode, AgDrawingMode } from 'ag-charts-types';

export class ChartHighlight extends BaseProperties {
    @Property
    enabled: boolean = true;

    @Property
    public range: 'tooltip' | 'node' = 'tooltip';

    @Property
    public mode: AgChartHighlightMode = 'single';

    @Property
    drawingMode: AgDrawingMode = 'cutout';
}
