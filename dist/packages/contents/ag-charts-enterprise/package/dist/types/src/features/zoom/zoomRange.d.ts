import { _ModuleSupport } from 'ag-charts-community';
export declare class ZoomRange {
    private readonly onChange;
    start?: Date | number;
    end?: Date | number;
    private domain?;
    private initialStart?;
    private initialEnd?;
    constructor(onChange: (range?: {
        min: number;
        max: number;
    }) => void);
    getRange(): {
        min: number;
        max: number;
    } | undefined;
    getInitialRange(): {
        min: number;
        max: number;
    } | undefined;
    extendToEnd(extent: number): void;
    extendWith(fn: (end: Date | number) => Date | number): void;
    updateWith(fn: (start: Date | number, end: Date | number) => [Date | number, Date | number]): void;
    extendAll(): void;
    updateAxis(axes: Array<_ModuleSupport.AxisLayout>): boolean;
    private getRangeWithValues;
}
