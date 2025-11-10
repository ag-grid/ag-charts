import type { InternalAgColorType, RequireOptional } from 'ag-charts-core';
import { Property, objectsEqual } from 'ag-charts-core';
import type { AgMarkerShape, AgSeriesMarkerStyle, AgSeriesMarkerStylerParams, Styler } from 'ag-charts-types';

import { SceneChangeDetection, SceneObjectChangeDetection, TRIPLE_EQ } from '../../scene/changeDetectable';
import { ChangeDetectableProperties } from '../../scene/util/changeDetectableProperties';

export class SeriesMarker<TParams = never> extends ChangeDetectableProperties {
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
        } satisfies RequireOptional<AgSeriesMarkerStyle>;
    }

    getDiameter(): number {
        return this.size + this.strokeWidth;
    }
}
