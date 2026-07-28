import type {
    NormalisedChartCaptionOptions,
    NormalisedGradientLegendOptions,
    NormalisedLegendOptions,
    NormalisedPaddingOptions,
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
    AgChartSyncOptions,
    AgDataSourceCallbackParams,
    AgDataSourceOptions,
    AgFlashOnUpdateOptions,
    AgInitialFocus,
    AgNavigatorMiniChartOptions,
    AgNavigatorOptions,
    AgRangesButton,
    AgRangesDropdown,
    AgRangesOptions,
    AgScrollbarHorizontalOrientationOptions,
    AgScrollbarOptions,
    AgScrollbarThumbStyle,
    AgScrollbarTrackStyle,
    AgScrollbarVerticalOrientationOptions,
    AgTouchOptions,
} from 'ag-charts-types';

import type { HighlightNodeDatum } from '../core/eventsHub';
import type { CategoryLegendDatum } from './legend/legendDatum';
import type { ValidationOverlayLevel } from './validation/validationIssueCollector';

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

export type NormalisedNavigatorMiniChartOptions = Omit<AgNavigatorMiniChartOptions, 'padding'> & {
    padding: NormalisedPaddingOptions;
};

export type NormalisedNavigatorOptions = Omit<AgNavigatorOptions, 'miniChart'> & {
    enabled: boolean;
    height: number;
    spacing: number;
    cornerRadius: number;
    miniChart?: NormalisedNavigatorMiniChartOptions;
};

export type NormalisedRangesDropdown = AgRangesDropdown & { visible: 'auto' | 'always' | 'never' };

export type NormalisedRangesOptions = Omit<AgRangesOptions, 'dropdown' | 'buttons'> & {
    enabled: boolean;
    enableOutOfRange: boolean;
    position: 'top-right' | 'top-left' | 'top' | 'right' | 'bottom-right' | 'bottom-left' | 'bottom' | 'left';
    gap: number;
    spacing: number;
    buttons: AgRangesButton[];
    dropdown: NormalisedRangesDropdown;
};

export type NormalisedScrollbarTrackStyle = AgScrollbarTrackStyle & {
    cornerRadius: number;
    opacity: number;
};

export type NormalisedScrollbarThumbStyle = AgScrollbarThumbStyle & {
    cornerRadius: number;
    opacity: number;
    minSize: number;
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
    track: NormalisedScrollbarTrackStyle;
    thumb: NormalisedScrollbarThumbStyle;
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
    | 'footnote'
    | 'gradientLegend'
    | 'keyboard'
    | 'legend'
    | 'navigator'
    | 'padding'
    | 'ranges'
    | 'scrollbar'
    | 'selection'
    | 'subtitle'
    | 'suppressFieldDotNotation'
    | 'sync'
    | 'title'
    | 'touch'
    | 'zoom'
> & {
    animation?: NormalisedAnimationOptions;
    background: NormalisedBackgroundOptions;
    dataSource?: NormalisedDataSourceOptions;
    flashOnUpdate?: NormalisedFlashOnUpdateOptions;
    footnote?: NormalisedChartCaptionOptions;
    gradientLegend?: NormalisedGradientLegendOptions;
    keyboard: { enabled: boolean; initialFocus: AgInitialFocus; tabIndex?: number };
    legend: NormalisedLegendOptions;
    navigator?: NormalisedNavigatorOptions;
    padding: NormalisedPaddingOptions;
    ranges?: NormalisedRangesOptions;
    scrollbar?: NormalisedScrollbarOptions;
    selection: NormalisedSelectionOptions | undefined;
    subtitle?: NormalisedChartCaptionOptions;
    suppressFieldDotNotation: boolean;
    sync?: NormalisedChartSyncOptions;
    title?: NormalisedChartCaptionOptions;
    touch: Required<AgTouchOptions>;
    zoom: NormalisedZoomOptions;
    // Undocumented options that the chart consumes through chartState.
    mode: 'integrated' | 'standalone';
    withinStudio?: boolean;
    foreground?: NormalisedForegroundOptions;
    chartToolbar?: { enabled: boolean };
    statusBar?: NormalisedStatusBarOptions;
    annotations?: NormalisedAnnotationsOptions;
    validations?: { overlayLevel?: ValidationOverlayLevel };
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
}
