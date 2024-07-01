import type { AgErrorBarOptions, AgErrorBarThemeableOptions } from 'ag-charts-community';
import { _ModuleSupport, _Scene } from 'ag-charts-community';
type NearestResult<T> = _ModuleSupport.NearestResult<T>;
export type ErrorBarNodeDatum = _ModuleSupport.CartesianSeriesNodeDatum & _ModuleSupport.ErrorBoundSeriesNodeDatum;
export type ErrorBarStylingOptions = Omit<AgErrorBarThemeableOptions, 'cap'>;
type FormatOptions = Pick<AgErrorBarOptions<any>, 'xLowerKey' | 'xUpperKey' | 'yLowerKey' | 'yUpperKey' | 'itemStyler'>;
export declare class ErrorBarNode extends _Scene.Group {
    private readonly whiskerPath;
    private readonly capsPath;
    private capLength;
    private readonly bboxes;
    protected _datum?: ErrorBarNodeDatum;
    get datum(): ErrorBarNodeDatum | undefined;
    set datum(datum: ErrorBarNodeDatum | undefined);
    constructor();
    private calculateCapLength;
    private getItemStylerParams;
    private formatStyles;
    private applyStyling;
    update(style: AgErrorBarThemeableOptions, formatters: FormatOptions, highlighted: boolean): void;
    updateBBoxes(): void;
    containsPoint(x: number, y: number): boolean;
    pickNode(x: number, y: number): _Scene.Node | undefined;
    nearestSquared(x: number, y: number, maxDistance: number): NearestResult<_Scene.Node>;
}
export declare class ErrorBarGroup extends _Scene.Group {
    get children(): ErrorBarNode[];
    nearestSquared(x: number, y: number): _ModuleSupport.PickNodeDatumResult;
}
export {};
