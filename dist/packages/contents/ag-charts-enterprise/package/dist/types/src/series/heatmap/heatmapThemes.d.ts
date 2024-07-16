import { _Theme } from 'ag-charts-community';
export declare const HEATMAP_SERIES_THEME: {
    series: {
        __extends__: string;
        label: {
            enabled: boolean;
            color: string;
            fontSize: _Theme.FONT_SIZE;
            fontFamily: string;
            wrapping: "on-space";
            overflowStrategy: "ellipsis";
        };
        itemPadding: number;
    };
    gradientLegend: {
        enabled: boolean;
    };
};
