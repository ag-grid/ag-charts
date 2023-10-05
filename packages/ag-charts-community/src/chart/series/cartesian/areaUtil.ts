import type { ModuleContext } from '../../../module/moduleContext';
import { fromToMotion } from '../../../motion/fromToMotion';
import type {
    AgCartesianSeriesMarkerFormat,
    AgCartesianSeriesMarkerFormatterParams,
} from '../../../options/agChartOptions';
import type { BBox } from '../../../scene/bbox';
import type { DropShadow } from '../../../scene/dropShadow';
import { PointerEvents } from '../../../scene/node';
import type { Path2D } from '../../../scene/path2D';
import type { Point } from '../../../scene/point';
import type { Selection } from '../../../scene/selection';
import type { Path } from '../../../scene/shape/path';
import type { Text } from '../../../scene/shape/text';
import { zipObject } from '../../../util/zip';
import type { ProcessedOutputDiff } from '../../data/dataModel';
import type { Marker } from '../../marker/marker';
import type { SeriesNodeDataContext, SeriesNodeDatum } from '../series';
import type { CartesianSeriesNodeDatum } from './cartesianSeries';
import {
    // createAnimatedPoints,
    createExistingPointsPathMap,
    createNodeBuckets,
    findEdgeNodes,
    findRemovedMarkers,
} from './lineUtil';

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

export type AreaPathData = {
    readonly points: AreaPathPoint[];
    readonly itemId: string;
};

export function animateAreaInitialLoad<
    MarkerDatum extends AreaMarkerDatum,
    LabelDatum extends AreaLabelDatum,
    FormatterParams extends AreaFormatterParams<MarkerDatum>,
>(options: AnimateAreaOptions<MarkerDatum, LabelDatum, FormatterParams>) {
    const { markerSelections, labelSelections, formatter, getFormatterParams, ...contextOptions } = options;
    const { contextData, paths } = contextOptions;

    const markerFormatter = createMarkerFormatter(formatter, getFormatterParams, options.ctx.callbackCache);

    animateMarkers<MarkerDatum, AreaMarkerSelection<MarkerDatum>>(markerSelections, markerFormatter, contextOptions);
    // animateLabels<LabelDatum, AreaLabelSelection<LabelDatum>>(labelSelections, contextOptions);

    contextData.forEach(({ fillData, strokeData }, seriesIndex) => {
        const [fill, stroke] = paths[seriesIndex];

        animateStrokeInitial(stroke, strokeData, seriesIndex, contextOptions);
        animateFillInitial(fill, fillData, seriesIndex, contextOptions);
    });
}

export function animateAreaUpdates<
    MarkerDatum extends AreaMarkerDatum,
    LabelDatum extends AreaLabelDatum,
    FormatterParams extends AreaFormatterParams<MarkerDatum>,
>(options: AnimateAreaUpdatesOptions<MarkerDatum, LabelDatum, FormatterParams>) {
    const {
        ctx: { animationManager, callbackCache },
        labelSelections,
        contextData,
        paths,
        diff,
        seriesId,
        formatter,
        getFormatterParams,
    } = options;

    if (!diff?.changed) {
        resetArea(options);
        return;
    }

    const markerFormatter = createMarkerFormatter(formatter, getFormatterParams, callbackCache);

    contextData.forEach(({ nodeData }, contextDataIndex) => {
        const areaUpdateFn = createAreaUpdateFn<MarkerDatum, LabelDatum, FormatterParams>(
            paths,
            contextDataIndex,
            nodeData as any,
            markerFormatter,
            options
        );
        const duration = animationManager.defaultDuration;

        // animateLabels(labelSelections[contextDataIndex], options);

        animationManager.animate({
            id: `${seriesId}_waiting-update-ready_${contextDataIndex}`,
            from: 0,
            to: 1,
            duration,
            shortCircuitId: seriesId,
            onUpdate: (ratio) => {
                areaUpdateFn?.(ratio);
            },
            onComplete: () => {
                resetArea(options);
            },
            onStop: () => {
                resetArea(options);
            },
        });
    });
}

export function resetArea<
    MarkerDatum extends AreaMarkerDatum,
    LabelDatum extends AreaLabelDatum,
    FormatterParams extends AreaFormatterParams<MarkerDatum>,
>(options: ResetAreaOptions<MarkerDatum, LabelDatum, FormatterParams>) {
    const { markerSelections, labelSelections, formatter, getFormatterParams, ...contextOptions } = options;
    const {
        ctx: { callbackCache },
        contextData,
        paths,
    } = contextOptions;

    const markerFormatter = createMarkerFormatter(formatter, getFormatterParams, callbackCache);

    contextData.forEach(({ strokeData, fillData }, seriesIndex) => {
        const [fill, stroke] = paths[seriesIndex];

        resetStroke(stroke, strokeData, contextOptions);
        resetFill(fill, fillData, contextOptions);
        resetMarkers<MarkerDatum, AreaMarkerSelection<MarkerDatum>>(markerSelections[seriesIndex], markerFormatter);
        resetLabels<LabelDatum, AreaLabelSelection<LabelDatum>>(labelSelections[seriesIndex]);
    });
}

interface AnimateAreaOptions<
    MarkerDatum extends AreaMarkerDatum,
    LabelDatum extends AreaLabelDatum,
    FormatterParams extends AreaFormatterParams<MarkerDatum>,
> extends ContextAnimateOptions {
    markerSelections: Array<AreaMarkerSelection<MarkerDatum>>;
    labelSelections: Array<AreaLabelSelection<LabelDatum>>;
    formatter?: Formatter<MarkerDatum, FormatterParams>;
    getFormatterParams: (datum: MarkerDatum) => FormatterParams;
}

interface AnimateAreaUpdatesOptions<
    MarkerDatum extends AreaMarkerDatum,
    LabelDatum extends AreaLabelDatum,
    FormatterParams extends AreaFormatterParams<MarkerDatum>,
> extends AnimateAreaOptions<MarkerDatum, LabelDatum, FormatterParams> {
    diff: ProcessedOutputDiff | undefined;
    getDatumId: (datum: MarkerDatum) => string;
}

interface ResetAreaOptions<
    MarkerDatum extends AreaMarkerDatum,
    LabelDatum extends AreaLabelDatum,
    FormatterParams extends AreaFormatterParams<MarkerDatum>,
> extends Omit<AnimateAreaOptions<MarkerDatum, LabelDatum, FormatterParams>, 'seriesId' | 'seriesRect'> {}

interface ContextAnimateOptions {
    contextData: Array<ContextDatum>;
    ctx: ModuleContext;
    paths: Array<Array<Path>>;
    seriesId: string;
    seriesRect?: BBox;
    styles: AreaSeriesStyleOptions;
}

type AreaMarkerDatum = Omit<Required<CartesianSeriesNodeDatum>, 'yKey' | 'yValue'>;
// interface AreaMarkerDatum extends Omit<Required<CartesianSeriesNodeDatum>, 'yKey' | 'yValue'> {
//     readonly point: SeriesNodeDatum['point'] & {
//         readonly moveTo: boolean;
//     };
// }
type AreaMarkerSelection<MarkerDatum extends AreaMarkerDatum> = Selection<Marker, MarkerDatum>;
type AreaLabelDatum = Readonly<Point>;
type AreaLabelSelection<LabelDatum extends AreaLabelDatum> = Selection<Text, LabelDatum>;

type ContextDatum = SeriesNodeDataContext<AreaMarkerDatum, AreaLabelDatum> & {
    fillData: AreaPathData;
    strokeData: AreaPathData;
};
type AreaFormatterParams<MarkerDatum extends AreaMarkerDatum> = Omit<
    AgCartesianSeriesMarkerFormatterParams<MarkerDatum>,
    'yKey' | 'yValue'
>;
type Formatter<MarkerDatum extends AreaMarkerDatum, FormatterParams extends AreaFormatterParams<MarkerDatum>> =
    | ((params: FormatterParams) => AgCartesianSeriesMarkerFormat)
    | undefined;

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

function animateStrokeInitial(
    stroke: Path,
    strokeData: AreaPathData,
    seriesIndex: number,
    options: ContextAnimateOptions
) {
    const { ctx, seriesId, seriesRect, styles } = options;
    const { stroke: seriesStroke, lineDash, lineDashOffset, strokeOpacity, strokeWidth } = styles;

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
        id: `${seriesId}_empty-update-ready_stroke_${seriesIndex}`,
        from: 0,
        to: seriesRect?.width ?? 0,
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

function animateFillInitial(fill: Path, fillData: AreaPathData, seriesIndex: number, options: ContextAnimateOptions) {
    const { ctx, seriesId, seriesRect, styles } = options;
    const { fill: seriesFill, fillOpacity, lineDash, lineDashOffset, strokeOpacity, strokeWidth, shadow } = styles;
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
        id: `${seriesId}_empty-update-ready_fill_${seriesIndex}`,
        from: 0,
        to: seriesRect?.width ?? 0,
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
                fill.path.lineTo(bottomPoints[bottomPoints.length - 1].x, bottomPoints[bottomPoints.length - 1].y);
            }

            fill.path.closePath();
            fill.checkPathDirty();
        },
    });
}

function createAreaUpdateFn<
    MarkerDatum extends AreaMarkerDatum,
    LabelDatum extends AreaLabelDatum,
    FormatterParams extends AreaFormatterParams<MarkerDatum>,
>(
    paths: Array<Array<Path>>,
    contextDataIndex: number,
    nodeData: Array<MarkerDatum>,
    markerFormatter: ((datum: MarkerDatum) => AgCartesianSeriesMarkerFormat | undefined) | undefined,
    options: AnimateAreaUpdatesOptions<MarkerDatum, LabelDatum, FormatterParams>
) {
    const { getDatumId, markerSelections, labelSelections, diff } = options;

    if (!diff) return;

    const [lineNode] = paths[contextDataIndex];
    const { path: linePath } = lineNode;

    const markerNodes: { [keyof: string]: Marker } = {};
    markerSelections[contextDataIndex].each((marker, datum) => {
        markerNodes[getDatumId(datum)] = marker;
    });

    labelSelections[contextDataIndex].each((label) => {
        label.opacity = 0;
    });

    // Zip diff arrays into keyed objects for O(1) access
    const addedIds = zipObject(diff.added, true);
    const addedIndices = zipObject(diff.addedIndices, true);
    const removedIds = zipObject(diff.removed, true);
    const removedIndices = zipObject(diff.removedIndices, true);

    const pathPoints = linePath.getPoints();

    const { firstExistingIndex, lastExistingIndex } = findEdgeNodes(nodeData, addedIds, getDatumId);
    const { removedPoints, existingPointsPathMap } = createExistingPointsPathMap(
        pathPoints,
        removedIndices,
        addedIndices,
        nodeData
    );
    const removedMarkers = findRemovedMarkers(markerSelections[contextDataIndex], removedIds, getDatumId);
    const { removedBefore, removedAfter, removedBeforeMarkers, removedAfterMarkers } = createNodeBuckets(
        existingPointsPathMap,
        removedPoints,
        removedMarkers,
        pathPoints
    );

    const markerFormats: Record<string, AgCartesianSeriesMarkerFormat | undefined> = {};

    return (ratio: number) => {
        linePath.clear({ trackChanges: true });

        // Animate out nodes that were removed before the first node
        const first = nodeData[0];
        const firstDatumId = getDatumId(first);
        for (let i = 0; i < removedBefore.length; i++) {
            const removed = removedBefore[i];
            const { x, y } = findPointOnLine(removed, first.point, ratio);
            linePath.lineTo(x, y);
        }

        markerFormats[firstDatumId] ??= markerFormatter?.(markerNodes[firstDatumId].datum);
        const firstMarkerSize = markerFormats[firstDatumId]?.size ?? first.point.size ?? 0;

        for (const removed of removedBeforeMarkers) {
            removed.setProperties({
                x: ratio * (first.point.x - removed.translationX),
                y: ratio * (first.point.y - removed.translationY),
                size: (1 - ratio) * firstMarkerSize,
            });
        }

        for (let index = 0; index < nodeData.length; index++) {
            const datum = nodeData[index];
            const { point } = datum as any;
            const datumId = getDatumId(datum);
            const prevPoint = index > 0 ? nodeData[index - 1].point : undefined;

            const existingIndex = existingPointsPathMap.get(index);
            const prevExistingIndex = existingPointsPathMap.get(index - 1);

            const pathPoint = existingIndex != null ? pathPoints[existingIndex] : undefined;
            const prevPathPoint = prevExistingIndex != null ? pathPoints[prevExistingIndex] : undefined;

            const marker = markerNodes[datumId];
            let markerX = point.x;
            let markerY = point.y;

            markerFormats[datumId] ??= markerFormatter?.(marker.datum);
            let markerSize = markerFormats[datumId]?.size ?? datum.point?.size ?? 0;

            // Find nodes that were removed between this point and the previous point
            const removedBetween = [];
            const removedBetweenMarkers = [];

            for (let i = 0; i < removedPoints.length; i++) {
                const removed = removedPoints[i];
                const removedMarker = removedMarkers[i];

                if (prevPathPoint && pathPoint && removed.x > prevPathPoint.x && removed.x < pathPoint.x) {
                    removedBetween.push(removed);
                    removedBetweenMarkers.push(removedMarker);
                }
            }

            // Animate out nodes that were removed between two other nodes
            if (prevPoint) {
                for (let i = 0; i < removedBetween.length; i++) {
                    const removed = removedBetween[i];

                    // Flatten the line such that each 'between' point moves to an equal fraction along the
                    // final straight line between the previous and next points
                    const fraction = (i + 1) / (removedBetween.length + 1);
                    const { x, y } = findPointOnLine(removed, findPointOnLine(prevPoint, point, fraction), ratio);

                    linePath.lineTo(x, y);
                }

                // for (let i = 0; i < removedBetweenMarkers.length; i++) {
                //     const removed = removedBetweenMarkers[i];

                //     const fraction = (i + 1) / (removedBetweenMarkers.length + 1);

                //     let { x, y } = findPointOnLine(prevPoint, point, fraction);

                //     x -= removed.translationX;
                //     y -= removed.translationY;

                //     x *= ratio;
                //     y *= ratio;

                //     removed.size = (1 - ratio) * markerSize;
                //     removed.x = x;
                //     removed.y = y;
                // }
            }

            if (addedIds[datumId] && index > lastExistingIndex) {
                // Animate in nodes that were added after the last existing node
                const startPoint = nodeData[lastExistingIndex].point;
                const startExistingIndex = existingPointsPathMap.get(lastExistingIndex);
                const start = startExistingIndex != null ? pathPoints[startExistingIndex] : startPoint;

                const { x, y } = findPointOnLine(start, point, ratio);
                markerX = x;
                markerY = y;
                markerSize *= ratio;

                extendLine(linePath, { x, y, moveTo: point.moveTo });
            } else if (addedIds[datumId] && index < firstExistingIndex) {
                // Animate in nodes that were added before the first existing node
                const startPoint = nodeData[firstExistingIndex].point;
                const startExistingIndex = existingPointsPathMap.get(firstExistingIndex);
                const start = startExistingIndex != null ? pathPoints[startExistingIndex] : startPoint;

                const { x, y } = findPointOnLine(start, point, ratio);
                markerX = x;
                markerY = y;
                markerSize *= ratio;

                extendLine(linePath, { x, y, moveTo: point.moveTo });
            } else if (addedIds[datumId]) {
                // Animate in nodes that were added between other nodes

                // Find the line between the nodes that existed either side of this group of added nodes
                let startPoint = point;
                let endPoint = point;
                let startIndex = index;
                let endIndex = index;
                let addedBetweenCount = 1;

                for (let i = index - 1; i > 0; i--) {
                    if (!addedIds[getDatumId(nodeData[i])]) {
                        startPoint = nodeData[i].point;
                        startIndex = i;
                        break;
                    }

                    addedBetweenCount++;
                }

                for (let i = index + 1; i < nodeData.length; i++) {
                    if (!addedIds[getDatumId(nodeData[i])]) {
                        endPoint = nodeData[i].point;
                        endIndex = i;
                        break;
                    }

                    addedBetweenCount++;
                }

                const startExistingIndex = existingPointsPathMap.get(startIndex);
                const endExistingIndex = existingPointsPathMap.get(endIndex);
                const start = startExistingIndex != null ? pathPoints[startExistingIndex] : startPoint;
                const end = endExistingIndex != null ? pathPoints[endExistingIndex] : endPoint;

                const fraction = (index - startIndex) / (addedBetweenCount + 1);

                const { x, y } = findPointOnLine(findPointOnLine(start, end, fraction), point, ratio);
                markerX = x;
                markerY = y;
                markerSize *= ratio;

                linePath.lineTo(x, y);
            } else if (pathPoint) {
                // Translate nodes that existed at other coordinates

                const x = (markerX = (1 - ratio) * pathPoint.x + ratio * point.x);
                const y = (markerY = (1 - ratio) * pathPoint.y + ratio * point.y);

                const hasRemovedAllPointsBefore = index === 0 && removedBefore.length > 0;

                if (point.moveTo && !hasRemovedAllPointsBefore) {
                    linePath.moveTo(x, y);
                } else {
                    linePath.lineTo(x, y);
                }
            } else {
                // Catch any other nodes and immediately place them at their final position
                extendLine(linePath, point);
            }

            // marker.translationX = markerX;
            // marker.translationY = markerY;
            // marker.size = markerSize;
        }

        // Animate out nodes that were removed after the last node
        const last = nodeData[nodeData.length - 1];
        const lastDatumId = getDatumId(last);
        for (let i = 0; i < removedAfter.length; i++) {
            const removed = removedAfter[i];
            const { x, y } = findPointOnLine(removed, last.point, ratio);
            linePath.lineTo(x, y);
        }

        markerFormats[lastDatumId] ??= markerFormatter?.(markerNodes[lastDatumId].datum);
        const lastMarkerSize = markerFormats[lastDatumId]?.size ?? last.point.size ?? 0;

        // for (let i = 0; i < removedAfterMarkers.length; i++) {
        //     const removed = removedAfterMarkers[i];

        //     const x = ratio * (last.point.x - removed.translationX);
        //     const y = ratio * (last.point.y - removed.translationY);

        //     removed.size = (1 - ratio) * lastMarkerSize;
        //     removed.x = x;
        //     removed.y = y;
        // }

        lineNode.checkPathDirty();
    };
}

function animatePathUpdate(
    id: string,
    path: Path,
    points: Array<{ from: { x: number; y: number }; to: { x: number; y: number }; moveTo: boolean }>,
    options: ContextAnimateOptions
) {
    const {
        ctx: { animationManager },
    } = options;

    animationManager.animate({
        id,
        from: 0,
        to: 1,
        duration: animationManager.defaultDuration,
        onUpdate(ratio: number) {
            path.path.clear({ trackChanges: true });

            for (let index = 0; index < points.length; index++) {
                const point = points[index];
                const { x, y } = findPointOnLine(point.from, point.to, ratio);
                extendLine(path.path, { x, y, moveTo: point.moveTo });
            }

            if (path.fill != null) path.path.closePath();
            path.checkPathDirty();
        },
    });
}

function extendLine(linePath: Path2D, point: { x: number; y: number; moveTo: boolean }) {
    if (point.moveTo) {
        linePath.moveTo(point.x, point.y);
    } else {
        linePath.lineTo(point.x, point.y);
    }
}

function findPointOnLine(a: { x: number; y: number }, b: { x: number; y: number }, distance: number) {
    // Find a point a distance along the line from `a` and `b`
    const x = a.x + distance * (b.x - a.x);
    const y = a.y + distance * (b.y - a.y);
    return { x, y };
}

/*
function animateStrokeUpdate(
    stroke: Path,
    strokeData: AreaPathData,
    seriesIndex: number,
    options: AnimateAreaUpdatesOptions<MarkerDatum, LabelDatum, FormatterParams>
) {
    const { ctx, seriesId, getDatumId, diff } = options;
    const { points } = strokeData;

    const animatedPath = createAnimatedPath(points, getDatumId);

    ctx.animationManager.animate({
        id: `${seriesId}_stroke_update_${seriesIndex}`,
        from: 0,
        to: 1,
        onUpdate(ratio) {
            stroke.path.clear({ trackChanges: true });

            animatePathAtRatio(animatedPath, ratio);

            stroke.checkPathDirty();
        },
    });
}

function animateFillUpdate(fill: Path, fillData: AreaPathData, seriesIndex: number, options: ContextAnimateOptions) {
    const { ctx, seriesId } = options;

    const { points: allPoints } = fillData;
    const points = allPoints.slice(0, allPoints.length / 2);
    const bottomPoints = allPoints.slice(allPoints.length / 2);

    ctx.animationManager.animate({
        id: `${seriesId}_empty-update-ready_fill_${seriesIndex}`,
        from: 0,
        to: 1,
        onUpdate(ratio) {
            fill.path.clear({ trackChanges: true });

            // ...

            fill.path.closePath();
            fill.checkPathDirty();
        },
    });
}
*/

function animateMarkersUpdate<
    MarkerDatum extends AreaMarkerDatum,
    MarkerSelection extends AreaMarkerSelection<MarkerDatum>,
>(
    markerSelection: MarkerSelection,
    formatter: ((datum: MarkerDatum) => any) | undefined,
    options: ContextAnimateOptions
) {
    //
}

function animateMarkers<MarkerDatum extends AreaMarkerDatum, MarkerSelection extends AreaMarkerSelection<MarkerDatum>>(
    markerSelections: Array<MarkerSelection>,
    formatter: ((datum: MarkerDatum) => any) | undefined,
    options: ContextAnimateOptions
) {
    const {
        ctx: { animationManager },
        seriesId,
        seriesRect,
    } = options;

    const duration = 200;
    // const delay = seriesRect?.width ? (datum.point.x / seriesRect.width) * animationManager.defaultDuration : 0;
    const delay = animationManager.defaultDuration;

    fromToMotion(
        `${seriesId}_marker`,
        animationManager,
        markerSelections,
        () => ({ size: 0 }),
        (marker, datum) => ({ size: formatter?.(datum)?.format?.size ?? datum.point?.size ?? marker.size })
        // { delay, duration }
    );
}

/*
function animateLabels<LabelDatum extends AreaLabelDatum, LabelSelection extends AreaLabelSelection<LabelDatum>>(
    labelSelections: Array<LabelSelection>,
    options: ContextAnimateOptions
) {
    const {
        ctx: { animationManager },
        seriesId,
        seriesRect,
    } = options;

    const duration = 200;
    // const delay = seriesRect?.width ? (datum.x / seriesRect.width) * ctx.animationManager.defaultDuration : 0;
    const delay = animationManager.defaultDuration;

    fromToMotion(
        `${seriesId}_label`,
        animationManager,
        labelSelections,
        () => ({ opacity: 0 }),
        () => ({ opacity: 1 }),
        { delay, duration }
    );
}
*/

function resetStroke(
    stroke: Path,
    strokeData: AreaPathData,
    options: Omit<ContextAnimateOptions, 'seriesRect' | 'seriesId'>
) {
    const { styles } = options;
    const { stroke: seriesStroke, lineDash, lineDashOffset, strokeOpacity, strokeWidth } = styles;

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
}

function resetFill(
    fill: Path,
    fillData: AreaPathData,
    options: Omit<ContextAnimateOptions, 'seriesRect' | 'seriesId'>
) {
    const { styles } = options;
    const { fill: seriesFill, fillOpacity, lineDash, lineDashOffset, strokeOpacity, strokeWidth, shadow } = styles;

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
}

function resetMarkers<MarkerDatum extends AreaMarkerDatum, MarkerSelection extends AreaMarkerSelection<MarkerDatum>>(
    markerSelection: MarkerSelection,
    formatter: any
) {
    markerSelection?.cleanup().each((marker, datum) => {
        const format = formatter?.(datum);
        marker.size = format?.size ?? datum.point?.size ?? 0;
    });
}

function resetLabels<LabelDatum extends AreaLabelDatum, LabelSelection extends AreaLabelSelection<LabelDatum>>(
    labelSelection: LabelSelection
) {
    labelSelection.each((label) => {
        label.opacity = 1;
    });
}

function createMarkerFormatter<
    MarkerDatum extends AreaMarkerDatum,
    FormatterParams extends AreaFormatterParams<MarkerDatum>,
>(
    formatter: Formatter<MarkerDatum, FormatterParams>,
    getFormatterParams: (datum: MarkerDatum) => FormatterParams,
    callbackCache: ModuleContext['callbackCache']
) {
    if (!formatter) return;
    return (datum: MarkerDatum) => callbackCache.call(formatter, getFormatterParams(datum));
}
