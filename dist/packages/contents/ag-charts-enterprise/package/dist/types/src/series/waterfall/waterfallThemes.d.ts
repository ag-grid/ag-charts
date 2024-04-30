import { _Theme } from 'ag-charts-community';
export declare const WATERFALL_SERIES_THEME: {
    series: {
        __extends__: string;
        item: {
            positive: {
                strokeWidth: number;
                label: {
                    enabled: boolean;
                    fontStyle: undefined;
                    fontWeight: _Theme.FONT_WEIGHT;
                    fontSize: number;
                    fontFamily: string;
                    color: string;
                    formatter: undefined;
                    placement: "end";
                };
            };
            negative: {
                strokeWidth: number;
                label: {
                    enabled: boolean;
                    fontStyle: undefined;
                    fontWeight: _Theme.FONT_WEIGHT;
                    fontSize: number;
                    fontFamily: string;
                    color: string;
                    formatter: undefined;
                    placement: "end";
                };
            };
            total: {
                strokeWidth: number;
                label: {
                    enabled: boolean;
                    fontStyle: undefined;
                    fontWeight: _Theme.FONT_WEIGHT;
                    fontSize: number;
                    fontFamily: string;
                    color: string;
                    formatter: undefined;
                    placement: "end";
                };
            };
        };
        line: {
            stroke: string;
            strokeOpacity: number;
            lineDash: number[];
            lineDashOffset: number;
            strokeWidth: number;
        };
    };
    legend: {
        enabled: boolean;
        item: {
            toggleSeriesVisible: boolean;
        };
    };
};
