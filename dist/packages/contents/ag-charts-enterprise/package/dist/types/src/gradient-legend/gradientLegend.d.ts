import { type AgChartLegendPosition, type AgGradientLegendScaleOptions, _ModuleSupport, _Scale, _Scene } from 'ag-charts-community';
declare class GradientLegendAxis extends _ModuleSupport.CartesianAxis<_Scale.LinearScale, number> {
    colorDomain: number[];
    constructor(ctx: _ModuleSupport.ModuleContext);
    calculateDomain(): void;
    protected getTickSize(): number;
}
declare class GradientLegendScale implements AgGradientLegendScaleOptions {
    axis: GradientLegendAxis;
    constructor(axis: GradientLegendAxis);
    label: _ModuleSupport.AxisLabel;
    interval: _ModuleSupport.AxisInterval<number>;
    padding?: GradientLegendAxis['seriesAreaPadding'];
}
export declare class GradientLegend {
    readonly ctx: _ModuleSupport.ModuleContext;
    static readonly className = "GradientLegend";
    readonly id: string;
    private readonly axis;
    private readonly group;
    private readonly gradientRect;
    private readonly gradientFill;
    private readonly axisGridGroup;
    private readonly axisGroup;
    private readonly arrow;
    private readonly gradient;
    private readonly destroyFns;
    private readonly layoutService;
    private readonly highlightManager;
    enabled: boolean;
    position: AgChartLegendPosition;
    reverseOrder?: boolean;
    pagination?: any;
    private getOrientation;
    /**
     * Spacing between the legend and the edge of the chart's element.
     */
    spacing: number;
    scale: GradientLegendScale;
    data: _ModuleSupport.GradientLegendDatum[];
    listeners: any;
    constructor(ctx: _ModuleSupport.ModuleContext);
    destroy(): void;
    attachLegend(scene: _Scene.Scene): void;
    detachLegend(): void;
    private latestGradientBox?;
    private update;
    private normalizeColorArrays;
    private updateGradientRect;
    private updateAxis;
    private updateArrow;
    private getMeasurements;
    computeBBox(): _Scene.BBox;
    private onChartHoverChange;
}
export {};