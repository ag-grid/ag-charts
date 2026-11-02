import type { ModuleDefinition } from 'ag-charts-core';

import { SelectionModule } from '../features/data-selection/dataSelectionModule';
import { MapLineBackgroundSeriesModule } from '../series/map-line-background/mapLineBackgroundModule';
import { MapLineSeriesModule } from '../series/map-line/mapLineModule';
import { MapMarkerSeriesModule } from '../series/map-marker/mapMarkerModule';
import { MapShapeBackgroundSeriesModule } from '../series/map-shape-background/mapShapeBackgroundModule';
import { MapShapeSeriesModule } from '../series/map-shape/mapShapeModule';

/** @deprecated v14.3.0 Register `AllEnterpriseModule`, or the individual modules you need. */
export const AllMapSeriesModule: ModuleDefinition[] = [
    MapLineSeriesModule,
    MapLineBackgroundSeriesModule,
    MapMarkerSeriesModule,
    MapShapeSeriesModule,
    MapShapeBackgroundSeriesModule,
    SelectionModule,
];
