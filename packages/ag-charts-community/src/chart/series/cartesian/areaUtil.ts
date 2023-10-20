import type { ModuleContext } from '../../../module/moduleContext';
import type { AgSeriesMarkerStyle } from '../../../options/series/markerOptions';
import type { DropShadow } from '../../../scene/dropShadow';
import type { Point } from '../../../scene/point';
import type { Selection } from '../../../scene/selection';
import type { Path } from '../../../scene/shape/path';
import type { Text } from '../../../scene/shape/text';
import type { Marker } from '../../marker/marker';
import type { SeriesNodeDataContext } from '../series';
import type { CartesianSeriesNodeDatum } from './cartesianSeries';

export enum AreaSeriesTag {
    Fill,
    Stroke,
    Marker,
    Label,
}

export interface AreaPathPoint {
    x: number;
    y: number;
    yValue?: number;
    itemId?: string;
}

export type AreaPathDatum = {
    readonly points: AreaPathPoint[];
    readonly itemId: string;
};

interface AreaSeriesStyleOptions {
    stroke: string;
    fill: string;
    fillOpacity: number;
    lineDash?: number[];
    lineDashOffset: number;
    strokeOpacity: number;
    strokeWidth: number;
    shadow?: DropShadow;
}

type MarkerDatum = Omit<Required<CartesianSeriesNodeDatum>, 'yKey' | 'yValue'>;

export function areaAnimateReadyUpdate<
    MarkerNodeDatum extends MarkerDatum,
    LabelNodeDatum extends Readonly<Point>,
    FillDatum extends AreaPathDatum,
    StrokeDatum extends AreaPathDatum,
    ContextDatum extends SeriesNodeDataContext<MarkerNodeDatum, LabelNodeDatum> & {
        fillData: FillDatum;
        strokeData: StrokeDatum;
    },
>({
    contextData,
    paths,
    styles,
}: {
    contextData: Array<ContextDatum>;
    paths: Array<Array<Path>>;
    styles: AreaSeriesStyleOptions;
}) {
    const {
        stroke: seriesStroke,
        fill: seriesFill,
        fillOpacity,
        lineDash,
        lineDashOffset,
        strokeOpacity,
        strokeWidth,
        shadow,
    } = styles;

    contextData.forEach(({ strokeData, fillData }, seriesIdx) => {
        const [fill, stroke] = paths[seriesIdx];

        // Stroke
        stroke.setProperties({ stroke: seriesStroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset });
        stroke.path.clear({ trackChanges: true });

        let moveTo = true;
        strokeData.points.forEach((point) => {
            if (point.yValue === undefined || isNaN(point.x) || isNaN(point.y)) {
                moveTo = true;
            } else if (moveTo) {
                stroke.path.moveTo(point.x, point.y);
                moveTo = false;
            } else {
                stroke.path.lineTo(point.x, point.y);
            }
        });

        stroke.checkPathDirty();

        // Fill
        fill.setProperties({
            fill: seriesFill,
            fillShadow: shadow,
            fillOpacity,
            strokeOpacity,
            strokeWidth,
            lineDash,
            lineDashOffset,
        });

        fill.path.clear({ trackChanges: true });

        fillData.points.forEach((point) => {
            fill.path.lineTo(point.x, point.y);
        });

        fill.path.closePath();
        fill.checkPathDirty();
    });
}

export function areaResetMarkersAndPaths<
    MarkerNodeDatum extends MarkerDatum,
    LabelNodeDatum extends Readonly<Point>,
    FillDatum extends AreaPathDatum,
    StrokeDatum extends AreaPathDatum,
    ContextDatum extends SeriesNodeDataContext<MarkerNodeDatum, LabelNodeDatum> & {
        fillData: FillDatum;
        strokeData: StrokeDatum;
    },
    Formatter extends (...args: any[]) => AgSeriesMarkerStyle | undefined,
>({
    markerSelections,
    labelSelections,
    contextData,
    paths,
    styles,
    formatter,
    getFormatterParams,
    ctx,
}: {
    markerSelections: Array<Selection<Marker, MarkerNodeDatum> | undefined>;
    labelSelections: Array<Selection<Text, LabelNodeDatum>>;
    contextData: Array<ContextDatum>;
    paths: Array<Array<Path>>;
    styles: AreaSeriesStyleOptions;
    formatter?: Formatter;
    getFormatterParams: (datum: MarkerNodeDatum) => Parameters<Formatter>[0];
    ctx: ModuleContext;
}) {
    const {
        stroke: seriesStroke,
        fill: seriesFill,
        fillOpacity,
        lineDash,
        lineDashOffset,
        strokeOpacity,
        strokeWidth,
        shadow,
    } = styles;

    contextData.forEach(({ strokeData, fillData }, seriesIdx) => {
        const [fill, stroke] = paths[seriesIdx];

        // Stroke
        stroke.stroke = seriesStroke;
        stroke.strokeWidth = strokeWidth;
        stroke.strokeOpacity = strokeOpacity;
        stroke.lineDash = lineDash;
        stroke.lineDashOffset = lineDashOffset;

        stroke.path.clear({ trackChanges: true });

        let moveTo = true;
        strokeData.points.forEach((point) => {
            if (point.yValue === undefined || isNaN(point.x) || isNaN(point.y)) {
                moveTo = true;
            } else if (moveTo) {
                stroke.path.moveTo(point.x, point.y);
                moveTo = false;
            } else {
                stroke.path.lineTo(point.x, point.y);
            }
        });

        stroke.checkPathDirty();

        // Fill
        fill.fill = seriesFill;
        fill.fillOpacity = fillOpacity;
        fill.strokeOpacity = strokeOpacity;
        fill.strokeWidth = strokeWidth;
        fill.lineDash = lineDash;
        fill.lineDashOffset = lineDashOffset;
        fill.fillShadow = shadow;

        fill.path.clear({ trackChanges: true });

        fillData.points.forEach((point) => {
            fill.path.lineTo(point.x, point.y);
        });

        fill.path.closePath();
        fill.checkPathDirty();

        markerSelections[seriesIdx]?.cleanup().each((marker, datum) => {
            const format = formatter ? ctx.callbackCache.call(formatter as any, getFormatterParams(datum)) : null;
            marker.size = format?.size ?? datum.point?.size ?? 0;
        });

        labelSelections[seriesIdx].each((label) => {
            label.opacity = 1;
        });
    });
}
