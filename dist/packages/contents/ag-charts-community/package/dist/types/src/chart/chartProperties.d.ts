import { Padding } from '../util/padding';
import { BaseProperties } from '../util/properties';
import { Caption } from './caption';
import { ChartOverlays } from './overlay/chartOverlays';
import { Tooltip } from './tooltip/tooltip';
declare class ChartHighlight extends BaseProperties {
    range: 'tooltip' | 'node';
}
declare class SeriesArea extends BaseProperties {
    clip: boolean;
    padding: Padding;
}
export declare class ChartProperties extends BaseProperties {
    data?: any[];
    container?: HTMLElement;
    width?: number;
    height?: number;
    minWidth?: number;
    minHeight?: number;
    readonly title: Caption;
    readonly subtitle: Caption;
    readonly footnote: Caption;
    readonly padding: Padding;
    readonly seriesArea: SeriesArea;
    readonly highlight: ChartHighlight;
    readonly overlays: ChartOverlays;
    readonly tooltip: Tooltip;
}
export {};
