import type { InternalAgColorType } from '../../../scene/util/fill';
import {
    ARRAY_OF,
    COLOR_GRADIENT,
    COLOR_PATTERN,
    COLOR_STRING,
    COLOR_STRING_ARRAY,
    OR,
    STRING,
    TempValidate,
} from '../../../util/validation';
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

    @TempValidate(ARRAY_OF(OR(COLOR_GRADIENT, COLOR_STRING, COLOR_PATTERN)))
    fills: InternalAgColorType[] = Object.values(DEFAULT_FILLS);

    @TempValidate(COLOR_STRING_ARRAY)
    strokes: string[] = Object.values(DEFAULT_STROKES);

    @TempValidate(COLOR_STRING_ARRAY, { optional: true })
    colorRange?: string[];
}
