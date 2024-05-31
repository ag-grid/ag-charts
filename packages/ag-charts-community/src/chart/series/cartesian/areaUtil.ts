import type { NodeUpdateState } from '../../../motion/fromToMotion';
import type { FontStyle, FontWeight } from '../../../options/agChartOptions';
import type { Point, SizedPoint } from '../../../scene/point';
import type { Path } from '../../../scene/shape/path';
import type { ProcessedOutputDiff } from '../../data/dataModel';
import type { SeriesNodeDatum } from '../seriesTypes';
import type { CartesianSeriesNodeDataContext, CartesianSeriesNodeDatum } from './cartesianSeries';
import type { LineSeriesLine } from './lineSeriesProperties';
import {
    determinePathStatus,
    pairCategoryData,
    pairContinuousData,
    prepareLinePathPropertyAnimation,
} from './lineUtil';
import { prepareMarkerAnimation } from './markerUtil';
import { type PathPoint, type PathPointChange, plotPath, splitPairData } from './pathUtil';

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
        moveTo: boolean;
    };
    size?: number;
    xValue?: string | number;
    yValue?: number;
    itemId?: string;
}

export type AreaFillPathDatum = {
    readonly points: AreaPathPoint[];
    readonly phantomPoints: AreaPathPoint[];
    readonly itemId: string;
};

export type AreaStrokePathDatum = {
    readonly points: AreaPathPoint[];
    readonly itemId: string;
};

export interface MarkerSelectionDatum extends CartesianSeriesNodeDatum {
    readonly point: Readonly<SizedPoint>;
    readonly yKey: string;
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
        readonly fill?: string;
    };
}

export interface AreaSeriesNodeDataContext
    extends CartesianSeriesNodeDataContext<MarkerSelectionDatum, LabelSelectionDatum> {
    fillData: AreaFillPathDatum;
    strokeData: AreaStrokePathDatum;
    stackVisible: boolean;
}

function splitFillPoints(context: AreaSeriesNodeDataContext) {
    const { points, phantomPoints } = context.fillData;
    return { top: points, bottom: phantomPoints };
}

function prepPoints(key: 'top' | 'bottom', ctx: AreaSeriesNodeDataContext, points: ReturnType<typeof splitFillPoints>) {
    return {
        scales: ctx.scales,
        nodeData: points[key],
        visible: ctx.visible,
    };
}

function pairFillCategoryData(
    newData: AreaSeriesNodeDataContext,
    oldData: AreaSeriesNodeDataContext,
    diff?: ProcessedOutputDiff
) {
    const oldPoints = splitFillPoints(oldData);
    const newPoints = splitFillPoints(newData);

    const pairOpts = { multiDatum: true };

    return {
        top: pairCategoryData(
            prepPoints('top', newData, newPoints),
            prepPoints('top', oldData, oldPoints),
            diff,
            pairOpts
        ),
        bottom: pairCategoryData(
            prepPoints('bottom', newData, newPoints),
            prepPoints('bottom', oldData, oldPoints),
            diff,
            pairOpts
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

function areaPathRenderer(
    topPairData: PathPoint[],
    bottomPairData: PathPoint[],
    ratios: Partial<Record<PathPointChange, number>>,
    path: Path,
    line: LineSeriesLine | undefined
) {
    const topPaths = splitPairData(topPairData, ratios);
    const bottomPaths = splitPairData(bottomPairData, ratios);

    if (topPaths.length !== bottomPaths.length) return;

    for (let i = 0; i < topPaths.length; i += 1) {
        const topPoints = topPaths[i];
        const bottomPoints = bottomPaths[i].reverse();

        plotPath(topPoints, path, line, false);
        plotPath(bottomPoints, path, line, true);
        path.path.closePath();
    }
}

export function prepareAreaPathAnimationFns(
    newData: AreaSeriesNodeDataContext,
    oldData: AreaSeriesNodeDataContext,
    topPairData: PathPoint[],
    bottomPairData: PathPoint[],
    visibleToggleMode: 'fade' | 'none',
    line: LineSeriesLine | undefined
) {
    const status = determinePathStatus(newData, oldData, topPairData);
    const removePhaseFn = (ratio: number, path: Path) => {
        areaPathRenderer(topPairData, bottomPairData, { move: 0, out: ratio }, path, line);
    };
    const updatePhaseFn = (ratio: number, path: Path) => {
        areaPathRenderer(topPairData, bottomPairData, { move: ratio }, path, line);
    };
    const addPhaseFn = (ratio: number, path: Path) => {
        areaPathRenderer(topPairData, bottomPairData, { move: 1, in: ratio }, path, line);
    };
    const pathProperties = prepareLinePathPropertyAnimation(status, visibleToggleMode);

    return { status, path: { addPhaseFn, updatePhaseFn, removePhaseFn }, pathProperties };
}

export function prepareAreaPathAnimation(
    newData: AreaSeriesNodeDataContext,
    oldData: AreaSeriesNodeDataContext,
    diff: ProcessedOutputDiff | undefined,
    line: LineSeriesLine | undefined
) {
    const isCategoryBased = newData.scales.x?.type === 'category';
    const wasCategoryBased = oldData.scales.x?.type === 'category';
    if (isCategoryBased !== wasCategoryBased) {
        // Not comparable.
        return;
    }

    let status: NodeUpdateState = 'updated';
    if (oldData.visible && !newData.visible) {
        status = 'removed';
    } else if (!oldData.visible && newData.visible) {
        status = 'added';
    }

    const prepareMarkerPairs = () => {
        if (isCategoryBased) {
            return pairCategoryData(newData, oldData, diff, { backfillSplitMode: 'static', multiDatum: true });
        }
        return pairContinuousData(newData, oldData, { backfillSplitMode: 'static' });
    };

    const prepareFillPairs = () => {
        if (isCategoryBased) {
            return pairFillCategoryData(newData, oldData, diff);
        }
        return pairFillContinuousData(newData, oldData);
    };

    const { resultMap: markerPairMap } = prepareMarkerPairs();
    const { top, bottom } = prepareFillPairs();

    if (markerPairMap === undefined || top.result === undefined || bottom.result === undefined) {
        return;
    }

    const topData = top.result;
    const bottomData = bottom.result;
    const stackVisible = oldData.stackVisible ? newData.stackVisible : false;
    const fadeMode = stackVisible ? 'none' : 'fade';
    const fill = prepareAreaPathAnimationFns(newData, oldData, topData, bottomData, fadeMode, line);
    const marker = prepareMarkerAnimation(markerPairMap, status);
    return { status: fill.status, fill, marker };
}
