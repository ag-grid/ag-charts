import type { FontStyle, FontWeight } from '../../../options/agChartOptions';
import type { Point } from '../../../scene/point';
import type { Path } from '../../../scene/shape/path';
import type { ProcessedOutputDiff } from '../../data/dataModel';
import type { SeriesNodeDatum } from '../seriesTypes';
import type { CartesianSeriesNodeDataContext, CartesianSeriesNodeDatum } from './cartesianSeries';
import { pairCategoryData, pairContinuousData, prepareLinePathAnimationFns, renderPartialLine } from './lineUtil';
import { prepareMarkerAnimation } from './markerUtil';
import type { PathPoint, PathPointChange } from './pathUtil';

export enum AreaSeriesTag {
    Fill,
    Stroke,
    Marker,
    Label,
}

export interface AreaPathPoint {
    point: {
        x: number;
        y: number;
        moveTo?: boolean;
    };
    size?: number;
    xValue?: string | number;
    yValue?: number;
    itemId?: string;
}

export type AreaPathDatum = {
    readonly points: AreaPathPoint[];
    readonly itemId: string;
};

export interface MarkerSelectionDatum extends Required<CartesianSeriesNodeDatum> {
    readonly index: number;
    readonly fill?: string;
    readonly stroke?: string;
    readonly strokeWidth: number;
    readonly cumulativeValue: number;
}

export interface LabelSelectionDatum extends Readonly<Point>, SeriesNodeDatum {
    readonly index: number;
    readonly itemId: any;
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

export interface AreaSeriesNodeDataContext
    extends CartesianSeriesNodeDataContext<MarkerSelectionDatum, LabelSelectionDatum> {
    fillData: AreaPathDatum;
    strokeData: AreaPathDatum;
}

function renderPartialArea(pairData: PathPoint[], ratios: Partial<Record<PathPointChange, number>>, path: Path) {
    const { path: areaPath } = path;
    let previousTo: PathPoint['to'];
    for (const data of pairData) {
        const ratio = ratios[data.change];
        if (ratio == null) continue;

        const { from, to } = data;
        if (from == null || to == null) continue;

        const x = from.x + (to.x - from.x) * ratio;
        const y = from.y + (to.y - from.y) * ratio;

        if (data.moveTo === false) {
            areaPath.lineTo(x, y);
        } else if (data.moveTo === true || !previousTo) {
            areaPath.moveTo(x, y);
        } else if (previousTo) {
            const moveToRatio = data.moveTo === 'in' ? ratio : 1 - ratio;
            const midPointX = previousTo.x + (x - previousTo.x) * moveToRatio;
            const midPointY = previousTo.y + (y - previousTo.y) * moveToRatio;
            areaPath.lineTo(midPointX, midPointY);
            areaPath.moveTo(x, y);
        }
        previousTo = to;
    }
}

function splitFillPoints(context: AreaSeriesNodeDataContext) {
    const { points } = context.fillData;
    return { top: points.slice(0, points.length / 2), bottom: points.slice(points.length / 2).reverse() };
}

function prepPoints(key: 'top' | 'bottom', ctx: AreaSeriesNodeDataContext, points: ReturnType<typeof splitFillPoints>) {
    return {
        scales: ctx.scales,
        nodeData: points[key],
    };
}

function pairFillCategoryData(
    newData: AreaSeriesNodeDataContext,
    oldData: AreaSeriesNodeDataContext,
    diff: ProcessedOutputDiff
) {
    const oldPoints = splitFillPoints(oldData);
    const newPoints = splitFillPoints(newData);

    return {
        top: pairCategoryData(prepPoints('top', newData, newPoints), prepPoints('top', oldData, oldPoints), diff),
        bottom: pairCategoryData(
            prepPoints('bottom', newData, newPoints),
            prepPoints('bottom', oldData, oldPoints),
            diff
        ),
    };
}

function pairFillContinuousData(newData: AreaSeriesNodeDataContext, oldData: AreaSeriesNodeDataContext) {
    const oldPoints = splitFillPoints(oldData);
    const newPoints = splitFillPoints(newData);

    return {
        top: pairContinuousData(prepPoints('top', newData, newPoints), prepPoints('top', oldData, oldPoints)),
        bottom: pairContinuousData(prepPoints('bottom', newData, newPoints), prepPoints('bottom', oldData, oldPoints)),
    };
}

function pairStrokeCategoryData(
    newData: AreaSeriesNodeDataContext,
    oldData: AreaSeriesNodeDataContext,
    diff: ProcessedOutputDiff
) {
    const oldPoints = { scales: oldData.scales, nodeData: oldData.strokeData.points };
    const newPoints = { scales: newData.scales, nodeData: newData.strokeData.points };

    return pairCategoryData(newPoints, oldPoints, diff);
}

function pairStrokeContinuousData(newData: AreaSeriesNodeDataContext, oldData: AreaSeriesNodeDataContext) {
    const oldPoints = { scales: oldData.scales, nodeData: oldData.strokeData.points };
    const newPoints = { scales: newData.scales, nodeData: newData.strokeData.points };

    return pairContinuousData(newPoints, oldPoints);
}

export function prepareAreaPathAnimation(
    newData: AreaSeriesNodeDataContext,
    oldData: AreaSeriesNodeDataContext,
    diff?: ProcessedOutputDiff
) {
    const isCategoryBased = newData.scales.x?.type === 'category';

    const prepareMarkerPairs = () => {
        if (isCategoryBased && diff) {
            return pairCategoryData(newData, oldData, diff);
        }
        return pairContinuousData(newData, oldData);
    };

    const prepareStrokePairs = () => {
        if (isCategoryBased && diff) {
            return pairStrokeCategoryData(newData, oldData, diff);
        }
        return pairStrokeContinuousData(newData, oldData);
    };

    const prepareFillPairs = () => {
        if (isCategoryBased && diff) {
            return pairFillCategoryData(newData, oldData, diff);
        }
        return pairFillContinuousData(newData, oldData);
    };

    const { resultMap: markerPairMap } = prepareMarkerPairs();
    const { result: strokeResult } = prepareStrokePairs();
    const { top, bottom } = prepareFillPairs();

    if (
        strokeResult === undefined ||
        markerPairMap === undefined ||
        top.result === undefined ||
        bottom.result === undefined
    ) {
        return;
    }

    const pairData = [...top.result, ...bottom.result.reverse()];
    const fill = prepareLinePathAnimationFns(newData, oldData, pairData, renderPartialArea);
    const stroke = prepareLinePathAnimationFns(newData, oldData, strokeResult, renderPartialLine);
    const marker = prepareMarkerAnimation(markerPairMap);
    return { fill, marker, stroke };
}
