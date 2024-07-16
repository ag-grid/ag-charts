import type { Path } from '../../../scene/shape/path';
import type { ProcessedOutputDiff } from '../../data/dataModel';
import type { CartesianSeriesNodeDataContext } from './cartesianSeries';
import type { BackfillSplitMode, PathNodeDatumLike, PathPoint, PathPointChange, PathPointMap } from './pathUtil';
type LineContextLike = {
    scales: CartesianSeriesNodeDataContext['scales'];
    nodeData: PathNodeDatumLike[];
    visible: boolean;
};
export declare function pairContinuousData(newData: LineContextLike, oldData: LineContextLike, opts?: {
    backfillSplitMode?: BackfillSplitMode;
}): {
    result: PathPoint[];
    resultMap: {
        added: {
            [key: string]: PathPoint;
            [key: number]: PathPoint;
        };
        removed: {
            [key: string]: PathPoint;
            [key: number]: PathPoint;
        };
        moved: {
            [key: string]: PathPoint;
            [key: number]: PathPoint;
        };
    };
};
export declare function pairCategoryData(newData: LineContextLike, oldData: LineContextLike, diff: ProcessedOutputDiff | undefined, opts?: {
    backfillSplitMode?: BackfillSplitMode;
    multiDatum?: boolean;
}): {
    result: undefined;
    resultMap: undefined;
} | {
    result: PathPoint[];
    resultMap: PathPointMap<false> | PathPointMap<true>;
};
export declare function determinePathStatus(newData: LineContextLike, oldData: LineContextLike, pairData: PathPoint[]): "added" | "removed" | "updated" | "no-op";
export declare function prepareLinePathAnimationFns(newData: LineContextLike, oldData: LineContextLike, pairData: PathPoint[], visibleToggleMode: 'fade' | 'none', render: (pairData: PathPoint[], ratios: Partial<Record<PathPointChange, number>>, path: Path) => void): {
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
export declare function prepareLinePathAnimation(newData: LineContextLike, oldData: LineContextLike, diff?: ProcessedOutputDiff): {
    marker: {
        fromFn: (marker: import("../../marker/marker").Marker, datum: PathNodeDatumLike) => {
            opacity: number;
        } | {
            opacity: number;
            translationX: number | undefined;
            translationY: number | undefined;
            phase: "none" | "trailing" | "initial" | "remove" | "update" | "add" | "end";
        };
        toFn: (_marker: import("../../marker/marker").Marker, datum: PathNodeDatumLike) => {
            opacity: number;
        } | {
            translationX: number | undefined;
            translationY: number | undefined;
            opacity: number;
            phase: "none" | "trailing" | "initial" | "remove" | "update" | "add" | "end";
        };
    };
    hasMotion: boolean;
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
} | undefined;
export {};
