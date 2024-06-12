import type { AgSeriesMarkerFormatterParams, AgSeriesMarkerStyle, ISeriesMarker, Styler } from 'ag-charts-types';

import { RedrawType, SceneChangeDetection } from '../../scene/changeDetectable';
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
import { Circle } from '../marker/circle';
import { Marker } from '../marker/marker';
import type { MarkerShape } from '../marker/util';
import { isMarkerShape } from '../marker/util';

export const MARKER_SHAPE = predicateWithMessage(
    (value: any) =>
        isMarkerShape(value) || (typeof value === 'function' && Object.create(value.prototype) instanceof Marker),
    `a marker shape keyword such as 'circle', 'diamond' or 'square' or an object extending the Marker class`
);

export class SeriesMarker<TParams = never, TDatum = any>
    extends ChangeDetectableProperties
    implements ISeriesMarker<TDatum, RequireOptional<TParams>>
{
    @Validate(BOOLEAN)
    @SceneChangeDetection({ redraw: RedrawType.MAJOR })
    enabled = true;

    /** One of the predefined marker names, or a marker constructor function (for user-defined markers). */
    @Validate(MARKER_SHAPE)
    @SceneChangeDetection({ redraw: RedrawType.MAJOR })
    shape: MarkerShape = Circle;

    @Validate(POSITIVE_NUMBER)
    @SceneChangeDetection({ redraw: RedrawType.MAJOR })
    size: number = 6;

    @Validate(COLOR_STRING, { optional: true })
    @SceneChangeDetection({ redraw: RedrawType.MAJOR })
    fill?: string;

    @Validate(RATIO)
    @SceneChangeDetection({ redraw: RedrawType.MAJOR })
    fillOpacity: number = 1;

    @Validate(COLOR_STRING, { optional: true })
    @SceneChangeDetection({ redraw: RedrawType.MAJOR })
    stroke?: string;

    @Validate(POSITIVE_NUMBER)
    @SceneChangeDetection({ redraw: RedrawType.MAJOR })
    strokeWidth: number = 1;

    @Validate(RATIO)
    @SceneChangeDetection({ redraw: RedrawType.MAJOR })
    strokeOpacity: number = 1;

    @Validate(FUNCTION, { optional: true })
    @SceneChangeDetection({ redraw: RedrawType.MAJOR })
    itemStyler?: Styler<AgSeriesMarkerFormatterParams<TDatum> & RequireOptional<TParams>, AgSeriesMarkerStyle>;

    getStyle(): AgSeriesMarkerStyle {
        const { size, fill, fillOpacity, stroke, strokeWidth, strokeOpacity } = this;
        return { size, fill, fillOpacity, stroke, strokeWidth, strokeOpacity };
    }

    getDiameter(): number {
        return this.size + this.strokeWidth;
    }
}
