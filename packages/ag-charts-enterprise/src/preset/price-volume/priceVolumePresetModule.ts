import { LineSeriesModule, VERSION } from 'ag-charts-community';
import {
    FONT_SIZE_RATIO,
    type OptionsDefs,
    type PresetModuleDefinition,
    SAFE_STROKE_FILL_OPERATION,
    array,
    boolean,
    defined,
    interpolationThemeTemplate,
    positiveNumber,
    positiveNumberNonZero,
    ratio,
    required,
    string,
    undocumentedDefs,
    union,
} from 'ag-charts-core';
import type { AgBaseFinancialPresetOptions, AgPriceVolumePreset } from 'ag-charts-types';

import { AxisInsetValueModule } from '../../features/axis-inset-value/axisInsetValueModule';
import { AxisSelectedBandModule } from '../../features/axis-selected-band/axisSelectedBandModule';
import { ChartToolbarModule } from '../../features/chart-toolbar/chartToolbarModule';
import { SelectionModule } from '../../features/data-selection/dataSelectionModule';
import { StatusBarModule } from '../../features/status-bar/statusBarModule';
import { CandlestickSeriesModule } from '../../series/candlestick/candlestickModule';
import { RangeBarSeriesModule } from '../../series/range-bar/rangeBarModule';
import { volumeProfileSelectionOptionsDef, volumeProfileTotalSegmentOptionsDef } from '../volume-profile/volumeProfile';
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
    volumeProfile: {
        enabled: boolean,
        data: required(array),
        priceKey: string,
        upKey: required(string),
        downKey: required(string),
        placement: union('left', 'right'),
        widthRatio: ratio,
        totalSegment: volumeProfileTotalSegmentOptionsDef,
        selection: volumeProfileSelectionOptionsDef,
    },
    tickSize: positiveNumberNonZero,
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
    ...undocumentedDefs({
        overrideDevicePixelRatio: positiveNumber,
        foreground: defined,
    }),
};

const NO_UNHIGHLIGHT_THEME = { unhighlightedItem: { opacity: 1 }, unhighlightedSeries: { opacity: 1 } };

export const PriceVolumePresetModule: PresetModuleDefinition<AgPriceVolumePreset & AgBaseFinancialPresetOptions> = {
    type: 'preset',
    name: 'price-volume',
    apiName: 'AgCharts.createFinancialChart',
    enterprise: true,
    dependencies: [ChartToolbarModule, StatusBarModule, AxisInsetValueModule, AxisSelectedBandModule, SelectionModule],
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
                    // Set the formatter here so it takes precedence over label.format (a global formatter
                    // would not), while still falling back to label.format when it returns undefined.
                    label: { format: '.2f', formatter: { $path: '/formatter' } },
                },
                category: {
                    gridLine: { enabled: true },
                    paddingInner: 0.3,
                    paddingOuter: 0.15,
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
                highlight: NO_UNHIGHLIGHT_THEME,
            },
        },
        candlestick: {
            series: {
                highlight: NO_UNHIGHLIGHT_THEME,
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
                        ['line', { $palette: 'neutral.stroke' }],
                        ['step-line', { $palette: 'neutral.stroke' }],
                    ],
                },
                interpolation: interpolationThemeTemplate({
                    $switch: [{ $preset: 'chartType' }, 'linear', ['step-line', 'step']],
                }),
            },
        },
        hlc: {
            series: {
                highlight: NO_UNHIGHLIGHT_THEME,
            },
        },
        ohlc: {
            series: {
                highlight: NO_UNHIGHLIGHT_THEME,
            },
        },
        'range-bar': {
            series: {
                highlight: NO_UNHIGHLIGHT_THEME,
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
