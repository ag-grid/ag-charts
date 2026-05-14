import type {
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
    AgTouchOptions,
} from 'ag-charts-types';

import type { HighlightNodeDatum } from '../core/eventsHub';
import type { DataSelectionState } from './data/dataSelectionState';
import type { CategoryLegendDatum } from './legend/legendDatum';

export type ResolvedBackgroundOptions = AgChartBackground & { visible: boolean; fill: string };

export type ResolvedForegroundOptions = {
    visible?: boolean;
    fill?: string;
    fillOpacity?: number;
    image?: AgChartBackground['image'];
    text?: string;
};

export type ResolvedAnimationOptions = AgAnimationOptions & { maxAnimatableItems?: number };

export type ResolvedFlashOnUpdateOptions = Required<
    Pick<AgFlashOnUpdateOptions, 'enabled' | 'item' | 'fill' | 'fillOpacity'>
> &
    Pick<AgFlashOnUpdateOptions, 'flashDuration' | 'fadeOutDuration'>;

export type ResolvedDataSourceOptions = AgDataSourceOptions & {
    enabled?: boolean;
    getData?: (params: AgDataSourceCallbackParams) => Promise<unknown[]>;
    requestThrottle?: number;
    updateThrottle?: number;
    updateDuringInteraction?: boolean;
};

export type ResolvedChartSyncOptions = AgChartSyncOptions & {
    domainMode?: 'direction' | 'position' | 'id';
};

export type NormalisedAnnotationsOptions = AgAnnotationsOptions & {
    snap?: boolean;
    data?: unknown[];
    xKey?: string;
    volumeKey?: string;
};

export type ResolvedChartOptions = Omit<
    AgChartOptions,
    | 'animation'
    | 'annotations'
    | 'background'
    | 'dataSource'
    | 'flashOnUpdate'
    | 'keyboard'
    | 'legend'
    | 'padding'
    | 'selection'
    | 'suppressFieldDotNotation'
    | 'sync'
    | 'touch'
    | 'zoom'
> & {
    animation?: ResolvedAnimationOptions;
    background: ResolvedBackgroundOptions;
    dataSource?: ResolvedDataSourceOptions;
    flashOnUpdate?: ResolvedFlashOnUpdateOptions;
    keyboard: { enabled: boolean; initialFocus: AgInitialFocus; tabIndex?: number };
    legend: NormalisedLegendOptions;
    padding: Required<AgChartPaddingOptions>;
    selection: NormalisedSelectionOptions | undefined;
    suppressFieldDotNotation: boolean;
    sync?: ResolvedChartSyncOptions;
    touch: Required<AgTouchOptions>;
    zoom: NormalisedZoomOptions;
    // Undocumented options that the chart consumes through chartState.
    mode: 'integrated' | 'standalone';
    withinStudio?: boolean;
    foreground?: ResolvedForegroundOptions;
    chartToolbar?: { enabled: boolean };
    statusBar?: ResolvedStatusBarOptions;
    annotations?: NormalisedAnnotationsOptions;
};

export type ResolvedStatusBarOptions = {
    enabled: boolean;
    openKey?: string;
    highKey?: string;
    lowKey?: string;
    closeKey?: string;
    volumeKey?: string;
    layoutStyle: 'block' | 'overlay';
    title: ResolvedStatusBarLabelOptions;
    positive: ResolvedStatusBarLabelOptions;
    negative: ResolvedStatusBarLabelOptions;
    neutral: ResolvedStatusBarLabelOptions;
    altNeutral: ResolvedStatusBarLabelOptions;
    background: { fill: string; fillOpacity: number };
};

export type ResolvedStatusBarLabelOptions = {
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
