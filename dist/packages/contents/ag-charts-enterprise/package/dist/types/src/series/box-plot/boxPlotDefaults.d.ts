export declare const BOX_PLOT_SERIES_DEFAULTS: {
    axes: ({
        type: "number";
        position: "left";
        crosshair: {
            snap: boolean;
            enabled?: undefined;
        };
        groupPaddingInner?: undefined;
    } | {
        type: "category";
        position: "bottom";
        groupPaddingInner: number;
        crosshair: {
            enabled: boolean;
            snap: boolean;
        };
    })[];
};
