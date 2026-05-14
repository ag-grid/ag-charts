import type {
    NormalisedLegendOptions,
    NormalisedSelectionOptions,
    NormalisedZoomOptions,
    ZoomState,
} from 'ag-charts-core';
import type {
    AgActiveItemState,
    AgChartBackground,
    AgChartOptions,
    AgChartPaddingOptions,
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

export type ResolvedChartOptions = Omit<
    AgChartOptions,
    'background' | 'keyboard' | 'legend' | 'padding' | 'selection' | 'suppressFieldDotNotation' | 'touch' | 'zoom'
> & {
    background: ResolvedBackgroundOptions;
    keyboard: { enabled: boolean; initialFocus: AgInitialFocus; tabIndex?: number };
    legend: NormalisedLegendOptions;
    padding: Required<AgChartPaddingOptions>;
    selection: NormalisedSelectionOptions | undefined;
    suppressFieldDotNotation: boolean;
    touch: Required<AgTouchOptions>;
    zoom: NormalisedZoomOptions;
    // Undocumented options that the chart consumes through chartState.
    mode: 'integrated' | 'standalone';
    withinStudio?: boolean;
    foreground?: ResolvedForegroundOptions;
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
