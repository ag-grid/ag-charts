export declare class ZoomRatio {
    private readonly onChange;
    start?: number;
    end?: number;
    private initialStart?;
    private initialEnd?;
    constructor(onChange: (ratio?: {
        min: number;
        max: number;
    }) => void);
    getRatio(): {
        min: number;
        max: number;
    } | undefined;
    getInitialRatio(): {
        min: number;
        max: number;
    } | undefined;
    private getRatioWithValues;
}
