import { type AgCandlestickSeriesItemOptions, _ModuleSupport, _Scene } from 'ag-charts-community';
import { OhlcSeriesBase } from '../ohlc/ohlcSeriesBase';
import { CandlestickGroup } from './candlestickGroup';
import { CandlestickSeriesProperties } from './candlestickSeriesProperties';
import type { CandlestickNodeDatum } from './candlestickTypes';
export declare class CandlestickSeries extends OhlcSeriesBase<CandlestickGroup, AgCandlestickSeriesItemOptions, CandlestickSeriesProperties<any>, CandlestickNodeDatum> {
    static readonly className = "CandleStickSeries";
    static readonly type: "candlestick";
    properties: CandlestickSeriesProperties<import("ag-charts-community").AgOhlcSeriesBaseOptions>;
    constructor(moduleCtx: _ModuleSupport.ModuleContext);
    createNodeData(): Promise<{
        nodeData: {
            fill: any;
            fillOpacity: any;
            stroke: any;
            strokeWidth: any;
            strokeOpacity: any;
            lineDash: any;
            lineDashOffset: any;
            wick: any;
            cornerRadius: any;
            itemId: import("ag-charts-community").AgOhlcSeriesItemType;
            bandwidth: number;
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
            enabled?: boolean | undefined;
            series: _ModuleSupport.ISeries<any, any>;
            xKey: string;
            datum: any;
            midPoint?: Readonly<_Scene.Point> | undefined;
            point?: Readonly<_Scene.SizedPoint> | undefined;
            missing?: boolean | undefined;
            xValue?: any;
        }[];
        itemId: string;
        labelData: never[];
        scales: {
            x?: import("packages/ag-charts-community/dist/types/src/chart/series/cartesian/scaling").Scaling | undefined;
            y?: import("packages/ag-charts-community/dist/types/src/chart/series/cartesian/scaling").Scaling | undefined;
        };
        visible: boolean;
    } | undefined>;
    getFormattedStyles(nodeDatum: CandlestickNodeDatum, highlighted?: boolean): AgCandlestickSeriesItemOptions;
    protected nodeFactory(): CandlestickGroup;
    protected getSeriesStyles(nodeDatum: CandlestickNodeDatum): AgCandlestickSeriesItemOptions;
    protected getActiveStyles(nodeDatum: CandlestickNodeDatum, highlighted: boolean): AgCandlestickSeriesItemOptions;
    protected computeFocusBounds(opts: _ModuleSupport.PickFocusInputs): _Scene.BBox | undefined;
}
