import type { InternalAgColorType, RequireOptional } from 'ag-charts-core';
import type {
    AgMarkerShape,
    AgSeriesMarkerStyle,
    AgSeriesMarkerStylerParams,
    ISeriesMarker,
    Styler,
} from 'ag-charts-types';

import { SceneChangeDetection } from '../../scene/changeDetectable';
import { ChangeDetectableProperties } from '../../scene/util/changeDetectableProperties';
import { Property } from '../../util/properties';
import { FillGradientDefaults, FillPatternDefaults } from './seriesProperties';

export class SeriesMarker<TParams = never>
    extends ChangeDetectableProperties
    implements ISeriesMarker<RequireOptional<TParams>>
{
    @Property
    @SceneChangeDetection()
    enabled = true;

    /** One of the predefined marker names, or a marker shape function (for user-defined markers). */
    @Property
    @SceneChangeDetection()
    shape: AgMarkerShape = 'circle';

    @Property
    @SceneChangeDetection()
    size: number = 6;

    @Property
    @SceneChangeDetection()
    fill?: InternalAgColorType;

    @Property
    readonly fillGradientDefaults = new FillGradientDefaults();

    @Property
    readonly fillPatternDefaults = new FillPatternDefaults();

    @Property
    @SceneChangeDetection()
    fillOpacity: number = 1;

    @Property
    @SceneChangeDetection()
    stroke?: string;

    @Property
    @SceneChangeDetection()
    strokeWidth: number = 1;

    @Property
    @SceneChangeDetection()
    strokeOpacity: number = 1;

    @Property
    lineDash: number[] = [0];

    @Property
    lineDashOffset: number = 0;

    @Property
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
