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
    AgHlcSeriesOptions,
    AgLineSeriesOptions,
    AgNavigatorOptions,
    AgNumberAxisOptions,
    AgOhlcSeriesOptions,
    AgOrdinalTimeAxisOptions,
    AgPriceVolumeChartType,
    AgPriceVolumePreset,
    AgRangeBarSeriesOptions,
    AgRangesOptions,
    AgThemeOverrides,
    AgVolumeProfileOptions,
    AgZoomOptions,
    DatumDefault,
} from 'ag-charts-types';

import {
    createVolumeProfileAxis,
    createVolumeProfileSeries,
    createVolumeProfileStatusBarOptions,
    groupVolumeProfile,
} from '../volume-profile/volumeProfile';
import type { VolumeProfileDatum } from '../volume-profile/volumeProfileUtils';

type ChartTheme = InstanceType<typeof _Theme.ChartTheme>;

const PRICE_AXIS_KEY = 'y';

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

    const profileLevels = volumeProfile && groupVolumeProfile(volumeProfile.data, volumeProfile, tickSize, logger);

    return {
        animation: { enabled: false },
        legend: { enabled: false },
        series: [
            ...createVolumeSeries(getTheme, keys, shownVolumeKey),
            ...createPriceVolumeProfileSeries(getTheme, profileLevels, volumeProfile),
            ...createPriceSeries(chartType, keys, logger),
        ],
        axes: {
            ...createPriceAxis(tickSize),
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
        ...createStatusBarOptions(statusBar, keys, shownVolumeKey, profileLevels),
        ...createSyncOptions(sync),
        ...createZoomOptions(zoom),
        ...unusedOpts,
    } satisfies AgCartesianChartOptions<DatumDefault, never>;
}

/** Fixed series ids, so callbacks have a stable `seriesId`. */
const PRICE_SERIES_ID = 'price';
const VOLUME_SERIES_ID = 'volume';

interface PriceSeriesCommon {
    id: string;
    focusIndex: number;
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
        id: PRICE_SERIES_ID,
        focusIndex: 0,
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
            return createPriceSeriesHLC(common, keys);
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
            ...common,
            ...keys,
        } satisfies AgOhlcSeriesOptions,
    ];
}

function createPriceSeriesLine(common: PriceSeriesCommon, singleKeys: PriceSeriesSingleKeys) {
    return [
        {
            type: 'line',
            ...common,
            ...singleKeys,
        } satisfies AgLineSeriesOptions,
    ];
}

function createPriceSeriesHLC(common: PriceSeriesCommon, { xKey, highKey, lowKey, closeKey }: PriceSeriesKeys) {
    return [
        {
            type: 'hlc',
            ...common,
            xKey,
            highKey,
            lowKey,
            closeKey,
        } satisfies AgHlcSeriesOptions,
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
        } satisfies AgRangeBarSeriesOptions,
    ];
}

function createPriceSeriesCandlestick(common: PriceSeriesCommon, keys: PriceSeriesKeys) {
    return [
        {
            type: 'candlestick',
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
            id: VOLUME_SERIES_ID,
            type: 'bar',
            xKey,
            yKey: volumeKey,
            yKeyAxis: 'yVolume',
            tooltip: { enabled: false },
            grouped: false,
            // @ts-expect-error undocumented option
            simpleItemStyler(datum: DatumDefault) {
                const { up, down } = getTheme().palette;
                return { fill: datum[openKey] < datum[closeKey] ? up?.fill : down?.fill };
            },
            focusIndex: 1,
            highlight: { unhighlightedSeries: { opacity: 1 } },
        } satisfies AgBarSeriesOptions,
    ];
}

function createPriceVolumeProfileSeries(
    getTheme: () => ChartTheme,
    levels: VolumeProfileDatum[] | undefined,
    volumeProfile: AgVolumeProfileOptions | undefined
) {
    if (volumeProfile == null || levels == null) return [];

    return createVolumeProfileSeries(getTheme, 'xVolumeProfilePrice', levels, undefined, false);
}

function createPriceAxis(tickSize: number | undefined) {
    // `snapInterval` is undocumented; `snap` is themed so that theme overrides can turn snapping off.
    const crosshair = { enabled: true, snapInterval: tickSize };
    return {
        [PRICE_AXIS_KEY]: {
            type: 'number',
            position: 'right',
            crosshair,
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
    volumeKey: string | undefined,
    profileLevels: VolumeProfileDatum[] | undefined
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
            volumeProfile: profileLevels && createVolumeProfileStatusBarOptions(profileLevels, PRICE_AXIS_KEY),
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
