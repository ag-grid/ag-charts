import { AgCandlestickSeriesBaseFormatterParams, AgOhlcSeriesFormatterParams, AgOhlcSeriesItemOptions, _ModuleSupport, _Scene } from 'ag-charts-community';
import { CandlestickSeriesBase } from '../candlestick/candlestickSeriesBase';
import { OhlcGroup } from './ohlcGroup';
import { OhlcSeriesProperties } from './ohlcSeriesProperties';
import type { OhlcNodeDatum } from './ohlcTypes';
export declare class OhlcSeries extends CandlestickSeriesBase<OhlcGroup, AgOhlcSeriesItemOptions, OhlcSeriesProperties, OhlcNodeDatum, AgOhlcSeriesFormatterParams<OhlcNodeDatum>> {
    static readonly className = "ohlc";
    static readonly type: "ohlc";
    properties: OhlcSeriesProperties;
    constructor(moduleCtx: _ModuleSupport.ModuleContext);
    createNodeData(): Promise<{
        nodeData: {
            stroke: string | undefined;
            strokeWidth: number | undefined;
            strokeOpacity: number | undefined;
            lineDash: number[] | undefined;
            lineDashOffset: number | undefined;
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
    protected nodeFactory(): OhlcGroup;
    protected getFormatterParams(params: AgCandlestickSeriesBaseFormatterParams<OhlcNodeDatum>): AgOhlcSeriesFormatterParams<OhlcNodeDatum>;
    protected getSeriesStyles(nodeDatum: OhlcNodeDatum): AgOhlcSeriesItemOptions;
    protected getActiveStyles(nodeDatum: OhlcNodeDatum, highlighted: boolean): AgOhlcSeriesItemOptions;
    protected computeFocusBounds(opts: _ModuleSupport.PickFocusInputs): _Scene.BBox | undefined;
}
