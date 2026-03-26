import type { ModuleDefinition } from 'ag-charts-core';

import { MapLineBackgroundSeriesModule } from '../series/map-line-background/mapLineBackgroundModule';
import { MapLineSeriesModule } from '../series/map-line/mapLineModule';
import { MapMarkerSeriesModule } from '../series/map-marker/mapMarkerModule';
import { MapShapeBackgroundSeriesModule } from '../series/map-shape-background/mapShapeBackgroundModule';
import { MapShapeSeriesModule } from '../series/map-shape/mapShapeModule';

export const AllMapSeriesModule: ModuleDefinition[] = [
    MapLineSeriesModule,
    MapLineBackgroundSeriesModule,
    MapMarkerSeriesModule,
    MapShapeSeriesModule,
    MapShapeBackgroundSeriesModule,
];
