import type { ModuleDefinition } from 'ag-charts-core';

import { AreaSeriesModule } from '../chart/series/cartesian/areaSeriesModule';
import { BarSeriesModule } from '../chart/series/cartesian/barSeriesModule';
import { BubbleSeriesModule } from '../chart/series/cartesian/bubbleSeriesModule';
import { HistogramSeriesModule } from '../chart/series/cartesian/histogramSeriesModule';
import { LineSeriesModule } from '../chart/series/cartesian/lineSeriesModule';
import { ScatterSeriesModule } from '../chart/series/cartesian/scatterSeriesModule';

export const AllCartesianSeriesModule: ModuleDefinition[] = [
    AreaSeriesModule,
    BarSeriesModule,
    BubbleSeriesModule,
    HistogramSeriesModule,
    LineSeriesModule,
    ScatterSeriesModule,
];
