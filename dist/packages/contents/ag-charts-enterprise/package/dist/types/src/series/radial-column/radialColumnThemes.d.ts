import { _Theme } from 'ag-charts-community';
export declare const RADIAL_COLUMN_SERIES_THEME: {
    series: {
        __extends__: string;
        columnWidthRatio: number;
        maxColumnWidthRatio: number;
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
            innerRadiusRatio: number;
        };
    };
};
