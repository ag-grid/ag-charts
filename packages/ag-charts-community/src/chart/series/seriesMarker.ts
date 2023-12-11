import type {
    AgSeriesMarkerFormatterParams,
    AgSeriesMarkerStyle,
    ISeriesMarker,
} from '../../options/series/markerOptions';
import { ChangeDetectable, RedrawType, SceneChangeDetection } from '../../scene/changeDetectable';
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

const MARKER_SHAPE = predicateWithMessage(
    (v: any) => isMarkerShape(v) || Object.getPrototypeOf(v) === Marker,
    `expecting a marker shape keyword such as 'circle', 'diamond' or 'square' or an object extending the Marker class`
);

export class SeriesMarker<TParams = never, TDatum = any>
    extends ChangeDetectable
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

    @Validate(RATIO, { optional: true })
    @SceneChangeDetection({ redraw: RedrawType.MAJOR })
    fillOpacity: number = 1;

    @Validate(COLOR_STRING, { optional: true })
    @SceneChangeDetection({ redraw: RedrawType.MAJOR })
    stroke?: string;

    @Validate(POSITIVE_NUMBER, { optional: true })
    @SceneChangeDetection({ redraw: RedrawType.MAJOR })
    strokeWidth: number = 1;

    @Validate(RATIO, { optional: true })
    @SceneChangeDetection({ redraw: RedrawType.MAJOR })
    strokeOpacity: number = 1;

    @Validate(FUNCTION, { optional: true })
    @SceneChangeDetection({ redraw: RedrawType.MAJOR })
    formatter?: (
        params: AgSeriesMarkerFormatterParams<TDatum> & RequireOptional<TParams>
    ) => AgSeriesMarkerStyle | undefined;

    getStyle(): AgSeriesMarkerStyle {
        const { size, fill, fillOpacity, stroke, strokeWidth, strokeOpacity } = this;
        return { size, fill, fillOpacity, stroke, strokeWidth, strokeOpacity };
    }

    getDiameter(): number {
        return this.size + this.strokeWidth;
    }
}
