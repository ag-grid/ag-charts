import type { ModuleContext } from '../../../module/moduleContext';
import type {
    AgCartesianSeriesMarkerFormat,
    AgCartesianSeriesMarkerFormatterParams,
    FontStyle,
    FontWeight,
} from '../../../options/agChartOptions';
import type { BBox } from '../../../scene/bbox';
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
import type { CartesianSeriesNodeDatum, LabelDataSelection, NodeDataSelection } from './cartesianSeries';

export function animateLineInitialLoad(options: AnimateLineOptions) {
    const { markerSelections, labelSelections, formatter, getFormatterParams, ...contextOptions } = options;
    const {
        ctx: { callbackCache },
        contextData,
        paths,
    } = contextOptions;

    const markerFormatter = createMarkerFormatter(formatter, getFormatterParams, callbackCache);

    contextData.forEach(({ nodeData }, contextDataIndex) => {
        const [lineNode] = paths[contextDataIndex];

        const { datumLengths, lineLength } = calculateLengths(nodeData);

        animateLineInitial(lineNode, nodeData, datumLengths, lineLength, contextOptions);
        animateMarkersInitial(
            markerSelections[contextDataIndex],
            datumLengths,
            lineLength,
            markerFormatter,
            contextOptions
        );
        animateLabelsInitial(labelSelections[contextDataIndex], datumLengths, lineLength, contextOptions);
    });
}

export function animateLineUpdates<NodeDatum extends LineNodeDatum>(options: AnimateLineUpdatesOptions<NodeDatum>) {
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
        resetLine(options);
        return;
    }

    const markerFormatter = createMarkerFormatter(formatter, getFormatterParams, callbackCache);

    contextData.forEach(({ nodeData }, contextDataIndex) => {
        const lineUpdateFn = createLineUpdateFn(paths, contextDataIndex, nodeData, markerFormatter, options as any);
        const duration = animationManager.defaultDuration;

        animateLabels(labelSelections[contextDataIndex], options);

        animationManager.animate({
            id: `${seriesId}_waiting-update-ready_${contextDataIndex}`,
            from: 0,
            to: 1,
            duration,
            shortCircuitId: seriesId,
            onUpdate: (ratio) => {
                lineUpdateFn?.(ratio);
            },
            onComplete: () => {
                resetLine(options);
            },
            onStop: () => {
                resetLine(options);
            },
        });
    });
}

export function resetLine(options: AnimateLineOptions) {
    const { markerSelections, labelSelections, formatter, getFormatterParams, ...contextOptions } = options;
    const {
        ctx: { callbackCache },
        contextData,
        paths,
    } = contextOptions;

    const markerFormatter = createMarkerFormatter(formatter, getFormatterParams, callbackCache);

    contextData.forEach(({ nodeData }, contextDataIndex) => {
        const [lineNode] = paths[contextDataIndex];

        resetPath(lineNode, nodeData, contextOptions);
        resetMarkers(markerSelections[contextDataIndex], markerFormatter);
    });
}

interface LineNodeDatum extends CartesianSeriesNodeDatum {
    readonly point: SeriesNodeDatum['point'] & {
        readonly moveTo: boolean;
    };
    readonly label?: {
        readonly text: string;
        readonly fontStyle?: FontStyle;
        readonly fontWeight?: FontWeight;
        readonly fontSize: number;
        readonly fontFamily: string;
        readonly textAlign: CanvasTextAlign;
        readonly textBaseline: CanvasTextBaseline;
        readonly fill: string;
    };
}

interface AnimateLineOptions extends ContextAnimateOptions {
    markerSelections: Array<LineMarkerSelection>;
    labelSelections: Array<LineLabelSelection>;
    formatter?: Formatter;
    getFormatterParams: (datum: LineNodeDatum) => LineFormatterParams;
}

interface AnimateLineUpdatesOptions<NodeDatum> extends AnimateLineOptions {
    diff: ProcessedOutputDiff | undefined;
    getDatumId: (datum: NodeDatum) => string;
}

interface ContextAnimateOptions {
    contextData: Array<LineContext>;
    ctx: ModuleContext;
    paths: Array<Array<Path>>;
    seriesId: string;
    seriesRect?: BBox;
    duration?: number;
    styles: LineSeriesStyleOptions;
}

type LineContext = SeriesNodeDataContext<LineNodeDatum>;

type LineMarkerSelection = NodeDataSelection<Marker, LineContext>;
type LineLabelSelection = LabelDataSelection<Text, LineContext>;

type LineFormatterParams = AgCartesianSeriesMarkerFormatterParams<LineNodeDatum>;
type Formatter = ((params: LineFormatterParams) => AgCartesianSeriesMarkerFormat) | undefined;

interface LineSeriesStyleOptions {
    stroke: string;
    // fill: string;
    // fillOpacity: number;
    lineDash?: number[];
    lineDashOffset: number;
    strokeOpacity: number;
    strokeWidth: number;
}

function calculateLengths(lineData: Array<LineNodeDatum>) {
    const datumLengths: Array<number> = [0];
    const lineLength = lineData.reduce((sum, datum, index) => {
        if (index === 0) return sum;
        const prev = lineData[index - 1];
        if (isNaN(datum.point.x) || isNaN(datum.point.y) || isNaN(prev.point.x) || isNaN(prev.point.y)) {
            datumLengths.push(sum);
            return sum;
        }
        const length = Math.sqrt(Math.pow(datum.point.x - prev.point.x, 2) + Math.pow(datum.point.y - prev.point.y, 2));
        datumLengths.push(sum + length);
        return sum + length;
    }, 0);

    return { datumLengths, lineLength };
}

function animateLineInitial(
    line: Path,
    lineData: Array<LineNodeDatum>,
    datumLengths: Array<number>,
    lineLength: number,
    options: ContextAnimateOptions
) {
    const { path: linePath } = line;
    const { ctx, seriesId, styles } = options;
    const { lineDash, lineDashOffset, stroke, strokeOpacity, strokeWidth } = styles;

    const duration = options.duration ?? ctx.animationManager.defaultDuration;

    line.setProperties({
        fill: undefined,
        lineDash,
        lineDashOffset,
        lineJoin: 'round',
        pointerEvents: PointerEvents.None,
        opacity: 1,
        stroke,
        strokeOpacity,
        strokeWidth,
    });

    ctx.animationManager.animate({
        id: `${seriesId}_empty-update-ready`,
        from: 0,
        to: lineLength,
        duration,
        onUpdate(length) {
            linePath.clear({ trackChanges: true });

            lineData.forEach((datum, index) => {
                if (datumLengths[index] <= length) {
                    // Draw/move the full segment if past the end of this segment
                    extendLine(linePath, datum.point);
                } else if (index > 0 && datumLengths[index - 1] < length) {
                    // Draw/move partial line if in between the start and end of this segment
                    const start = lineData[index - 1].point;
                    const end = datum.point;

                    const segmentLength = datumLengths[index] - datumLengths[index - 1];
                    const remainingLength = datumLengths[index] - length;
                    const ratio = (segmentLength - remainingLength) / segmentLength;

                    // const { x, y } = findPointOnLine(start, end, ratio);

                    const x = (1 - ratio) * start.x + ratio * end.x;
                    const y = (1 - ratio) * start.y + ratio * end.y;

                    extendLine(linePath, { x, y, moveTo: datum.point.moveTo });
                }
            });

            line.checkPathDirty();
        },
    });
}

function animateMarkersInitial(
    markerSelection: LineMarkerSelection,
    datumLengths: Array<number>,
    lineLength: number,
    markerFormatter: any,
    options: ContextAnimateOptions
) {
    const { ctx, seriesId } = options;

    const duration = options.duration ?? ctx.animationManager.defaultDuration;
    const markerDuration = 200;

    markerSelection.each((marker, datum, index) => {
        const delay = lineLength > 0 ? (datumLengths[index] / lineLength) * duration : 0;
        const format = markerFormatter?.(datum);
        const size = datum.point?.size ?? 0;
        marker.opacity = 1;

        ctx.animationManager.animate({
            id: `${seriesId}_empty-update-ready_${marker.id}`,
            from: 0,
            to: format?.size ?? size,
            delay,
            duration: markerDuration,
            onUpdate(size) {
                marker.size = size;
            },
        });
    });
}

function animateLabelsInitial(
    labelSelection: LineLabelSelection,
    datumLengths: Array<number>,
    lineLength: number,
    options: ContextAnimateOptions
) {
    const { ctx, seriesId } = options;

    const duration = options.duration ?? ctx.animationManager.defaultDuration;
    const labelDuration = 200;

    labelSelection.each((label, _, index) => {
        const delay = (datumLengths[index] / lineLength) * duration;
        ctx.animationManager.animate({
            id: `${seriesId}_label-initial_${label.id}`,
            from: 0,
            to: 1,
            delay,
            duration: labelDuration,
            onUpdate: (opacity) => {
                label.opacity = opacity;
            },
        });
    });
}

function animateLabels(labelSelection: LineLabelSelection, options: ContextAnimateOptions) {
    const { ctx, seriesId } = options;

    const labelDuration = 200;

    labelSelection.each((label) => {
        ctx.animationManager.animate({
            id: `${seriesId}_label_${label.id}`,
            from: 0,
            to: 1,
            duration: labelDuration,
            onUpdate: (opacity) => {
                label.opacity = opacity;
            },
        });
    });
}

function resetPath(line: Path, lineData: Array<LineNodeDatum>, options: ContextAnimateOptions) {
    const { path: linePath } = line;
    const { styles } = options;
    const { lineDash, lineDashOffset, stroke, strokeOpacity, strokeWidth } = styles;

    line.setProperties({
        fill: undefined,
        lineDash,
        lineDashOffset,
        lineJoin: 'round',
        pointerEvents: PointerEvents.None,
        opacity: 1,
        stroke,
        strokeOpacity,
        strokeWidth,
    });

    linePath.clear({ trackChanges: true });
    lineData.forEach((datum) => {
        extendLine(linePath, datum.point);
    });
    line.checkPathDirty();
}

function resetMarkers(markerSelection: LineMarkerSelection, markerFormatter: any) {
    markerSelection.cleanup().each((marker, datum) => {
        const format = markerFormatter?.(datum);
        const size = datum.point?.size ?? marker.size;
        marker.size = format?.size ?? size;
        marker.translationX = datum.point.x;
        marker.translationY = datum.point.y;
    });
}

function createMarkerFormatter(
    formatter: Formatter,
    getFormatterParams: (datum: LineNodeDatum) => LineFormatterParams,
    callbackCache: ModuleContext['callbackCache']
) {
    if (!formatter) return;
    return (datum: LineNodeDatum) => callbackCache.call(formatter, getFormatterParams(datum));
}

function findPointOnLine(a: { x: number; y: number }, b: { x: number; y: number }, distance: number) {
    // Find a point a distance along the line from `a` and `b`
    const x = a.x + distance * (b.x - a.x);
    const y = a.y + distance * (b.y - a.y);
    return { x, y };
}

function extendLine(linePath: Path2D, point: { x: number; y: number; moveTo: boolean }) {
    if (point.moveTo) {
        linePath.moveTo(point.x, point.y);
    } else {
        linePath.lineTo(point.x, point.y);
    }
}

interface AnimatedPoint {
    from: { x: number; y: number };
    to: { x: number; y: number };
    moveTo: boolean;
    marker: boolean;
    // status: 'removed-before' | 'removed-after' | 'removed-within' | 'added-before' | 'added-after' | 'added-within' | 'updated';
}

/*
export function createAnimatedPoints<NodeDatum>(
    nodeData: Array<NodeDatum>,
    pathPoints: Array<Point>,
    getDatumId: (datum: NodeDatum) => string
) {
    const points: Array<AnimatedPoint> = [];

    const firstPathPointIndex = existingPointsPathMap.get(0);
    const firstPathPoint = firstPathPointIndex != null ? pathPoints[firstPathPointIndex] : undefined;

    for (let index = 0; index < pathPoints.length; index++) {}

    const removedPoints = pathPoints.filter((_, i) => removedIndices[`${i}`]);
    for (let i = 0; i < removedPoints.length; i++) {
        const removed = removedPoints[i];
        if (firstPathPoint && removed.x < firstPathPoint.x) {
            // removed before
        } else if (lastPathPoint && removed.x > lastPathPoint.x) {
            // removed after
        } else {
            // removed between
        }
    }

    // Animate out nodes that were removed before the first node
    // const first = nodeData[0];

    // for (let i = 0; i < removedBefore.length; i++) {
    //     const removed = removedBefore[i];
    //     points.push({
    //         from: { x: removed.x, y: removed.x },
    //         to: { x: first.point.x, y: first.point.y },
    //         moveTo: false,
    //         marker: false,
    //     });
    // }

    for (let index = 0; index < nodeData.length; index++) {
        const datum = nodeData[index];
        const { point } = datum;
        const datumId = getDatumId(datum);
        const prevPoint = index > 0 ? nodeData[index - 1].point : undefined;

        const existingIndex = existingPointsPathMap.get(index);
        const prevExistingIndex = existingPointsPathMap.get(index - 1);

        const pathPoint = existingIndex != null ? pathPoints[existingIndex] : undefined;
        const prevPathPoint = prevExistingIndex != null ? pathPoints[prevExistingIndex] : undefined;

        // Find nodes that were removed between this point and the previous point
        const removedBetween = [];

        for (let i = 0; i < removedPoints.length; i++) {
            const removed = removedPoints[i];

            if (prevPathPoint && pathPoint && removed.x > prevPathPoint.x && removed.x < pathPoint.x) {
                removedBetween.push(removed);
            }
        }

        // Animate out nodes that were removed between two other nodes
        if (prevPoint) {
            for (let i = 0; i < removedBetween.length; i++) {
                const removed = removedBetween[i];

                // Flatten the line such that each 'between' point moves to an equal fraction along the
                // final straight line between the previous and next points
                const fraction = (i + 1) / (removedBetween.length + 1);

                points.push({
                    from: { x: removed.x, y: removed.y },
                    to: { ...findPointOnLine(prevPoint, point, fraction) },
                    moveTo: false,
                    marker: false,
                });
            }
        }

        if (addedIds[datumId] && index > lastExistingIndex) {
            // Animate in nodes that were added after the last existing node
            const startPoint = nodeData[lastExistingIndex].point;
            const startExistingIndex = existingPointsPathMap.get(lastExistingIndex);
            const start = startExistingIndex != null ? pathPoints[startExistingIndex] : startPoint;

            points.push({
                from: { x: start.x, y: start.y },
                to: { x: point.x, y: point.y },
                moveTo: point.moveTo,
                marker: true,
            });
        } else if (addedIds[datumId] && index < firstExistingIndex) {
            // Animate in nodes that were added before the first existing node
            const startPoint = nodeData[firstExistingIndex].point;
            const startExistingIndex = existingPointsPathMap.get(firstExistingIndex);
            const start = startExistingIndex != null ? pathPoints[startExistingIndex] : startPoint;

            points.push({
                from: { x: start.x, y: start.y },
                to: { x: point.x, y: point.y },
                moveTo: point.moveTo,
                marker: true,
            });
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

            points.push({
                from: {
                    x: findPointOnLine(start, end, fraction).x,
                    y: findPointOnLine(start, end, fraction).y,
                },
                to: { x: point.x, y: point.y },
                moveTo: false,
                marker: true,
            });
        } else if (pathPoint) {
            // Translate nodes that existed at other coordinates

            // const x = (markerX = (1 - ratio) * pathPoint.x + ratio * point.x);
            // const y = (markerY = (1 - ratio) * pathPoint.y + ratio * point.y);

            const hasRemovedAllPointsBefore = index === 0 && removedBefore.length > 0;

            points.push({
                from: { x: pathPoint.x, y: pathPoint.y },
                to: { x: point.x, y: point.y },
                moveTo: point.moveTo && !hasRemovedAllPointsBefore,
                marker: true,
            });
        } else {
            // Catch any other nodes and immediately place them at their final position
            points.push({
                from: { x: point.x, y: point.y },
                to: { x: point.x, y: point.y },
                moveTo: point.moveTo,
                marker: true,
            });
        }
    }

    // Animate out nodes that were removed after the last node
    const last = nodeData[nodeData.length - 1];
    for (let i = 0; i < removedAfter.length; i++) {
        const removed = removedAfter[i];

        points.push({
            from: { x: removed.x, y: removed.y },
            to: { x: last.point.x, y: last.point.y },
            moveTo: false,
            marker: false,
        });
    }

    return points;
}
*/

function getPointsAtRatio(points: Array<AnimatedPoint>, ratio: number) {
    return points.map(({ from, to, moveTo }) => ({
        x: to.x - from.x * ratio,
        y: to.y - from.y * ratio,
        moveTo,
    }));
}

// createPointsContainer([{ x: 0, y: 0 }], [{ x: 0, y: 2 }]).getPointsAtRatio(0.5);

function createLineUpdateFn<NodeDatum extends LineNodeDatum>(
    paths: Array<Array<Path>>,
    contextDataIndex: number,
    nodeData: Array<NodeDatum>,
    markerFormatter: ((datum: NodeDatum) => AgCartesianSeriesMarkerFormat | undefined) | undefined,
    options: AnimateLineUpdatesOptions<NodeDatum>
) {
    const { getDatumId, markerSelections, labelSelections, diff } = options;

    if (!diff) return;

    const [lineNode] = paths[contextDataIndex];
    const { path: linePath } = lineNode;

    const markerNodes: { [keyof: string]: Marker } = {};
    markerSelections[contextDataIndex].each((marker, datum) => {
        markerNodes[getDatumId(datum as any)] = marker;
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
            const { point } = datum;
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

                for (let i = 0; i < removedBetweenMarkers.length; i++) {
                    const removed = removedBetweenMarkers[i];

                    const fraction = (i + 1) / (removedBetweenMarkers.length + 1);

                    let { x, y } = findPointOnLine(prevPoint, point, fraction);

                    x -= removed.translationX;
                    y -= removed.translationY;

                    x *= ratio;
                    y *= ratio;

                    removed.size = (1 - ratio) * markerSize;
                    removed.x = x;
                    removed.y = y;
                }
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

            marker.translationX = markerX;
            marker.translationY = markerY;
            marker.size = markerSize;
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

        for (let i = 0; i < removedAfterMarkers.length; i++) {
            const removed = removedAfterMarkers[i];

            const x = ratio * (last.point.x - removed.translationX);
            const y = ratio * (last.point.y - removed.translationY);

            removed.size = (1 - ratio) * lastMarkerSize;
            removed.x = x;
            removed.y = y;
        }

        lineNode.checkPathDirty();
    };
}

export function findEdgeNodes<NodeDatum>(
    lineData: Array<NodeDatum>,
    addedIds: { [key: string]: boolean },
    getDatumId: AnimateLineUpdatesOptions<NodeDatum>['getDatumId']
) {
    // Find the first and last nodes that already existed and were not just added, removed nodes will not
    // appear in `lineData` so do not need to be filtered out
    let firstExistingIndex = -1;
    let lastExistingIndex = Infinity;

    if (Object.keys(addedIds).length > 0) {
        for (let i = 0; i < lineData.length; i++) {
            if (!addedIds[getDatumId(lineData[i])]) {
                firstExistingIndex = i;
                break;
            }
        }

        for (let i = lineData.length - 1; i >= 0; i--) {
            if (!addedIds[getDatumId(lineData[i])]) {
                lastExistingIndex = i;
                break;
            }
        }
    }

    return { firstExistingIndex, lastExistingIndex };
}

// TODO: rename
export function createExistingPointsPathMap<NodeDatum>(
    pathPoints: Array<{ x: number; y: number; moveTo: boolean }>,
    removedIndices: { [key: string]: boolean },
    addedIndices: { [key: string]: boolean },
    lineData: Array<NodeDatum>
) {
    // Find the points on the path before the changes, which points were removed and create a map of the new to
    // old indices of points that continue to exist
    const removedPoints: Array<{ x: number; y: number }> = [];
    const existingPointsPathMap: Map<number, number> = new Map();

    let j = 0;
    for (let i = 0; i < pathPoints.length; i++) {
        const point = pathPoints[i];
        if (removedIndices[`${i}`]) {
            removedPoints.push(point);
        } else if (!addedIndices[`${j}`]) {
            existingPointsPathMap.set(j++, i);
        }
    }

    j = 0;
    for (let i = 0; i < lineData.length; i++) {
        if (!removedIndices[`${j}`] && !addedIndices[`${i}`]) {
            existingPointsPathMap.set(i, j++);
        }
    }

    return { existingPointsPathMap, removedPoints };
}

export function createNodeBuckets(
    existingPointsPathMap: Map<number, number>,
    removedPoints: Array<{ x: number; y: number }>,
    removedMarkers: Array<Marker>,
    pathPoints: Array<{ x: number; y: number; moveTo: boolean }>
) {
    // Bucket the removed nodes into before and after existing nodes
    const removedBefore: Point[] = [];
    const removedAfter: Point[] = [];
    const removedBeforeMarkers: Marker[] = [];
    const removedAfterMarkers: Marker[] = [];

    const firstPathPointIndex = existingPointsPathMap.get(0);
    const firstPathPoint = firstPathPointIndex != null ? pathPoints[firstPathPointIndex] : undefined;

    const lastPathPointIndex = existingPointsPathMap.get(existingPointsPathMap.size - 1);
    const lastPathPoint = lastPathPointIndex != null ? pathPoints[lastPathPointIndex] : undefined;

    for (let i = 0; i < removedPoints.length; i++) {
        const removed = removedPoints[i];
        const removedMarker = removedMarkers[i];

        if (firstPathPoint && removed.x < firstPathPoint.x) {
            removedBefore.push(removed);
            removedBeforeMarkers.push(removedMarker);
        }

        if (lastPathPoint && removed.x > lastPathPoint.x) {
            removedAfter.push(removed);
            removedAfterMarkers.push(removedMarker);
        }
    }

    return { removedBefore, removedAfter, removedBeforeMarkers, removedAfterMarkers };
}

export function findRemovedMarkers<NodeDatum, MarkerSelection extends Selection<Marker>>(
    markerSelection: MarkerSelection,
    removedIds: { [key: string]: boolean },
    getDatumId: AnimateLineUpdatesOptions<NodeDatum>['getDatumId']
) {
    const removedMarkers: Array<Marker> = [];
    markerSelection.each((marker) => {
        if (removedIds[getDatumId(marker.datum)]) {
            removedMarkers.push(marker);
        }
    });

    return removedMarkers;
}
