import type { AgErrorBarOptions, AgErrorBarThemeableOptions } from 'ag-charts-community';
import { _ModuleSupport, _Scene } from 'ag-charts-community';
type NearestResult<T> = _Scene.NearestResult<T>;
export type ErrorBarNodeDatum = _ModuleSupport.CartesianSeriesNodeDatum & _ModuleSupport.ErrorBoundSeriesNodeDatum;
export type ErrorBarStylingOptions = Omit<AgErrorBarThemeableOptions, 'cap'>;
export type ErrorBarFormatter = NonNullable<AgErrorBarOptions['formatter']>;
export type ErrorBarCapFormatter = NonNullable<NonNullable<AgErrorBarOptions['cap']>['formatter']>;
type ErrorBarDataOptions = Pick<AgErrorBarOptions, 'xLowerKey' | 'xLowerName' | 'xUpperKey' | 'xUpperName' | 'yLowerKey' | 'yLowerName' | 'yUpperKey' | 'yUpperName'>;
type Formatters = {
    formatter?: ErrorBarFormatter;
    cap: {
        formatter?: ErrorBarCapFormatter;
    };
} & ErrorBarDataOptions;
export declare class ErrorBarNode extends _Scene.Group {
    private whiskerPath;
    private capsPath;
    private capLength;
    private bboxes;
    protected _datum?: ErrorBarNodeDatum;
    get datum(): ErrorBarNodeDatum | undefined;
    set datum(datum: ErrorBarNodeDatum | undefined);
    constructor();
    private calculateCapLength;
    private getFormatterParams;
    private formatStyles;
    private applyStyling;
    update(style: AgErrorBarThemeableOptions, formatters: Formatters, highlighted: boolean): void;
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
