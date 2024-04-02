import type { AgBulletSeriesOptions, AgBulletSeriesTooltipRendererParams, CssColor } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
declare const AbstractBarSeriesProperties: typeof _ModuleSupport.AbstractBarSeriesProperties, BaseProperties: typeof _ModuleSupport.BaseProperties;
declare class TargetStyle extends BaseProperties {
    fill: string;
    fillOpacity: number;
    stroke: string;
    strokeWidth: number;
    strokeOpacity: number;
    lineDash: number[];
    lineDashOffset: number;
    lengthRatio: number;
}
declare class BulletScale extends BaseProperties {
    max?: number;
}
export declare class BulletColorRange extends BaseProperties {
    color: string;
    stop?: number;
}
export declare class BulletSeriesProperties extends AbstractBarSeriesProperties<AgBulletSeriesOptions> {
    valueKey: string;
    valueName?: string;
    targetKey?: string;
    targetName?: string;
    fill: string;
    fillOpacity: number;
    stroke: string;
    strokeWidth: number;
    strokeOpacity: number;
    lineDash: number[];
    lineDashOffset: number;
    widthRatio: number;
    colorRanges: BulletColorRange[];
    readonly target: TargetStyle;
    readonly scale: BulletScale;
    readonly tooltip: _ModuleSupport.SeriesTooltip<AgBulletSeriesTooltipRendererParams<any>>;
    backgroundFill: CssColor;
}
export {};
