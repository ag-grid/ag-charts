import { type InteractionRange } from 'ag-charts-community';
export declare const RANGE_AREA_SERIES_THEME: {
    series: {
        __extends__: string;
        fillOpacity: number;
        nodeClickRange: InteractionRange;
        marker: {
            __extends__: string;
            enabled: boolean;
            fillOpacity: number;
            strokeWidth: number;
            size: number;
        };
        label: {
            enabled: boolean;
            placement: string;
            padding: number;
            fontSize: number;
            fontFamily: string;
            color: string;
        };
    };
    axes: {
        number: {
            crosshair: {
                enabled: boolean;
                snap: boolean;
            };
        };
    };
};
