import type {
    AgChartLegendItemOptions,
    AgChartLegendLabelOptions,
    AgChartLegendLineOptions,
    AgChartLegendMarkerOptions,
    AgChartLegendOptions,
    AgChartLegendPaginationOptions,
    AgChartSelectionOptions,
    AgPaginationLabelOptions,
    AgPaginationMarkerOptions,
    AgPaginationMarkerStyle,
    BorderOptions,
} from 'ag-charts-types';

import type { Normalised } from './normalise';

// --- Leaf normalised types ---

export type NormalisedBorderOptions = Normalised<BorderOptions, 'enabled' | 'stroke' | 'strokeWidth' | 'strokeOpacity'>;

export type NormalisedLegendMarkerOptions = Normalised<AgChartLegendMarkerOptions, 'size' | 'padding'>;

export type NormalisedLegendLineOptions = Normalised<AgChartLegendLineOptions, 'length'>;

export type NormalisedLegendLabelOptions = Normalised<
    AgChartLegendLabelOptions,
    'color' | 'fontWeight' | 'fontSize' | 'fontFamily',
    { fontFamily: string }
>;

export type NormalisedPaginationMarkerStyle = Normalised<
    AgPaginationMarkerStyle,
    'fill' | 'strokeWidth' | 'strokeOpacity',
    { fill: string }
>;

export type NormalisedPaginationMarkerOptions = Normalised<AgPaginationMarkerOptions, 'size' | 'shape' | 'padding'>;

export type NormalisedPaginationLabelOptions = Normalised<
    AgPaginationLabelOptions,
    'color' | 'fontSize' | 'fontFamily',
    { fontFamily: string }
>;

// --- Composed normalised types ---

export type NormalisedLegendItemOptions = Normalised<
    AgChartLegendItemOptions,
    'marker' | 'line' | 'label' | 'paddingX' | 'paddingY' | 'showSeriesStroke',
    {
        marker: NormalisedLegendMarkerOptions;
        line: NormalisedLegendLineOptions;
        label: NormalisedLegendLabelOptions;
    }
>;

export type NormalisedLegendPaginationOptions = Normalised<
    AgChartLegendPaginationOptions,
    'marker' | 'activeStyle' | 'inactiveStyle' | 'highlightStyle' | 'label',
    {
        marker: NormalisedPaginationMarkerOptions;
        activeStyle: NormalisedPaginationMarkerStyle;
        inactiveStyle: NormalisedPaginationMarkerStyle;
        highlightStyle: NormalisedPaginationMarkerStyle;
        label: NormalisedPaginationLabelOptions;
    }
>;

// --- Top-level normalised legend options ---

export type NormalisedLegendOptions = Normalised<
    AgChartLegendOptions,
    | 'enabled'
    | 'position'
    | 'orientation'
    | 'border'
    | 'cornerRadius'
    | 'padding'
    | 'spacing'
    | 'item'
    | 'reverseOrder'
    | 'listeners'
    | 'pagination'
    | 'toggleSeries'
    | 'fill'
    | 'fillOpacity',
    {
        border: NormalisedBorderOptions;
        item: NormalisedLegendItemOptions;
        pagination: NormalisedLegendPaginationOptions;
    }
>;

export type NormalisedSelectionOptions = Normalised<
    AgChartSelectionOptions,
    'enabled' | 'enableClick' | 'enableDrag' | 'clickMode'
>;
