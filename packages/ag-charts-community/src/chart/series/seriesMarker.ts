import type { RequireOptional } from 'ag-charts-core';
import type {
    AgMarkerShape,
    AgSeriesMarkerStyle,
    AgSeriesMarkerStylerParams,
    ISeriesMarker,
    Styler,
} from 'ag-charts-types';

import { SceneChangeDetection } from '../../scene/changeDetectable';
import { ChangeDetectableProperties } from '../../scene/util/changeDetectableProperties';
import type { InternalAgColorType } from '../../scene/util/fill';
import {
    BOOLEAN,
    COLOR_GRADIENT,
    COLOR_PATTERN,
    COLOR_STRING,
    COLOR_STRING_ARRAY,
    FUNCTION,
    LINE_DASH,
    OR,
    POSITIVE_NUMBER,
    RATIO,
    TempValidate,
    predicateWithMessage,
} from '../../util/validation';
import { isSupportedMarkerShape } from '../marker/util';

export const MARKER_SHAPE = predicateWithMessage(
    (value: any) => isSupportedMarkerShape(value) || typeof value === 'function',
    `a marker shape keyword such as 'circle', 'diamond' or 'square' or an object extending the Marker class`
);

export class SeriesMarker<TParams = never>
    extends ChangeDetectableProperties
    implements ISeriesMarker<RequireOptional<TParams>>
{
    @TempValidate(BOOLEAN)
    @SceneChangeDetection()
    enabled = true;

    /** One of the predefined marker names, or a marker shape function (for user-defined markers). */
    @TempValidate(MARKER_SHAPE)
    @SceneChangeDetection()
    shape: AgMarkerShape = 'circle';

    @TempValidate(POSITIVE_NUMBER)
    @SceneChangeDetection()
    size: number = 6;

    @TempValidate(OR(COLOR_STRING, COLOR_PATTERN, COLOR_GRADIENT), { optional: true })
    @SceneChangeDetection()
    fill?: InternalAgColorType;

    @TempValidate(COLOR_STRING_ARRAY)
    defaultColorRange: string[] = [];

    @TempValidate(RATIO)
    @SceneChangeDetection()
    fillOpacity: number = 1;

    @TempValidate(COLOR_STRING, { optional: true })
    @SceneChangeDetection()
    stroke?: string;

    @TempValidate(POSITIVE_NUMBER)
    @SceneChangeDetection()
    strokeWidth: number = 1;

    @TempValidate(RATIO)
    @SceneChangeDetection()
    strokeOpacity: number = 1;

    @TempValidate(LINE_DASH)
    lineDash: number[] = [0];

    @TempValidate(POSITIVE_NUMBER)
    lineDashOffset: number = 0;

    @TempValidate(FUNCTION, { optional: true })
    @SceneChangeDetection()
    itemStyler?: Styler<AgSeriesMarkerStylerParams<unknown> & RequireOptional<TParams>, AgSeriesMarkerStyle>;

    getStyle(): AgSeriesMarkerStyle {
        const { size, shape, fill, fillOpacity, stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset } = this;

        return {
            size,
            shape,
            fill,
            fillOpacity,
            stroke,
            strokeWidth,
            strokeOpacity,
            lineDash,
            lineDashOffset,
        };
    }

    getDiameter(): number {
        return this.size + this.strokeWidth;
    }
}
