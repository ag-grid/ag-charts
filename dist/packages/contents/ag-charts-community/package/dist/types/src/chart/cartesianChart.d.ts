import type { BBox } from '../scene/bbox';
import type { ChartSpecialOverrides, TransferableResources } from './chart';
import { Chart } from './chart';
type VisibilityMap = {
    crossLines: boolean;
    series: boolean;
};
export declare class CartesianChart extends Chart {
    static className: string;
    static type: string;
    /** Integrated Charts feature state - not used in Standalone Charts. */
    readonly paired: boolean;
    constructor(specialOverrides: ChartSpecialOverrides, resources?: TransferableResources);
    performLayout(): Promise<BBox>;
    private _lastCrossLineIds?;
    private _lastAxisWidths;
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
