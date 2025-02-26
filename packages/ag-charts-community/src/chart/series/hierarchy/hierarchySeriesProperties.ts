import type { AgFillType } from 'ag-charts-types';

import { ARRAY_OF, COLOR_GRADIENT, COLOR_STRING_ARRAY, OR, STRING, Validate } from '../../../util/validation';
import { DEFAULT_FILLS, DEFAULT_STROKES } from '../../themes/defaultColors';
import { SeriesProperties } from '../seriesProperties';

export abstract class HierarchySeriesProperties<T extends object> extends SeriesProperties<T> {
    @Validate(STRING)
    childrenKey: string = 'children';

    @Validate(STRING, { optional: true })
    sizeKey?: string;

    @Validate(STRING, { optional: true })
    colorKey?: string;

    @Validate(STRING, { optional: true })
    colorName?: string;

    @Validate(COLOR_STRING_ARRAY)
    defaultColorRange: string[] = [];

    @Validate(OR(ARRAY_OF(COLOR_GRADIENT), COLOR_STRING_ARRAY))
    fills: AgFillType[] = Object.values(DEFAULT_FILLS);

    @Validate(COLOR_STRING_ARRAY)
    strokes: string[] = Object.values(DEFAULT_STROKES);

    @Validate(COLOR_STRING_ARRAY, { optional: true })
    colorRange?: string[];
}
