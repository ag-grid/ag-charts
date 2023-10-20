import type { FontStyle, FontWeight } from '../../../options/agChartOptions';
import type { Point } from '../../../scene/point';
import type { Path } from '../../../scene/shape/path';
import type { ProcessedOutputDiff } from '../../data/dataModel';
import type { SeriesNodeDatum } from '../seriesTypes';
import type { CartesianSeriesNodeDataContext, CartesianSeriesNodeDatum } from './cartesianSeries';
import {
    pairCategoryData,
    pairContinuousData,
    prepareLineMarkerAnimation,
    prepareLinePathAnimationFns,
} from './lineUtil';
import type { MarkerChange } from './markerUtil';
import type { PathPoint } from './pathUtil';

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

function renderPartialArea(_pairData: PathPoint[], _ratios: Partial<Record<MarkerChange, number>>, _path: Path) {
    // const { path: linePath } = path;
    // let previousTo: PathPoint['to'];
    // for (const data of pairData) {
    //     const ratio = ratios[data.marker];
    //     if (ratio == null) continue;
    //     const { from, to } = data;
    //     if (from == null || to == null) continue;
    //     const x = from.x + (to.x - from.x) * ratio;
    //     const y = from.y + (to.y - from.y) * ratio;
    //     if (data.moveTo === false) {
    //         linePath.lineTo(x, y);
    //     } else if (data.moveTo === true || !previousTo) {
    //         linePath.moveTo(x, y);
    //     } else if (previousTo) {
    //         const moveToRatio = data.moveTo === 'in' ? ratio : 1 - ratio;
    //         const midPointX = previousTo.x + (x - previousTo.x) * moveToRatio;
    //         const midPointY = previousTo.y + (y - previousTo.y) * moveToRatio;
    //         linePath.lineTo(midPointX, midPointY);
    //         linePath.moveTo(x, y);
    //     }
    //     previousTo = to;
    // }
}

export function prepareAreaPathAnimation(
    newData: AreaSeriesNodeDataContext,
    oldData: AreaSeriesNodeDataContext,
    diff?: ProcessedOutputDiff
) {
    const isCategoryBased = newData.scales.x?.type === 'category';
    const { result: pairData, resultMap: pairMap } =
        isCategoryBased && diff ? pairCategoryData(newData, oldData, diff) : pairContinuousData(newData, oldData);

    if (pairData === undefined || pairMap === undefined) {
        return;
    }

    const pathFns = prepareLinePathAnimationFns(newData, oldData, pairData, renderPartialArea);
    const marker = prepareLineMarkerAnimation(pairMap);
    return { ...pathFns, marker };
}
