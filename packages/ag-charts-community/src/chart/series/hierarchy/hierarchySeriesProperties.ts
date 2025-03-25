import type { AgColorType } from 'ag-charts-types';

import { Property } from '../../../util/properties';
import { DEFAULT_FILLS, DEFAULT_STROKES } from '../../themes/defaultColors';
import { FillGradientDefaults, FillPatternDefaults, SeriesProperties } from '../seriesProperties';

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
    readonly fillGradientDefaults = new FillGradientDefaults();

    @Property
    readonly fillPatternDefaults = new FillPatternDefaults();

    @Property
    strokes: string[] = Object.values(DEFAULT_STROKES);

    @Property
    colorRange?: string[];
}
