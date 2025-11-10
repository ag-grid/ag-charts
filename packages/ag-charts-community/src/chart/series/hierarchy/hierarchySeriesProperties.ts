import { Property } from 'ag-charts-core';
import type { AgColorType } from 'ag-charts-types';

import { DEFAULT_FILLS, DEFAULT_STROKES } from '../../themes/defaultColors';
import { SeriesProperties } from '../seriesProperties';

export abstract class HierarchySeriesProperties<T extends object> extends SeriesProperties<T> {
    @Property
    childrenKey: string = 'children';

    @Property
    sizeKey?: string;

    @Property
    colorKey?: string;

    @Property
    colorName?: string;

    @Property
    fills: AgColorType[] = Object.values(DEFAULT_FILLS);

    @Property
    strokes: string[] = Object.values(DEFAULT_STROKES);

    @Property
    colorRange?: string[];
}
