import type {
    AgChartLegendItemOptions,
    AgChartLegendLabelDisabledStyle,
    AgChartLegendLabelOptions,
    AgChartLegendLineDisabledStyle,
    AgChartLegendLineOptions,
    AgChartLegendMarkerDisabledStyle,
    AgChartLegendMarkerOptions,
    AgChartLegendOptions,
    AgChartLegendPaginationOptions,
    AgPaginationLabelOptions,
    AgPaginationMarkerOptions,
    AgPaginationMarkerStyle,
    CssColor,
} from 'ag-charts-types';

import type { Normalised } from './normalise';
import type { NormalisedBorderOptions, NormalisedColorType, NormalisedPaddingOptions } from './normalisedCommonOptions';

// --- Leaf normalised types ---

export type NormalisedLegendMarkerDisabledStyle = Normalised<
    AgChartLegendMarkerDisabledStyle,
    'opacity',
    { fill?: NormalisedColorType; stroke?: CssColor }
>;

export type NormalisedLegendLineDisabledStyle = Normalised<
    AgChartLegendLineDisabledStyle,
    'opacity',
    { stroke?: CssColor }
>;

export type NormalisedLegendLabelDisabledStyle = Normalised<
    AgChartLegendLabelDisabledStyle,
    'opacity',
    { color: CssColor }
>;

export type NormalisedLegendMarkerOptions = Normalised<
    AgChartLegendMarkerOptions,
    'size' | 'padding' | 'disabledStyle',
    { padding: NormalisedPaddingOptions; disabledStyle: NormalisedLegendMarkerDisabledStyle }
>;

export type NormalisedLegendLineOptions = Normalised<
    AgChartLegendLineOptions,
    'length' | 'disabledStyle',
    { disabledStyle: NormalisedLegendLineDisabledStyle }
>;

export type NormalisedLegendLabelOptions = Normalised<
    AgChartLegendLabelOptions,
    'color' | 'fontWeight' | 'fontSize' | 'fontFamily' | 'disabledStyle',
    { color: CssColor; fontFamily: string; disabledStyle: NormalisedLegendLabelDisabledStyle }
>;

export type NormalisedPaginationMarkerStyle = Normalised<
    AgPaginationMarkerStyle,
    'fill' | 'strokeWidth' | 'strokeOpacity',
    { fill: string; stroke?: CssColor }
>;

export type NormalisedPaginationMarkerOptions = Normalised<
    AgPaginationMarkerOptions,
    'size' | 'shape' | 'padding',
    { padding: NormalisedPaddingOptions }
>;

export type NormalisedPaginationLabelOptions = Normalised<
    AgPaginationLabelOptions,
    'color' | 'fontSize' | 'fontFamily',
    { color: CssColor; fontFamily: string }
>;

// --- Composed normalised types ---

export type NormalisedLegendItemOptions = Normalised<
    AgChartLegendItemOptions,
    'marker' | 'line' | 'label' | 'padding' | 'showSeriesStroke',
    {
        marker: NormalisedLegendMarkerOptions;
        line: NormalisedLegendLineOptions;
        label: NormalisedLegendLabelOptions;
        padding: NormalisedPaddingOptions;
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
        fill: NormalisedColorType;
        item: NormalisedLegendItemOptions;
        pagination: NormalisedLegendPaginationOptions;
    }
>;
