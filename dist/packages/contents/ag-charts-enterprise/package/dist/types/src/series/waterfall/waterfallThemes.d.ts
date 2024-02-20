export declare const WATERFALL_SERIES_THEME: {
    series: {
        __extends__: string;
        item: {
            positive: {
                strokeWidth: number;
                label: {
                    enabled: boolean;
                };
            };
            negative: {
                strokeWidth: number;
                label: {
                    enabled: boolean;
                };
            };
            total: {
                strokeWidth: number;
                label: {
                    enabled: boolean;
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
