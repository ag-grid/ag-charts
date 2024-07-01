import { type AgOhlcSeriesItemOptions, _ModuleSupport, _Scene } from 'ag-charts-community';
import { OhlcGroup } from './ohlcGroup';
import { OhlcSeriesBase } from './ohlcSeriesBase';
import { OhlcSeriesProperties } from './ohlcSeriesProperties';
import type { OhlcNodeDatum } from './ohlcTypes';
export declare class OhlcSeries extends OhlcSeriesBase<OhlcGroup, AgOhlcSeriesItemOptions, OhlcSeriesProperties, OhlcNodeDatum> {
    static readonly className = "ohlc";
    static readonly type: "ohlc";
    properties: OhlcSeriesProperties;
    constructor(moduleCtx: _ModuleSupport.ModuleContext);
    createNodeData(): Promise<{
        nodeData: {
            stroke: any;
            strokeWidth: any;
            strokeOpacity: any;
            lineDash: any;
            lineDashOffset: any;
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
    getFormattedStyles(nodeDatum: OhlcNodeDatum, highlighted?: boolean): AgOhlcSeriesItemOptions;
    protected nodeFactory(): OhlcGroup;
    protected getSeriesStyles(nodeDatum: OhlcNodeDatum): AgOhlcSeriesItemOptions;
    protected getActiveStyles(nodeDatum: OhlcNodeDatum, highlighted: boolean): AgOhlcSeriesItemOptions;
    protected computeFocusBounds(opts: _ModuleSupport.PickFocusInputs): _Scene.BBox | undefined;
}
