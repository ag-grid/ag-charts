import type {
    NormalisedGradientLegendOptions,
    NormalisedLegendOptions,
    NormalisedSelectionOptions,
    NormalisedZoomOptions,
    ZoomState,
} from 'ag-charts-core';
import type {
    AgActiveItemState,
    AgAnimationOptions,
    AgAnnotationsOptions,
    AgChartBackground,
    AgChartOptions,
    AgChartPaddingOptions,
    AgChartSyncOptions,
    AgDataSourceCallbackParams,
    AgDataSourceOptions,
    AgFlashOnUpdateOptions,
    AgInitialFocus,
    AgNavigatorOptions,
    AgRangesOptions,
    AgScrollbarHorizontalOrientationOptions,
    AgScrollbarOptions,
    AgScrollbarThumbStyle,
    AgScrollbarTrackStyle,
    AgScrollbarVerticalOrientationOptions,
    AgTouchOptions,
} from 'ag-charts-types';

import type { HighlightNodeDatum } from '../core/eventsHub';
import type { DataSelectionState } from './data/dataSelectionState';
import type { CategoryLegendDatum } from './legend/legendDatum';

export type NormalisedBackgroundOptions = AgChartBackground & { visible: boolean; fill: string };

export type NormalisedForegroundOptions = {
    visible?: boolean;
    fill?: string;
    fillOpacity?: number;
    image?: AgChartBackground['image'];
    text?: string;
};

export type NormalisedAnimationOptions = AgAnimationOptions & { maxAnimatableItems?: number };

export type NormalisedFlashOnUpdateOptions = Required<
    Pick<AgFlashOnUpdateOptions, 'enabled' | 'item' | 'fill' | 'fillOpacity'>
> &
    Pick<AgFlashOnUpdateOptions, 'flashDuration' | 'fadeOutDuration'>;

export type NormalisedDataSourceOptions = AgDataSourceOptions & {
    enabled?: boolean;
    getData?: (params: AgDataSourceCallbackParams) => Promise<unknown[]>;
    requestThrottle?: number;
    updateThrottle?: number;
    updateDuringInteraction?: boolean;
};

export type NormalisedChartSyncOptions = AgChartSyncOptions & {
    enabled: boolean;
    axes: 'x' | 'y' | 'xy';
    nodeInteraction: boolean;
    zoom: boolean;
    domainMode?: 'direction' | 'position' | 'id';
};

export type NormalisedAnnotationsOptions = AgAnnotationsOptions & {
    enabled: boolean;
    snap?: boolean;
    data?: unknown[];
    xKey?: string;
    volumeKey?: string;
};

export type NormalisedNavigatorOptions = AgNavigatorOptions & {
    enabled: boolean;
    height: number;
    spacing: number;
    cornerRadius: number;
};

export type NormalisedRangesOptions = AgRangesOptions & {
    enabled: boolean;
    enableOutOfRange: boolean;
    position: 'top-right' | 'top-left' | 'top' | 'right' | 'bottom-right' | 'bottom-left' | 'bottom' | 'left';
    gap: number;
    spacing: number;
};

export type NormalisedScrollbarOrientationOptions = (
    | AgScrollbarHorizontalOrientationOptions
    | AgScrollbarVerticalOrientationOptions
) & {
    enabled: boolean;
    thickness: number;
    spacing: number;
    tickSpacing: number;
    placement: 'inner' | 'outer';
    visible: 'auto' | 'always' | 'never';
    track: AgScrollbarTrackStyle;
    thumb: AgScrollbarThumbStyle;
};

export type NormalisedScrollbarOptions = AgScrollbarOptions & {
    enabled: boolean;
    enableAxisScrolling: boolean;
    enableSeriesAreaScrolling: boolean;
    horizontal: NormalisedScrollbarOrientationOptions;
    vertical: NormalisedScrollbarOrientationOptions;
};

export type ResolvedChartOptions = Omit<
    AgChartOptions,
    | 'animation'
    | 'annotations'
    | 'background'
    | 'dataSource'
    | 'flashOnUpdate'
    | 'gradientLegend'
    | 'keyboard'
    | 'legend'
    | 'navigator'
    | 'padding'
    | 'ranges'
    | 'scrollbar'
    | 'selection'
    | 'suppressFieldDotNotation'
    | 'sync'
    | 'touch'
    | 'zoom'
> & {
    animation?: NormalisedAnimationOptions;
    background: NormalisedBackgroundOptions;
    dataSource?: NormalisedDataSourceOptions;
    flashOnUpdate?: NormalisedFlashOnUpdateOptions;
    gradientLegend?: NormalisedGradientLegendOptions;
    keyboard: { enabled: boolean; initialFocus: AgInitialFocus; tabIndex?: number };
    legend: NormalisedLegendOptions;
    navigator?: NormalisedNavigatorOptions;
    padding: Required<AgChartPaddingOptions>;
    ranges?: NormalisedRangesOptions;
    scrollbar?: NormalisedScrollbarOptions;
    selection: NormalisedSelectionOptions | undefined;
    suppressFieldDotNotation: boolean;
    sync?: NormalisedChartSyncOptions;
    touch: Required<AgTouchOptions>;
    zoom: NormalisedZoomOptions;
    // Undocumented options that the chart consumes through chartState.
    mode: 'integrated' | 'standalone';
    withinStudio?: boolean;
    foreground?: NormalisedForegroundOptions;
    chartToolbar?: { enabled: boolean };
    statusBar?: NormalisedStatusBarOptions;
    annotations?: NormalisedAnnotationsOptions;
};

export type NormalisedStatusBarOptions = {
    enabled: boolean;
    openKey?: string;
    highKey?: string;
    lowKey?: string;
    closeKey?: string;
    volumeKey?: string;
    layoutStyle: 'block' | 'overlay';
    title: NormalisedStatusBarLabelOptions;
    positive: NormalisedStatusBarLabelOptions;
    negative: NormalisedStatusBarLabelOptions;
    neutral: NormalisedStatusBarLabelOptions;
    altNeutral: NormalisedStatusBarLabelOptions;
    background: { fill: string; fillOpacity: number };
};

export type NormalisedStatusBarLabelOptions = {
    color: string;
    fontFamily: string;
    fontSize: number;
    fontWeight?: import('ag-charts-types').FontWeight;
    fontStyle?: import('ag-charts-types').FontStyle;
};

export interface ChartState {
    options: ResolvedChartOptions;
    activeItem: AgActiveItemState | undefined;
    highlight: HighlightNodeDatum | undefined;
    legendData: Record<string, CategoryLegendDatum[]>;
    legendVisible: boolean;
    zoom: ZoomState | undefined;
    initialZoom: ZoomState | undefined;
    selectionState: DataSelectionState | undefined;
}
