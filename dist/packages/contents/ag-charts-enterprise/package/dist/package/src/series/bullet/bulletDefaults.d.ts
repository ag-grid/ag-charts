export declare const BULLET_DEFAULTS: {
    axes: ({
        type: "number";
        position: "left" | "top";
        nice: boolean;
        max: number | undefined;
        crosshair: {
            enabled: boolean;
        };
    } | {
        type: "category";
        position: "left" | "bottom";
        nice?: undefined;
        max?: undefined;
        crosshair?: undefined;
    })[];
};
