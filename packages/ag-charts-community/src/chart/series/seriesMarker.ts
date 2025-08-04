import type { InternalAgColorType, RequireOptional } from 'ag-charts-core';
import type {
    AgMarkerShape,
    AgSeriesMarkerStyle,
    AgSeriesMarkerStylerParams,
    ISeriesMarker,
    Styler,
} from 'ag-charts-types';

import { SceneChangeDetection, SceneObjectChangeDetection, TRIPLE_EQ } from '../../scene/changeDetectable';
import { ChangeDetectableProperties } from '../../scene/util/changeDetectableProperties';
import { objectsEqual } from '../../util/object';
import { Property } from '../../util/properties';
import { FillGradientDefaults, FillImageDefaults, FillPatternDefaults } from './seriesProperties';

export class SeriesMarker<TParams = never>
    extends ChangeDetectableProperties
    implements ISeriesMarker<RequireOptional<TParams>>
{
    @Property
    @SceneChangeDetection()
    enabled = true;

    /** One of the predefined marker names, or a marker shape function (for user-defined markers). */
    @Property
    @SceneObjectChangeDetection({ equals: TRIPLE_EQ })
    shape: AgMarkerShape = 'circle';

    @Property
    @SceneChangeDetection()
    size: number = 0; // Default derived from series-specific theme practically.

    @Property
    @SceneObjectChangeDetection({ equals: objectsEqual })
    fill?: InternalAgColorType;

    @Property
    readonly fillGradientDefaults = new FillGradientDefaults();

    @Property
    readonly fillPatternDefaults = new FillPatternDefaults();

    @Property
    readonly fillImageDefaults = new FillImageDefaults();

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
    @SceneObjectChangeDetection({ equals: TRIPLE_EQ })
    itemStyler?: Styler<
        AgSeriesMarkerStylerParams<unknown, unknown> & RequireOptional<Omit<TParams, 'context'>>,
        AgSeriesMarkerStyle
    >;

    getStyle(): AgSeriesMarkerStyle {
        const {
            size = 0,
            shape,
            fill,
            fillOpacity,
            stroke,
            strokeWidth,
            strokeOpacity,
            lineDash,
            lineDashOffset,
        } = this;

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
        return (this.size ?? 0) + this.strokeWidth;
    }
}
