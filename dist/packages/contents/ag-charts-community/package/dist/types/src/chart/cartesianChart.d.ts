import type { ChartOptions } from '../module/optionsModule';
import type { BBox } from '../scene/bbox';
import type { TransferableResources } from './chart';
import { Chart } from './chart';
import type { ChartAxis } from './chartAxis';
import type { Series } from './series/series';
type VisibilityMap = {
    crossLines: boolean;
    series: boolean;
};
export declare class CartesianChart extends Chart {
    static readonly className = "CartesianChart";
    static readonly type = "cartesian";
    /** Integrated Charts feature state - not used in Standalone Charts. */
    readonly paired: boolean;
    constructor(options: ChartOptions, resources?: TransferableResources);
    private firstSeriesTranslation;
    onAxisChange(newValue: ChartAxis[], oldValue?: ChartAxis[]): void;
    destroySeries(series: Series<any, any>[]): void;
    performLayout(): Promise<BBox>;
    private _lastCrossLineIds?;
    private _lastAxisWidths;
    private _lastClipSeries;
    private _lastVisibility;
    updateAxes(inputShrinkRect: BBox): {
        seriesRect: BBox;
        animationRect: BBox;
        visibility: VisibilityMap;
        clipSeries: boolean;
    };
    private updateAxesPass;
    private buildCrossLinePadding;
    private applySeriesPadding;
    private buildAxisBound;
    private buildSeriesRect;
    private clampToOutsideSeriesRect;
    private calculateAxisDimensions;
    private positionAxis;
    private shouldFlipXY;
}
export {};
