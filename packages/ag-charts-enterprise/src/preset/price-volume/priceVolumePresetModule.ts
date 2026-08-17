import { LineSeriesModule, VERSION } from 'ag-charts-community';
import {
    FONT_SIZE_RATIO,
    type OptionsDefs,
    type PresetModuleDefinition,
    SAFE_STROKE_FILL_OPERATION,
    array,
    boolean,
    defined,
    positiveNumber,
    string,
    undocumented,
    union,
} from 'ag-charts-core';
import type { AgBaseFinancialPresetOptions, AgPriceVolumePreset } from 'ag-charts-types';

import { ChartToolbarModule } from '../../features/chart-toolbar/chartToolbarModule';
import { StatusBarModule } from '../../features/status-bar/statusBarModule';
import { CandlestickSeriesModule } from '../../series/candlestick/candlestickModule';
import { RangeAreaSeriesModule } from '../../series/range-area/rangeAreaModule';
import { RangeBarSeriesModule } from '../../series/range-bar/rangeBarModule';
import { priceVolume } from './priceVolumePreset';
import { annotationsTheme } from './priceVolumePresetTheme';

const priceVolumeOptionsDef: OptionsDefs<AgPriceVolumePreset & AgBaseFinancialPresetOptions> = {
    chartType: union('candlestick', 'hollow-candlestick', 'ohlc', 'line', 'step-line', 'hlc', 'high-low'),
    dateKey: string,
    openKey: string,
    highKey: string,
    lowKey: string,
    closeKey: string,
    volumeKey: string,
    navigator: boolean,
    volume: boolean,
    rangeButtons: boolean,
    statusBar: boolean,
    toolbar: boolean,
    zoom: boolean,
    sync: boolean,
    // Valid pass-through options
    theme: defined,
    container: defined,
    width: defined,
    height: defined,
    minWidth: defined,
    minHeight: defined,
    listeners: defined,
    initialState: defined,
    title: defined,
    data: array,
    dataIdKey: string,
    dataSource: defined,
    formatter: defined,
    enableRtl: boolean,
};

// @ts-expect-error undocumented option
priceVolumeOptionsDef.overrideDevicePixelRatio = undocumented(positiveNumber);
// @ts-expect-error undocumented option
priceVolumeOptionsDef.foreground = undocumented(defined);

export const PriceVolumePresetModule: PresetModuleDefinition<AgPriceVolumePreset & AgBaseFinancialPresetOptions> = {
    type: 'preset',
    name: 'price-volume',
    enterprise: true,
    dependencies: [ChartToolbarModule, StatusBarModule],
    version: VERSION,

    options: priceVolumeOptionsDef,

    create: priceVolume,

    baseTheme: 'ag-financial',
    themeTemplate: {
        common: {
            title: { padding: 4 },
            chartToolbar: {
                enabled: { $preset: ['toolbar', true] } as any,
            },
            annotations: { ...annotationsTheme },
            ranges: {
                enableOutOfRange: true,
                position: 'bottom-left',
                fontSize: { $rem: [FONT_SIZE_RATIO.MEDIUM, 'chromeFontSize'] },
                // @ts-expect-error undocumented option
                minSize: 34,
            },
            navigator: {
                height: 40,
                minHandle: {
                    height: 46,
                },
                maxHandle: {
                    height: 46,
                },
                miniChart: {
                    series: {
                        $apply: {
                            stroke: SAFE_STROKE_FILL_OPERATION,
                            marker: { enabled: false },
                        },
                    },
                },
            },
            sync: {
                nodeInteraction: true,
                zoom: true,
            },
            zoom: {
                autoScaling: {
                    enabled: true,
                },
                onDataChange: {
                    stickToEnd: true,
                },
                // @ts-expect-error undocumented option
                enableIndependentAxes: true,
            },
            axes: {
                number: {
                    interval: { maxSpacing: 45 },
                    // AG-17247: set formatter here so it takes precedence over label.format (a global formatter
                    // would not), while still falling back to label.format when it returns undefined.
                    label: { format: '.2f', formatter: { $path: '/formatter' } },
                },
                category: {
                    gridLine: { enabled: true },
                },
                time: {
                    gridLine: { enabled: true },
                },
                'unit-time': {
                    gridLine: { enabled: true },
                },
                'ordinal-time': {
                    gridLine: { enabled: true },
                },
            },
            padding: {
                $applyPadding: {
                    top: 6,
                    right: 8,
                    bottom: 6,
                    left: 0,
                },
            },
        },
        bar: {
            series: {
                fillOpacity: 0.5,
                highlight: {
                    unhighlightedItem: { opacity: 1 },
                    unhighlightedSeries: { opacity: 1 },
                },
            },
        },
        candlestick: {
            series: {
                highlight: {
                    unhighlightedItem: { opacity: 1 },
                    unhighlightedSeries: { opacity: 1 },
                },
                item: {
                    up: {
                        fill: {
                            $switch: [
                                { $preset: 'chartType' },
                                (CandlestickSeriesModule as any).themeTemplate.series.item.up.fill,
                                ['hollow-candlestick', 'transparent'],
                            ],
                        },
                    },
                },
            },
        },
        line: {
            series: {
                marker: { enabled: false },
                highlight: {
                    unhighlightedSeries: { opacity: 1 },
                },
                stroke: {
                    $switch: [
                        { $preset: 'chartType' },
                        (LineSeriesModule as any).themeTemplate.series.stroke,
                        ['hlc', { $palette: 'altNeutral.stroke' }],
                        ['line', { $palette: 'neutral.stroke' }],
                        ['step-line', { $palette: 'neutral.stroke' }],
                    ],
                },
                strokeWidth: {
                    $switch: [
                        { $preset: 'chartType' },
                        (LineSeriesModule as any).themeTemplate.series.strokeWidth,
                        ['hlc', 2],
                    ],
                },
                interpolation: {
                    $switch: [
                        { $preset: 'chartType' },
                        (LineSeriesModule as any).themeTemplate.series.interpolation,
                        ['step-line', { type: 'step' }],
                    ],
                },
            },
        },
        ohlc: {
            series: {
                highlight: {
                    unhighlightedItem: { opacity: 1 },
                    unhighlightedSeries: { opacity: 1 },
                },
            },
        },
        'range-area': {
            series: {
                fillOpacity: 0.3,
                strokeWidth: 2,
                highlight: {
                    bringToFront: false,
                    unhighlightedItem: { opacity: 1 },
                    unhighlightedSeries: { opacity: 1 },
                },
                fill: {
                    $switch: [
                        { $preset: 'chartType' },
                        (RangeAreaSeriesModule as any).themeTemplate.series.fill,
                        [
                            'hlc',
                            {
                                $if: [
                                    { $eq: [{ $value: '$index' }, 1] },
                                    { $palette: 'up.fill' },
                                    { $palette: 'down.fill' },
                                ],
                            },
                        ],
                    ],
                },
                stroke: {
                    $switch: [
                        { $preset: 'chartType' },
                        (RangeAreaSeriesModule as any).themeTemplate.series.stroke,
                        [
                            'hlc',
                            {
                                $if: [
                                    { $eq: [{ $value: '$index' }, 1] },
                                    { $palette: 'up.stroke' },
                                    { $palette: 'down.stroke' },
                                ],
                            },
                        ],
                    ],
                },
            },
        },
        'range-bar': {
            series: {
                highlight: {
                    unhighlightedItem: { opacity: 1 },
                    unhighlightedSeries: { opacity: 1 },
                },
                fill: {
                    $switch: [
                        { $preset: 'chartType' },
                        (RangeBarSeriesModule as any).themeTemplate.series.fill,
                        ['high-low', { $palette: 'neutral.fill' }],
                    ],
                },
                stroke: {
                    $switch: [
                        { $preset: 'chartType' },
                        (RangeBarSeriesModule as any).themeTemplate.series.stroke,
                        ['high-low', { $palette: 'neutral.stroke' }],
                    ],
                },
            },
        },
    },
};
