import type { AgChartLegendLabelFormatterParams, AgChartLegendPosition, FontStyle, FontWeight } from 'ag-charts-community';
import { _ModuleSupport, _Scene } from 'ag-charts-community';
declare class GradientLegendLabel {
    maxLength?: number;
    color: string;
    fontStyle?: FontStyle;
    fontWeight?: FontWeight;
    fontSize: number;
    fontFamily: string;
    formatter?: (params: AgChartLegendLabelFormatterParams) => string;
}
declare class GradientLegendStop {
    readonly label: GradientLegendLabel;
    padding: number;
}
export declare class GradientLegend {
    private readonly ctx;
    static className: string;
    readonly id: string;
    private readonly group;
    private readonly gradientRect;
    private readonly gradientFill;
    private readonly textSelection;
    private readonly arrow;
    enabled: boolean;
    position: AgChartLegendPosition;
    reverseOrder?: boolean;
    pagination?: any;
    private getOrientation;
    /**
     * Spacing between the legend and the edge of the chart's element.
     */
    spacing: number;
    private gradient;
    readonly stop: GradientLegendStop;
    data: _ModuleSupport.GradientLegendDatum[];
    listeners: any;
    private destroyFns;
    private readonly layoutService;
    private readonly highlightManager;
    constructor(ctx: _ModuleSupport.ModuleContext);
    destroy(): void;
    attachLegend(node: _Scene.Node): void;
    detachLegend(): void;
    private latestGradientBox;
    private latestColorDomain;
    private update;
    private normalizeColorArrays;
    private getMeasurements;
    private updateGradientRect;
    private updateText;
    private updateArrow;
    private getLabelFormatter;
    private measureMaxText;
    computeBBox(): _Scene.BBox;
    private onChartHoverChange;
}
export {};
