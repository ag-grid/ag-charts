import { _Theme } from 'ag-charts-community';
import { type Logger } from 'ag-charts-core';
import type {
    AgAnnotationsOptions,
    AgAnnotationsToolbarButton,
    AgBarSeriesOptions,
    AgBaseFinancialPresetOptions,
    AgCandlestickSeriesOptions,
    AgCartesianChartOptions,
    AgChartSyncOptions,
    AgLineSeriesOptions,
    AgNavigatorOptions,
    AgNumberAxisOptions,
    AgOhlcSeriesOptions,
    AgOrdinalTimeAxisOptions,
    AgPriceVolumeChartType,
    AgPriceVolumePreset,
    AgRangeAreaSeriesOptions,
    AgRangeBarSeriesOptions,
    AgRangesOptions,
    AgThemeOverrides,
    AgZoomOptions,
    DatumDefault,
} from 'ag-charts-types';

import { createVolumeProfileAxis, createVolumeProfileSeries } from '../volume-profile/volumeProfile';

type ChartTheme = _Theme.ChartTheme;

const chartTypes = ['ohlc', 'line', 'step-line', 'hlc', 'high-low', 'candlestick', 'hollow-candlestick'];

const toolbarButtons: AgAnnotationsToolbarButton[] = [
    {
        icon: 'trend-line-drawing',
        tooltip: 'toolbarAnnotationsLineAnnotations',
        value: 'line-menu',
    },
    {
        icon: 'fibonacci-retracement-drawing',
        tooltip: 'toolbarAnnotationsFibonacciAnnotations',
        value: 'fibonacci-menu',
    },
    {
        icon: 'text-annotation',
        tooltip: 'toolbarAnnotationsTextAnnotations',
        value: 'text-menu',
    },
    {
        icon: 'arrow-drawing',
        tooltip: 'toolbarAnnotationsShapeAnnotations',
        value: 'shape-menu',
    },
    {
        icon: 'measurer-drawing',
        tooltip: 'toolbarAnnotationsMeasurerAnnotations',
        value: 'measurer-menu',
    },
    {
        icon: 'delete',
        tooltip: 'toolbarAnnotationsClearAll',
        value: 'clear',
    },
];

export function priceVolume(
    opts: AgPriceVolumePreset & AgBaseFinancialPresetOptions,
    _presetTheme: unknown,
    getTheme: () => ChartTheme,
    themeOverrides: AgThemeOverrides | undefined,
    logger: Logger
): AgCartesianChartOptions<DatumDefault, never> {
    const {
        dateKey = 'date',
        highKey = 'high',
        openKey = 'open',
        lowKey = 'low',
        closeKey = 'close',
        volumeKey = 'volume',
        chartType = 'candlestick',
        navigator = false,
        volume = true,
        volumeProfile: volumeProfileOptions,
        tickSize,
        rangeButtons = true,
        statusBar = true,
        toolbar = true,
        zoom = true,
        sync = false,
        // Resolved from the chart's own options against the preset's `themeTemplate`; pulled out
        // here only to keep it out of `unusedOpts`.
        theme: _theme,
        data,
        formatter,
        ...unusedOpts
    } = opts;

    const keys: PriceSeriesKeys = { xKey: dateKey, openKey, closeKey, highKey, lowKey };
    const shownVolumeKey = volume ? volumeKey : undefined;
    const volumeProfile = volumeProfileOptions?.enabled === false ? undefined : volumeProfileOptions;

    return {
        animation: { enabled: false },
        legend: { enabled: false },
        series: [
            ...createVolumeSeries(getTheme, keys, shownVolumeKey),
            ...createVolumeProfileSeries(getTheme, volumeProfile, tickSize),
            ...createPriceSeries(chartType, keys, logger),
        ],
        axes: {
            ...createPriceAxis(),
            ...createDateAxis(),
            ...createVolumeAxis(volume),
            ...createVolumeProfileAxis(volumeProfile),
        },
        tooltip: { enabled: true, mode: 'shared' },
        data,
        formatter,
        ...createAnnotationsOptions(toolbar, themeOverrides, data, dateKey, shownVolumeKey),
        ...createNavigatorOptions(navigator, dateKey, shownVolumeKey),
        ...createRangesOptions(rangeButtons, zoom),
        ...createStatusBarOptions(statusBar, keys, shownVolumeKey),
        ...createSyncOptions(sync),
        ...createZoomOptions(zoom),
        ...unusedOpts,
    } satisfies AgCartesianChartOptions<DatumDefault, never>;
}

const RANGE_AREA_TYPE = 'range-area';

interface PriceSeriesCommon {
    pickOutsideVisibleMinorAxis: boolean;
    tooltip: { enabled: boolean };
}

interface PriceSeriesKeys {
    xKey: string;
    openKey: string;
    closeKey: string;
    highKey: string;
    lowKey: string;
}

interface PriceSeriesSingleKeys {
    xKey: string;
    yKey: string;
}

function createPriceSeries(chartType: AgPriceVolumeChartType, keys: PriceSeriesKeys, logger: Logger) {
    const singleKeys: PriceSeriesSingleKeys = {
        xKey: keys.xKey,
        yKey: keys.closeKey,
    };
    const common: PriceSeriesCommon = {
        tooltip: { enabled: false },
        pickOutsideVisibleMinorAxis: true,
    };

    switch (chartType) {
        case 'ohlc':
            return createPriceSeriesOHLC(common, keys);
        case 'line':
        case 'step-line':
            return createPriceSeriesLine(common, singleKeys);
        case 'hlc':
            return createPriceSeriesHLC(common, singleKeys, keys);
        case 'high-low':
            return createPriceSeriesHighLow(common, keys);
        case 'candlestick':
        case 'hollow-candlestick':
            return createPriceSeriesCandlestick(common, keys);
        default:
            logger.warnOnce(`unknown chart type: ${String(chartType)}; expected one of: ${chartTypes.join(', ')}`);
            return createPriceSeriesCandlestick(common, keys);
    }
}

function createPriceSeriesOHLC(common: PriceSeriesCommon, keys: PriceSeriesKeys) {
    return [
        {
            type: 'ohlc',
            // @ts-expect-error undocumented option
            focusPriority: 0,
            ...common,
            ...keys,
        } satisfies AgOhlcSeriesOptions,
    ];
}

function createPriceSeriesLine(common: PriceSeriesCommon, singleKeys: PriceSeriesSingleKeys) {
    return [
        {
            type: 'line',
            // @ts-expect-error undocumented option
            focusPriority: 0,
            ...common,
            ...singleKeys,
        } satisfies AgLineSeriesOptions,
    ];
}

function createPriceSeriesHLC(
    common: PriceSeriesCommon,
    singleKeys: PriceSeriesSingleKeys,
    { xKey, highKey, closeKey, lowKey }: PriceSeriesKeys
) {
    return [
        {
            type: RANGE_AREA_TYPE,
            // @ts-expect-error undocumented option
            focusPriority: 0,
            ...common,
            xKey,
            yHighKey: highKey,
            yLowKey: closeKey,
        } satisfies AgRangeAreaSeriesOptions,
        {
            type: RANGE_AREA_TYPE,
            // @ts-expect-error undocumented option
            focusPriority: 0,
            ...common,
            xKey,
            yHighKey: closeKey,
            yLowKey: lowKey,
        } satisfies AgRangeAreaSeriesOptions,
        {
            type: 'line',
            ...common,
            ...singleKeys,
        } satisfies AgLineSeriesOptions,
    ];
}

function createPriceSeriesHighLow(common: PriceSeriesCommon, { xKey, highKey, lowKey }: PriceSeriesKeys) {
    return [
        {
            type: 'range-bar',
            ...common,
            xKey,
            yHighKey: highKey,
            yLowKey: lowKey,
            tooltip: { range: 'nearest' },
            // @ts-expect-error undocumented option
            focusPriority: 0,
        } satisfies AgRangeBarSeriesOptions,
    ];
}

function createPriceSeriesCandlestick(common: PriceSeriesCommon, keys: PriceSeriesKeys) {
    return [
        {
            type: 'candlestick',
            // @ts-expect-error undocumented option
            focusPriority: 0,
            ...common,
            ...keys,
        } satisfies AgCandlestickSeriesOptions,
    ];
}

function createVolumeSeries(
    getTheme: () => ChartTheme,
    { xKey, openKey, closeKey }: PriceSeriesKeys,
    volumeKey: string | undefined
) {
    if (volumeKey == null) return [];

    return [
        {
            type: 'bar',
            xKey,
            yKey: volumeKey,
            yKeyAxis: 'yVolume',
            tooltip: { enabled: false },
            grouped: false,
            // @ts-expect-error undocumented options: simpleItemStyler, focusPriority
            simpleItemStyler(datum: DatumDefault) {
                const { up, down } = getTheme().palette;
                return { fill: datum[openKey] < datum[closeKey] ? up?.fill : down?.fill };
            },
            focusPriority: 1,
            highlight: { unhighlightedSeries: { opacity: 1 } },
        } satisfies AgBarSeriesOptions,
    ];
}

function createPriceAxis() {
    return {
        y: {
            type: 'number',
            position: 'right',
            crosshair: {
                enabled: true,
                snap: false,
            },
            // @ts-expect-error undocumented option
            layoutConstraints: {
                stacked: false,
                width: 100,
                unit: 'percent',
                align: 'start',
            },
        } satisfies AgNumberAxisOptions,
    };
}

function createDateAxis() {
    return {
        x: {
            type: 'ordinal-time',
            position: 'bottom',
            line: {
                enabled: false,
            },
            label: {
                enabled: true,
            },
            crosshair: {
                enabled: true,
            },
        } satisfies AgOrdinalTimeAxisOptions,
    };
}

function createVolumeAxis(volume: boolean): Record<string, AgNumberAxisOptions> {
    if (!volume) return {};

    return {
        yVolume: {
            type: 'number',
            position: 'left',
            label: { enabled: false },
            crosshair: { enabled: false },
            gridLine: { enabled: false },
            nice: false,
            // @ts-expect-error undocumented option
            layoutConstraints: {
                stacked: false,
                width: 20,
                unit: 'percent',
                align: 'end',
            },
        } satisfies AgNumberAxisOptions,
    };
}

function createAnnotationsOptions(
    toolbar: boolean,
    themeOverrides: AgThemeOverrides | undefined,
    data: DatumDefault[] | undefined,
    xKey: string,
    volumeKey: string | undefined
) {
    const buttons = themeOverrides?.common?.annotations?.toolbar?.buttons ?? toolbarButtons;

    return {
        annotations: {
            enabled: toolbar,
            optionsToolbar: {
                enabled: toolbar,
            },
            // @ts-expect-error undocumented option
            snap: true,
            toolbar: {
                enabled: toolbar,
                buttons,
                padding: 0,
            },
            data,
            xKey,
            volumeKey,
        } satisfies AgAnnotationsOptions,
    };
}

function createNavigatorOptions(navigator: boolean, xKey: string, volumeKey: string | undefined) {
    const miniChart =
        volumeKey == null
            ? {}
            : {
                  miniChart: {
                      enabled: navigator,
                      series: [{ type: 'line' as const, xKey, yKey: volumeKey }],
                  },
              };

    return {
        navigator: {
            enabled: navigator,
            ...miniChart,
        } satisfies AgNavigatorOptions,
    };
}

function createRangesOptions(rangeButtons: boolean, zoom: boolean) {
    return {
        ranges: {
            enabled: rangeButtons && zoom,
        } satisfies AgRangesOptions,
    };
}

function createStatusBarOptions(
    statusBar: boolean,
    { openKey, closeKey, highKey, lowKey }: PriceSeriesKeys,
    volumeKey: string | undefined
) {
    if (!statusBar) return {};

    return {
        statusBar: {
            enabled: true,
            highKey,
            openKey,
            lowKey,
            closeKey,
            volumeKey,
        },
    };
}

function createSyncOptions(sync: boolean) {
    if (!sync) return {};

    return {
        sync: {
            enabled: true,
        } satisfies AgChartSyncOptions,
    };
}

function createZoomOptions(zoom: boolean) {
    return {
        zoom: {
            enabled: zoom,
        } satisfies AgZoomOptions,
    };
}
