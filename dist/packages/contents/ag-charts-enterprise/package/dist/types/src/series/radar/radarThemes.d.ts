export declare const RADAR_LINE_SERIES_THEME: {
    series: {
        __extends__: string;
        label: {
            enabled: boolean;
            fontSize: number;
            fontFamily: string;
            color: string;
        };
        marker: {
            enabled: boolean;
            fillOpacity: number;
            shape: string;
            size: number;
            strokeOpacity: number;
            strokeWidth: number;
        };
    };
    axes: {
        "angle-category": {
            label: {
                padding: number;
            };
        };
    };
} & {
    series: {
        strokeWidth: number;
    };
};
export declare const RADAR_AREA_SERIES_THEME: {
    series: {
        __extends__: string;
        label: {
            enabled: boolean;
            fontSize: number;
            fontFamily: string;
            color: string;
        };
        marker: {
            enabled: boolean;
            fillOpacity: number;
            shape: string;
            size: number;
            strokeOpacity: number;
            strokeWidth: number;
        };
    };
    axes: {
        "angle-category": {
            label: {
                padding: number;
            };
        };
    };
} & {
    series: {
        fillOpacity: number;
        strokeWidth: number;
        marker: {
            enabled: boolean;
        };
    };
};
