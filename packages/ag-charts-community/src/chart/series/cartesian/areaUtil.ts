import type { ModuleContext } from '../../../module/moduleContext';
import type {
    AgCartesianSeriesMarkerFormat,
    AgCartesianSeriesMarkerFormatterParams,
} from '../../../options/agChartOptions';
import type { BBox } from '../../../scene/bbox';
import type { DropShadow } from '../../../scene/dropShadow';
import { PointerEvents } from '../../../scene/node';
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

export function areaAnimateEmptyUpdateReady<
    MarkerNodeDatum extends MarkerDatum,
    LabelNodeDatum extends Readonly<Point>,
    FillDatum extends AreaPathDatum,
    StrokeDatum extends AreaPathDatum,
    ContextDatum extends SeriesNodeDataContext<MarkerNodeDatum, LabelNodeDatum> & {
        fillData: FillDatum;
        strokeData: StrokeDatum;
    },
    FormatterParams extends Omit<AgCartesianSeriesMarkerFormatterParams<MarkerNodeDatum>, 'yKey' | 'yValue'>,
    Formatter extends ((params: FormatterParams) => AgCartesianSeriesMarkerFormat) | undefined,
>({
    markerSelections,
    labelSelections,
    contextData,
    paths,
    seriesRect,
    seriesId,
    styles,
    formatter,
    getFormatterParams,
    ctx,
}: {
    markerSelections: Array<Selection<Marker, MarkerNodeDatum> | undefined>;
    labelSelections: Array<Selection<Text, LabelNodeDatum>>;
    contextData: Array<ContextDatum>;
    paths: Array<Array<Path>>;
    seriesRect?: BBox;
    seriesId: string;
    styles: AreaSeriesStyleOptions;
    formatter?: Formatter;
    getFormatterParams: (datum: MarkerNodeDatum) => FormatterParams;
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

    contextData.forEach(({ fillData, strokeData }, seriesIdx) => {
        const [fill, stroke] = paths[seriesIdx];

        const duration = ctx.animationManager.defaultDuration;
        const animationOptions = { from: 0, to: seriesRect?.width ?? 0 };
        const markerDuration = 200;

        // Stroke
        {
            const { points } = strokeData;

            stroke.setProperties({
                tag: AreaSeriesTag.Stroke,
                fill: undefined,
                lineJoin: (stroke.lineCap = 'round'),
                pointerEvents: PointerEvents.None,
                stroke: seriesStroke,
                strokeWidth,
                strokeOpacity,
                lineDash,
                lineDashOffset,
            });

            ctx.animationManager.animate({
                id: `${seriesId}_empty-update-ready_stroke_${seriesIdx}`,
                ...animationOptions,
                onUpdate(xValue) {
                    stroke.path.clear({ trackChanges: true });

                    let moveTo = true;
                    points.forEach((point, index) => {
                        // Draw/move the full segment if past the end of this segment
                        if (point.yValue === undefined || isNaN(point.x) || isNaN(point.y)) {
                            moveTo = true;
                        } else if (point.x <= xValue) {
                            if (moveTo) {
                                stroke.path.moveTo(point.x, point.y);
                                moveTo = false;
                            } else {
                                stroke.path.lineTo(point.x, point.y);
                            }
                        } else if (
                            index > 0 &&
                            point.yValue !== undefined &&
                            points[index - 1].yValue !== undefined &&
                            points[index - 1].x <= xValue
                        ) {
                            // Draw/move partial line if in between the start and end of this segment
                            const start = points[index - 1];
                            const end = point;

                            const x = xValue;
                            const y = start.y + ((x - start.x) * (end.y - start.y)) / (end.x - start.x);

                            stroke.path.lineTo(x, y);
                        }
                    });

                    stroke.checkPathDirty();
                },
            });
        }

        // Fill
        {
            const { points: allPoints } = fillData;
            const points = allPoints.slice(0, allPoints.length / 2);
            const bottomPoints = allPoints.slice(allPoints.length / 2);

            fill.setProperties({
                tag: AreaSeriesTag.Fill,
                stroke: undefined,
                lineJoin: 'round',
                pointerEvents: PointerEvents.None,
                fill: seriesFill,
                fillOpacity: fillOpacity,
                strokeOpacity: strokeOpacity,
                strokeWidth: strokeWidth,
                lineDash: lineDash,
                lineDashOffset: lineDashOffset,
                fillShadow: shadow,
            });

            ctx.animationManager.animate({
                id: `${seriesId}_empty-update-ready_fill_${seriesIdx}`,
                ...animationOptions,
                onUpdate(xValue) {
                    fill.path.clear({ trackChanges: true });

                    let x = 0;
                    let y = 0;

                    points.forEach((point, index) => {
                        if (point.x <= xValue) {
                            // Draw/move the full segment if past the end of this segment
                            x = point.x;
                            y = point.y;

                            fill.path.lineTo(point.x, point.y);
                        } else if (index > 0 && points[index - 1].x < xValue) {
                            // Draw/move partial line if in between the start and end of this segment
                            const start = points[index - 1];
                            const end = point;

                            x = xValue;
                            y = start.y + ((x - start.x) * (end.y - start.y)) / (end.x - start.x);

                            fill.path.lineTo(x, y);
                        }
                    });

                    bottomPoints.forEach((point, index) => {
                        const reverseIndex = bottomPoints.length - index - 1;

                        if (point.x <= xValue) {
                            fill.path.lineTo(point.x, point.y);
                        } else if (reverseIndex > 0 && points[reverseIndex - 1].x < xValue) {
                            const start = point;
                            const end = bottomPoints[index + 1];

                            const bottomY = start.y + ((x - start.x) * (end.y - start.y)) / (end.x - start.x);

                            fill.path.lineTo(x, bottomY);
                        }
                    });

                    if (bottomPoints.length > 0) {
                        fill.path.lineTo(
                            bottomPoints[bottomPoints.length - 1].x,
                            bottomPoints[bottomPoints.length - 1].y
                        );
                    }

                    fill.path.closePath();
                    fill.checkPathDirty();
                },
            });
        }

        markerSelections[seriesIdx]?.each((marker, datum) => {
            const delay = seriesRect?.width ? (datum.point.x / seriesRect.width) * duration : 0;
            const format = areaAnimateFormatter<MarkerNodeDatum, FormatterParams, Formatter>({
                datum,
                ctx,
                formatter,
                getFormatterParams,
            });

            ctx.animationManager.animate({
                id: `${seriesId}_empty-update-ready_${marker.id}`,
                ...animationOptions,
                to: format?.size ?? datum.point?.size ?? 0,
                delay,
                duration: markerDuration,
                onUpdate(size) {
                    marker.size = size;
                },
            });
        });

        labelSelections[seriesIdx].each((label, datum) => {
            ctx.animationManager.animate({
                id: `${seriesId}_empty-update-ready_${label.id}`,
                from: 0,
                to: 1,
                delay: seriesRect?.width ? (datum.x / seriesRect.width) * duration : 0,
                duration: markerDuration,
                onUpdate(opacity) {
                    label.opacity = opacity;
                },
            });
        });
    });
}

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
    FormatterParams extends Omit<AgCartesianSeriesMarkerFormatterParams<MarkerNodeDatum>, 'yKey' | 'yValue'>,
    Formatter extends ((params: FormatterParams) => AgCartesianSeriesMarkerFormat) | undefined,
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
    getFormatterParams: (datum: MarkerNodeDatum) => FormatterParams;
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
            const format = areaAnimateFormatter<MarkerNodeDatum, FormatterParams, Formatter>({
                datum,
                ctx,
                formatter,
                getFormatterParams,
            });
            marker.size = format?.size ?? datum.point?.size ?? 0;
        });

        labelSelections[seriesIdx].each((label) => {
            label.opacity = 1;
        });
    });
}

function areaAnimateFormatter<
    MarkerNodeDatum extends MarkerDatum,
    FormatterParams extends Omit<AgCartesianSeriesMarkerFormatterParams<MarkerNodeDatum>, 'yKey' | 'yValue'>,
    Formatter extends ((params: FormatterParams) => AgCartesianSeriesMarkerFormat) | undefined,
>({
    datum,
    ctx: { callbackCache },
    formatter,
    getFormatterParams,
}: {
    datum: MarkerNodeDatum;
    ctx: ModuleContext;
    formatter?: Formatter;
    getFormatterParams: (datum: MarkerNodeDatum) => FormatterParams;
}) {
    let format: AgCartesianSeriesMarkerFormat | undefined;
    if (formatter) {
        format = callbackCache.call(formatter as any, {
            ...getFormatterParams(datum),
        });
    }

    return format;
}
