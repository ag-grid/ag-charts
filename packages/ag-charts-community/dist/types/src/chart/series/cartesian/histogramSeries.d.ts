import type { ModuleContext } from '../../../module/moduleContext';
import type { BBox } from '../../../scene/bbox';
import type { Point } from '../../../scene/point';
import type { Selection } from '../../../scene/selection';
import { Rect } from '../../../scene/shape/rect';
import type { Text } from '../../../scene/shape/text';
import type { QuadtreeNearest } from '../../../scene/util/quadtree';
import { ChartAxisDirection } from '../../chartAxisDirection';
import type { DataController } from '../../data/dataController';
import type { CategoryLegendDatum, ChartLegendType } from '../../legendDatum';
import { TooltipContent } from '../../tooltip/tooltip';
import { PickFocusInputs, SeriesNodePickMatch } from '../series';
import { type CartesianAnimationData, CartesianSeries } from './cartesianSeries';
import { HistogramNodeDatum, HistogramSeriesProperties } from './histogramSeriesProperties';
type HistogramAnimationData = CartesianAnimationData<Rect, HistogramNodeDatum>;
export declare class HistogramSeries extends CartesianSeries<Rect, HistogramSeriesProperties, HistogramNodeDatum> {
    static readonly className = "HistogramSeries";
    static readonly type: "histogram";
    properties: HistogramSeriesProperties;
    constructor(moduleCtx: ModuleContext);
    calculatedBins: [number, number][];
    private deriveBins;
    private calculateNiceBins;
    private getBins;
    private calculatePrecision;
    private calculateNiceStart;
    processData(dataController: DataController): Promise<void>;
    getSeriesDomain(direction: ChartAxisDirection): any[];
    createNodeData(): Promise<{
        itemId: string;
        nodeData: HistogramNodeDatum[];
        labelData: HistogramNodeDatum[];
        scales: {
            x?: import("./scaling").Scaling | undefined;
            y?: import("./scaling").Scaling | undefined;
        };
        animationValid: boolean;
        visible: boolean;
    } | undefined>;
    protected nodeFactory(): Rect;
    protected updateDatumSelection(opts: {
        nodeData: HistogramNodeDatum[];
        datumSelection: Selection<Rect, HistogramNodeDatum>;
    }): Promise<Selection<Rect, HistogramNodeDatum>>;
    protected updateDatumNodes(opts: {
        datumSelection: Selection<Rect, HistogramNodeDatum>;
        isHighlight: boolean;
    }): Promise<void>;
    protected updateLabelSelection(opts: {
        labelData: HistogramNodeDatum[];
        labelSelection: Selection<Text, HistogramNodeDatum>;
    }): Promise<Selection<Text, HistogramNodeDatum>>;
    protected updateLabelNodes(opts: {
        labelSelection: Selection<Text, HistogramNodeDatum>;
    }): Promise<void>;
    protected initQuadTree(quadtree: QuadtreeNearest<HistogramNodeDatum>): void;
    protected pickNodeClosestDatum(point: Point): SeriesNodePickMatch | undefined;
    getTooltipHtml(nodeDatum: HistogramNodeDatum): TooltipContent;
    getLegendData(legendType: ChartLegendType): CategoryLegendDatum[];
    animateEmptyUpdateReady({ datumSelection, labelSelection }: HistogramAnimationData): void;
    animateWaitingUpdateReady(data: HistogramAnimationData): void;
    protected isLabelEnabled(): boolean;
    protected computeFocusBounds({ datumIndex, seriesRect }: PickFocusInputs): BBox | undefined;
}
export {};
