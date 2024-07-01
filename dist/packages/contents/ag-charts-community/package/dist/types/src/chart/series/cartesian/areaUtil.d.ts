import type { FontStyle, FontWeight } from 'ag-charts-types';
import type { Point, SizedPoint } from '../../../scene/point';
import type { Path } from '../../../scene/shape/path';
import type { ProcessedOutputDiff } from '../../data/dataModel';
import type { SeriesNodeDatum } from '../seriesTypes';
import type { CartesianSeriesNodeDataContext, CartesianSeriesNodeDatum } from './cartesianSeries';
import type { InterpolationProperties } from './interpolationProperties';
import { type PathPoint } from './pathUtil';
export declare enum AreaSeriesTag {
    Fill = 0,
    Stroke = 1,
    Marker = 2,
    Label = 3
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
export interface AreaSeriesNodeDataContext extends CartesianSeriesNodeDataContext<MarkerSelectionDatum, LabelSelectionDatum> {
    fillData: AreaFillPathDatum;
    strokeData: AreaStrokePathDatum;
    stackVisible: boolean;
}
export declare function prepareAreaPathAnimationFns(newData: AreaSeriesNodeDataContext, oldData: AreaSeriesNodeDataContext, topPairData: PathPoint[], bottomPairData: PathPoint[], visibleToggleMode: 'fade' | 'none', interpolation: InterpolationProperties | undefined): {
    status: string;
    path: {
        addPhaseFn: (ratio: number, path: Path) => void;
        updatePhaseFn: (ratio: number, path: Path) => void;
        removePhaseFn: (ratio: number, path: Path) => void;
    };
    pathProperties: {
        fromFn: (_path: Path) => {
            finish: {
                visible: boolean;
            };
            phase: "none" | "trailing" | "initial" | "remove" | "update" | "add" | "end";
        } | {
            start: {
                visible: boolean;
            };
            phase: "none" | "trailing" | "initial" | "remove" | "update" | "add" | "end";
        } | {
            phase: "none" | "trailing" | "initial" | "remove" | "update" | "add" | "end";
        };
        toFn: (_path: Path) => {
            phase: "none" | "trailing" | "initial" | "remove" | "update" | "add" | "end";
        };
    };
};
export declare function prepareAreaPathAnimation(newData: AreaSeriesNodeDataContext, oldData: AreaSeriesNodeDataContext, diff: ProcessedOutputDiff | undefined, interpolation: InterpolationProperties | undefined): {
    status: string;
    fill: {
        status: string;
        path: {
            addPhaseFn: (ratio: number, path: Path) => void;
            updatePhaseFn: (ratio: number, path: Path) => void;
            removePhaseFn: (ratio: number, path: Path) => void;
        };
        pathProperties: {
            fromFn: (_path: Path) => {
                finish: {
                    visible: boolean;
                };
                phase: "none" | "trailing" | "initial" | "remove" | "update" | "add" | "end";
            } | {
                start: {
                    visible: boolean;
                };
                phase: "none" | "trailing" | "initial" | "remove" | "update" | "add" | "end";
            } | {
                phase: "none" | "trailing" | "initial" | "remove" | "update" | "add" | "end";
            };
            toFn: (_path: Path) => {
                phase: "none" | "trailing" | "initial" | "remove" | "update" | "add" | "end";
            };
        };
    };
    marker: {
        fromFn: (marker: import("../../marker/marker").Marker, datum: import("./pathUtil").PathNodeDatumLike) => {
            opacity: number;
        } | {
            opacity: number;
            translationX: number | undefined;
            translationY: number | undefined;
            phase: "none" | "trailing" | "initial" | "remove" | "update" | "add" | "end";
        };
        toFn: (_marker: import("../../marker/marker").Marker, datum: import("./pathUtil").PathNodeDatumLike) => {
            opacity: number;
        } | {
            translationX: number | undefined;
            translationY: number | undefined;
            opacity: number;
            phase: "none" | "trailing" | "initial" | "remove" | "update" | "add" | "end";
        };
    };
} | undefined;
