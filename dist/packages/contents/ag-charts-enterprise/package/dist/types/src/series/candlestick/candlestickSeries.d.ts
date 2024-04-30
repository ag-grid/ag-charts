import { AgCandlestickSeriesBaseFormatterParams, AgCandlestickSeriesFormatterParams, AgCandlestickSeriesItemOptions, _ModuleSupport, _Scene } from 'ag-charts-community';
import { CandlestickGroup } from './candlestickGroup';
import { CandlestickSeriesBase } from './candlestickSeriesBase';
import { CandlestickSeriesProperties } from './candlestickSeriesProperties';
import type { CandlestickNodeDatum } from './candlestickTypes';
export declare class CandlestickSeries extends CandlestickSeriesBase<CandlestickGroup, AgCandlestickSeriesItemOptions, CandlestickSeriesProperties, CandlestickNodeDatum, AgCandlestickSeriesFormatterParams<CandlestickNodeDatum>> {
    static readonly className = "CandleStickSeries";
    static readonly type: "candlestick";
    properties: CandlestickSeriesProperties;
    constructor(moduleCtx: _ModuleSupport.ModuleContext);
    createNodeData(): Promise<{
        nodeData: {
            fill: string | undefined;
            fillOpacity: number | undefined;
            stroke: string | undefined;
            strokeWidth: number | undefined;
            strokeOpacity: number | undefined;
            lineDash: number[] | undefined;
            lineDashOffset: number | undefined;
            wick: import("ag-charts-community").AgCandlestickWickOptions | undefined;
            cornerRadius: number | undefined;
            itemId: import("ag-charts-community").AgCandlestickSeriesItemType;
            bandwidth: number;
            openKey?: string | undefined;
            closeKey?: string | undefined;
            highKey?: string | undefined;
            lowKey?: string | undefined;
            openValue: number;
            closeValue: number;
            highValue?: number | undefined;
            lowValue?: number | undefined;
            aggregatedValue: number;
            scaledValues: {
                readonly xValue: number;
                readonly openValue: number;
                readonly closeValue: number;
                readonly highValue: number;
                readonly lowValue: number;
            };
            series: _ModuleSupport.ISeries<any, any>;
            xKey: string;
            midPoint?: Readonly<_Scene.Point> | undefined;
            datum: any;
            missing?: boolean | undefined;
            xValue?: any;
            point?: Readonly<_Scene.SizedPoint> | undefined;
        }[];
        itemId: string;
        labelData: never[];
        scales: {
            x?: import("ag-charts-community/dist/types/src/chart/series/cartesian/scaling").Scaling | undefined;
            y?: import("ag-charts-community/dist/types/src/chart/series/cartesian/scaling").Scaling | undefined;
        };
        visible: boolean;
    } | undefined>;
    protected nodeFactory(): CandlestickGroup;
    protected getSeriesStyles(nodeDatum: CandlestickNodeDatum): AgCandlestickSeriesItemOptions;
    protected getActiveStyles(nodeDatum: CandlestickNodeDatum, highlighted: boolean): AgCandlestickSeriesItemOptions;
    protected getFormatterParams(params: AgCandlestickSeriesBaseFormatterParams<CandlestickNodeDatum>): AgCandlestickSeriesFormatterParams<CandlestickNodeDatum>;
    protected computeFocusBounds(opts: _ModuleSupport.PickFocusInputs): _Scene.BBox | undefined;
}
