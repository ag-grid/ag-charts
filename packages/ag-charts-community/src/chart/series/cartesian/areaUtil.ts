import type { NodeUpdateState } from '../../../motion/fromToMotion';
import type { FontStyle, FontWeight } from '../../../options/agChartOptions';
import type { Point } from '../../../scene/point';
import type { ProcessedOutputDiff } from '../../data/dataModel';
import type { SeriesNodeDatum } from '../seriesTypes';
import type { CartesianSeriesNodeDataContext, CartesianSeriesNodeDatum } from './cartesianSeries';
import { pairCategoryData, pairContinuousData, prepareLinePathAnimationFns } from './lineUtil';
import { prepareMarkerAnimation } from './markerUtil';
import { renderPartialPath } from './pathUtil';

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
        readonly fill?: string;
    };
}

export interface AreaSeriesNodeDataContext
    extends CartesianSeriesNodeDataContext<MarkerSelectionDatum, LabelSelectionDatum> {
    fillData: AreaPathDatum;
    strokeData: AreaPathDatum;
    stackVisible: boolean;
}

function splitFillPoints(context: AreaSeriesNodeDataContext) {
    const { points } = context.fillData;
    return { top: points.slice(0, points.length / 2), bottom: points.slice(points.length / 2).reverse() };
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

export function prepareAreaPathAnimation(
    newData: AreaSeriesNodeDataContext,
    oldData: AreaSeriesNodeDataContext,
    diff?: ProcessedOutputDiff
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

    const pairData = [...top.result, ...bottom.result.reverse()];
    const stackVisible = oldData.stackVisible ? newData.stackVisible : false;
    const fadeMode = stackVisible ? 'none' : 'fade';
    const fill = prepareLinePathAnimationFns(newData, oldData, pairData, fadeMode, renderPartialPath);
    const marker = prepareMarkerAnimation(markerPairMap, status);
    return { status: fill.status, fill, marker };
}
