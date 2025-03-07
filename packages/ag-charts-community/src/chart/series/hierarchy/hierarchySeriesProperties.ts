import type { AgFillType } from 'ag-charts-types';

import { ARRAY_OF, COLOR_GRADIENT, COLOR_STRING_ARRAY, OR, STRING, TempValidate } from '../../../util/validation';
import { DEFAULT_FILLS, DEFAULT_STROKES } from '../../themes/defaultColors';
import { SeriesProperties } from '../seriesProperties';

export abstract class HierarchySeriesProperties<T extends object> extends SeriesProperties<T> {
    @TempValidate(STRING)
    childrenKey: string = 'children';

    @TempValidate(STRING, { optional: true })
    sizeKey?: string;

    @TempValidate(STRING, { optional: true })
    colorKey?: string;

    @TempValidate(STRING, { optional: true })
    colorName?: string;

    @TempValidate(COLOR_STRING_ARRAY)
    defaultColorRange: string[] = [];

    @TempValidate(OR(ARRAY_OF(COLOR_GRADIENT), COLOR_STRING_ARRAY))
    fills: AgFillType[] = Object.values(DEFAULT_FILLS);

    @TempValidate(COLOR_STRING_ARRAY)
    strokes: string[] = Object.values(DEFAULT_STROKES);

    @TempValidate(COLOR_STRING_ARRAY, { optional: true })
    colorRange?: string[];
}
