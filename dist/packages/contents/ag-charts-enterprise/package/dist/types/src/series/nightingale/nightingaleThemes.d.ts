import { _Theme } from 'ag-charts-community';
export declare const NIGHTINGALE_SERIES_THEME: {
    series: {
        __extends__: string;
        strokeWidth: number;
        label: {
            enabled: boolean;
            fontSize: number;
            fontFamily: string;
            color: string;
        };
    };
    axes: {
        "angle-category": {
            shape: _Theme.POLAR_AXIS_SHAPE;
            groupPaddingInner: number;
            paddingInner: number;
            label: {
                padding: number;
            };
        };
        "radius-number": {
            shape: _Theme.POLAR_AXIS_SHAPE;
        };
    };
};
