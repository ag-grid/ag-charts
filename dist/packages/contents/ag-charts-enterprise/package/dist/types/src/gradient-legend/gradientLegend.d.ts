import { type AgChartLegendPosition, type AgGradientLegendIntervalOptions, type AgGradientLegendLabelOptions, type AgGradientLegendScaleOptions, _ModuleSupport, _Scale, _Scene } from 'ag-charts-community';
declare class GradientLegendAxisTick extends _ModuleSupport.AxisTick<_Scale.LinearScale, number> {
    enabled: boolean;
    size: number;
    minSpacing: number;
    maxSpacing: number;
}
declare class GradientLegendAxis extends _ModuleSupport.CartesianAxis<_Scale.LinearScale, number> {
    colorDomain: number[];
    constructor(ctx: _ModuleSupport.ModuleContext);
    calculateDomain(): void;
    protected createTick(): GradientLegendAxisTick;
}
declare class GradientLegendLabel implements AgGradientLegendLabelOptions {
    label: GradientLegendAxis['label'];
    constructor(label: GradientLegendAxis['label']);
    fontStyle?: GradientLegendAxis['label']['fontStyle'];
    fontWeight?: GradientLegendAxis['label']['fontWeight'];
    fontSize?: GradientLegendAxis['label']['fontSize'];
    fontFamily?: GradientLegendAxis['label']['fontFamily'];
    color?: GradientLegendAxis['label']['color'];
    format?: GradientLegendAxis['label']['format'];
    formatter?: GradientLegendAxis['label']['formatter'];
}
declare class GradientLegendInterval implements AgGradientLegendIntervalOptions {
    tick: GradientLegendAxisTick;
    constructor(tick: GradientLegendAxisTick);
    values?: GradientLegendAxisTick['values'];
    minSpacing?: GradientLegendAxisTick['minSpacing'];
    maxSpacing?: GradientLegendAxisTick['maxSpacing'];
    step?: GradientLegendAxisTick['interval'];
}
declare class GradientLegendScale implements AgGradientLegendScaleOptions {
    axis: GradientLegendAxis;
    label: GradientLegendLabel;
    interval: GradientLegendInterval;
    constructor(axis: GradientLegendAxis);
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
    private gradient;
    private destroyFns;
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
    stop: GradientLegendScale;
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
