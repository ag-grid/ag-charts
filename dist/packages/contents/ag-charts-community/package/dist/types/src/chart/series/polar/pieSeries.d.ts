import type { ModuleContext } from '../../../module/moduleContext';
import type { AgPieSeriesFormat } from '../../../options/agChartOptions';
import { BBox } from '../../../scene/bbox';
import { Group } from '../../../scene/group';
import type { Point } from '../../../scene/point';
import { Sector } from '../../../scene/shape/sector';
import { ChartAxisDirection } from '../../chartAxisDirection';
import type { DataController } from '../../data/dataController';
import type { LegendItemClickChartEvent } from '../../interaction/chartEventManager';
import type { CategoryLegendDatum, ChartLegendType } from '../../legendDatum';
import { Circle } from '../../marker/circle';
import { TooltipContent } from '../../tooltip/tooltip';
import { PickFocusInputs, SeriesNodeEventTypes, SeriesNodePickMatch } from '../series';
import { SeriesNodeEvent } from '../series';
import type { SeriesNodeDatum } from '../seriesTypes';
import { PieSeriesProperties } from './pieSeriesProperties';
import { type PolarAnimationData, PolarSeries } from './polarSeries';
declare class PieSeriesNodeEvent<TEvent extends string = SeriesNodeEventTypes> extends SeriesNodeEvent<PieNodeDatum, TEvent> {
    readonly angleKey: string;
    readonly radiusKey?: string;
    readonly calloutLabelKey?: string;
    readonly sectorLabelKey?: string;
    constructor(type: TEvent, nativeEvent: Event, datum: PieNodeDatum, series: PieSeries);
}
interface PieCalloutLabelDatum {
    readonly text: string;
    readonly textAlign: CanvasTextAlign;
    readonly textBaseline: CanvasTextBaseline;
    hidden: boolean;
    collisionTextAlign?: CanvasTextAlign;
    collisionOffsetY: number;
    box?: BBox;
}
interface PieNodeDatum extends SeriesNodeDatum {
    readonly index: number;
    readonly radius: number;
    readonly innerRadius: number;
    readonly outerRadius: number;
    readonly angleValue: number;
    readonly radiusValue?: number;
    readonly startAngle: number;
    readonly endAngle: number;
    readonly midAngle: number;
    readonly midCos: number;
    readonly midSin: number;
    readonly calloutLabel?: PieCalloutLabelDatum;
    readonly sectorLabel?: {
        readonly text: string;
    };
    readonly sectorFormat: {
        [key in keyof Required<AgPieSeriesFormat>]: AgPieSeriesFormat[key];
    };
    readonly legendItem?: {
        key: string;
        text: string;
    };
    readonly legendItemValue?: string;
}
export declare class PieSeries extends PolarSeries<PieNodeDatum, PieSeriesProperties, Sector> {
    static readonly className = "PieSeries";
    static readonly type: "pie";
    properties: PieSeriesProperties;
    private readonly previousRadiusScale;
    private readonly radiusScale;
    private readonly calloutLabelSelection;
    private readonly sectorLabelSelection;
    private readonly innerLabelsSelection;
    private readonly innerCircleSelection;
    readonly backgroundGroup: Group;
    readonly zerosumRingsGroup: Group;
    readonly zerosumOuterRing: Circle;
    readonly zerosumInnerRing: Circle;
    readonly innerCircleGroup: Group;
    private angleScale;
    seriesItemEnabled: boolean[];
    private oldTitle?;
    surroundingRadius?: number;
    constructor(moduleCtx: ModuleContext);
    addChartEventListeners(): void;
    get visible(): boolean;
    protected nodeFactory(): Sector;
    getSeriesDomain(direction: ChartAxisDirection): any[];
    processData(dataController: DataController): Promise<void>;
    maybeRefreshNodeData(): Promise<void>;
    private getProcessedDataIndexes;
    createNodeData(): Promise<{
        itemId: string;
        nodeData: PieNodeDatum[];
        labelData: PieNodeDatum[];
    } | undefined>;
    private getLabels;
    private getTextAlignment;
    private getSectorFormat;
    getInnerRadius(): number;
    getOuterRadius(): number;
    updateRadiusScale(resize: boolean): void;
    private getTitleTranslationY;
    update({ seriesRect }: {
        seriesRect: BBox;
    }): Promise<void>;
    private updateTitleNodes;
    private updateNodeMidPoint;
    private updateSelections;
    private updateGroupSelection;
    private updateInnerCircleSelection;
    private updateNodes;
    updateCalloutLineNodes(): void;
    private getLabelOverflow;
    private bboxIntersectsSurroundingSeries;
    private computeCalloutLabelCollisionOffsets;
    private updateCalloutLabelNodes;
    computeLabelsBBox(options: {
        hideWhenNecessary: boolean;
    }, seriesRect: BBox): Promise<BBox | null>;
    private updateSectorLabelNodes;
    private updateInnerLabelNodes;
    private updateZerosumRings;
    protected readonly NodeEvent: typeof PieSeriesNodeEvent;
    private getDatumLegendName;
    protected pickNodeClosestDatum(point: Point): SeriesNodePickMatch | undefined;
    getTooltipHtml(nodeDatum: PieNodeDatum): TooltipContent;
    getLegendData(legendType: ChartLegendType): CategoryLegendDatum[];
    onLegendItemClick(event: LegendItemClickChartEvent): void;
    protected toggleSeriesItem(itemId: number, enabled: boolean): void;
    toggleOtherSeriesItems(legendItemName: string, enabled: boolean): void;
    animateEmptyUpdateReady(_data?: PolarAnimationData): void;
    animateWaitingUpdateReady(): void;
    animateClearingUpdateEmpty(): void;
    getDatumIdFromData(datum: any): any;
    getDatumId(datum: PieNodeDatum): string;
    protected onDataChange(): void;
    protected computeFocusBounds(opts: PickFocusInputs): BBox | undefined;
}
export {};
