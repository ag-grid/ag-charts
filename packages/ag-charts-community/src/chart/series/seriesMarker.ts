import type {
    AgMarkerShape,
    AgSeriesMarkerStyle,
    AgSeriesMarkerStylerParams,
    ISeriesMarker,
    Styler,
} from 'ag-charts-types';

import { SceneChangeDetection } from '../../scene/changeDetectable';
import { ChangeDetectableProperties } from '../../scene/util/changeDetectableProperties';
import type { RequireOptional } from '../../util/types';
import {
    BOOLEAN,
    COLOR_STRING,
    FUNCTION,
    POSITIVE_NUMBER,
    RATIO,
    Validate,
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
    @Validate(BOOLEAN)
    @SceneChangeDetection()
    enabled = true;

    /** One of the predefined marker names, or a marker shape function (for user-defined markers). */
    @Validate(MARKER_SHAPE)
    @SceneChangeDetection()
    shape: AgMarkerShape = 'circle';

    @Validate(POSITIVE_NUMBER)
    @SceneChangeDetection()
    size: number = 6;

    @Validate(COLOR_STRING, { optional: true })
    @SceneChangeDetection()
    fill?: string;

    @Validate(RATIO)
    @SceneChangeDetection()
    fillOpacity: number = 1;

    @Validate(COLOR_STRING, { optional: true })
    @SceneChangeDetection()
    stroke?: string;

    @Validate(POSITIVE_NUMBER)
    @SceneChangeDetection()
    strokeWidth: number = 1;

    @Validate(RATIO)
    @SceneChangeDetection()
    strokeOpacity: number = 1;

    @Validate(FUNCTION, { optional: true })
    @SceneChangeDetection()
    itemStyler?: Styler<AgSeriesMarkerStylerParams<unknown> & RequireOptional<TParams>, AgSeriesMarkerStyle>;

    getStyle(): AgSeriesMarkerStyle {
        const { size, shape, fill, fillOpacity, stroke, strokeWidth, strokeOpacity } = this;
        return { size, shape, fill, fillOpacity, stroke, strokeWidth, strokeOpacity };
    }

    getDiameter(): number {
        return this.size + this.strokeWidth;
    }
}
