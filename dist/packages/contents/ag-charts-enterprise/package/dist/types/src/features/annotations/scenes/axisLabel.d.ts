import { _Scene } from 'ag-charts-community';
import type { AnnotationAxisLabelProperties } from '../annotationProperties';
import type { AnnotationAxisContext } from '../annotationTypes';
type UpdateOpts = {
    x: number;
    y: number;
    value: any;
    styles: Partial<AnnotationAxisLabelProperties>;
    context: AnnotationAxisContext;
};
export declare class AxisLabel extends _Scene.Group {
    static readonly className = "AxisLabel";
    private readonly label;
    private readonly rect;
    constructor();
    update(opts: UpdateOpts): void;
    private updateLabel;
    private updateRect;
    private updatePosition;
    private getFormattedValue;
}
export {};
