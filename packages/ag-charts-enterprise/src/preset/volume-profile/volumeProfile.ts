import { _Theme } from 'ag-charts-community';
import {
    type Logger,
    type OptionsDefs,
    arrayOf,
    boolean,
    callback,
    color,
    fillOptionsDef,
    fontOptionsDef,
    lineDashOptionsDef,
    positiveNumber,
    ratio,
    shapeSelectionOptionsDef,
    strictUnion,
    strokeOptionsDef,
} from 'ag-charts-core';
import type {
    AgBarSeriesOptions,
    AgBarSeriesStyle,
    AgCategoryAxisOptions,
    AgNumberAxisOptions,
    AgSelectionClickMode,
    AgVolumeProfileOptions,
    AgVolumeProfileSelectedBandOptions,
    AgVolumeProfileSelectionOptions,
    AgVolumeProfileTotalSegmentOptions,
    DatumDefault,
} from 'ag-charts-types';

import {
    type VolumeProfileDatum,
    inferVolumeProfileTickSize,
    lacksVolumeProfileVolumes,
    normaliseVolumeProfile,
    warnMissingVolumeProfileKeys,
} from './volumeProfileUtils';

type ChartTheme = InstanceType<typeof _Theme.ChartTheme>;

export function groupVolumeProfile(
    data: DatumDefault[],
    { priceKey = 'price', upKey, downKey }: Pick<AgVolumeProfileOptions, 'priceKey' | 'upKey' | 'downKey'>,
    tickSize: number | undefined,
    suppressFieldDotNotation: boolean,
    logger: Logger
) {
    const keys = { priceKey, upKey, downKey };
    warnMissingVolumeProfileKeys(data, keys, suppressFieldDotNotation, logger);
    if (lacksVolumeProfileVolumes(data, keys, suppressFieldDotNotation)) return [];

    const levelSize = tickSize ?? inferVolumeProfileTickSize(data, priceKey, suppressFieldDotNotation) ?? 1;
    return normaliseVolumeProfile(data, keys, levelSize, suppressFieldDotNotation);
}

/** Fixed series ids of the two profile series, in both the Volume Profile Chart and the Financial Chart. */
export const VOLUME_PROFILE_UP_SERIES_ID = 'volumeProfileUp';
export const VOLUME_PROFILE_DOWN_SERIES_ID = 'volumeProfileDown';

// Both series give the same heading, which is what groups their rows into one tooltip.
const priceRangeHeading = ({ priceLow, priceHigh }: VolumeProfileDatum) => `${priceLow}-${priceHigh}`;

const noSymbol = { marker: { enabled: false } };

const volumeRow = ({ datum, yKey, yName }: { datum: any; yKey: string; yName?: string }) => ({
    label: yName ?? yKey,
    value: formatFixedCompact({ value: datum[yKey] }),
});

type VolumeProfileBars = Pick<AgVolumeProfileOptions, 'up' | 'down'>;

const volumeProfileBarStyleOptionsDef: OptionsDefs<AgBarSeriesStyle> = {
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
    cornerRadius: positiveNumber,
};

export const volumeProfileBarsOptionsDef: OptionsDefs<VolumeProfileBars> = {
    up: volumeProfileBarStyleOptionsDef,
    down: volumeProfileBarStyleOptionsDef,
};

// A stroke without a width is 1px wide, as in candlestick's `item.up` and `item.down`, not the bar series' 2px.
function createBarStyleOptions(
    style: AgBarSeriesStyle | undefined,
    paletteKey: 'up' | 'down',
    getTheme: () => ChartTheme
) {
    const strokeWidth = style?.stroke != null && style.strokeWidth == null ? { strokeWidth: 1 } : undefined;
    const themeFill =
        style?.fill == null ? { simpleItemStyler: () => ({ fill: getTheme().palette[paletteKey]?.fill }) } : undefined;

    return { ...style, ...strokeWidth, ...themeFill };
}

// Without `levels`, the series read the chart's data, which must then hold the grouped levels.
export function createVolumeProfileSeries(
    getTheme: () => ChartTheme,
    priceAxisKey: string,
    levels?: VolumeProfileDatum[],
    selection?: AgVolumeProfileSelectionOptions,
    { up, down }: VolumeProfileBars = {},
    hoverable = true
) {
    const seriesData = levels == null ? {} : { data: levels };
    const seriesSelection = createSeriesSelectionOptions(selection);
    const seriesHover = hoverable ? undefined : { hoverable: false };

    return [
        {
            ...seriesData,
            ...seriesSelection,
            id: VOLUME_PROFILE_UP_SERIES_ID,
            ...seriesHover,
            type: 'bar',
            direction: 'horizontal',
            xKey: 'price',
            xName: 'Price',
            yKey: 'upVolume',
            yName: 'Up Volume',
            xKeyAxis: priceAxisKey,
            yKeyAxis: 'yVolumeProfile',
            stackGroup: 'volumeProfile',
            ...createBarStyleOptions(up, 'up', getTheme),
            tooltip: {
                enabled: true,
                renderer: (params) => {
                    return {
                        heading: priceRangeHeading(params.datum),
                        symbol: noSymbol,
                        data: [volumeRow(params)],
                    };
                },
            },
        } satisfies AgBarSeriesOptions,
        {
            ...seriesData,
            ...seriesSelection,
            id: VOLUME_PROFILE_DOWN_SERIES_ID,
            ...seriesHover,
            type: 'bar',
            direction: 'horizontal',
            xKey: 'price',
            xName: 'Price',
            yKey: 'downVolume',
            yName: 'Down Volume',
            xKeyAxis: priceAxisKey,
            yKeyAxis: 'yVolumeProfile',
            stackGroup: 'volumeProfile',
            ...createBarStyleOptions(down, 'down', getTheme),
            tooltip: {
                enabled: true,
                renderer: (params) => {
                    return {
                        heading: priceRangeHeading(params.datum),
                        symbol: noSymbol,
                        data: [
                            volumeRow(params),
                            { label: 'Total', value: formatFixedCompact({ value: params.datum.total }) },
                        ],
                    };
                },
            },
        } satisfies AgBarSeriesOptions,
    ];
}

/** The levels the status bar looks up under the pointer, by the price axis the pointer is read against. */
export function createVolumeProfileStatusBarOptions(
    levels: VolumeProfileDatum[],
    priceAxisKey: string,
    { up, down }: VolumeProfileBars
) {
    if (levels.length === 0) return undefined;

    return {
        priceAxisKey,
        upColor: typeof up?.fill === 'string' ? up.fill : undefined,
        downColor: typeof down?.fill === 'string' ? down.fill : undefined,
        levels: levels.map(({ priceLow, priceHigh, upVolume, downVolume, total }) => ({
            priceLow,
            priceHigh,
            up: upVolume,
            down: downVolume,
            total,
        })),
    };
}

/** Selection is opted into by the two profile series, never through the chart-level `enabled`. */
function createSeriesSelectionOptions(selection: AgVolumeProfileSelectionOptions | undefined) {
    if (selection?.enabled !== true) return undefined;

    const { selectedItem, unselectedItem } = selection;
    return { selection: { enabled: true, selectedItem, unselectedItem }, selectionGroup: 'volumeProfile' };
}

/** The chart-level options a preset's `selection` contributes: the click mode and drag, which are not per-series options. */
export function createSelectionChartOptions(selection: AgVolumeProfileSelectionOptions | undefined) {
    if (selection?.enabled !== true) return undefined;

    const { clickMode, enableDrag } = selection;
    const chartSelection = {
        ...(clickMode == null ? undefined : { clickMode }),
        ...(enableDrag == null ? undefined : { enableDrag }),
    };
    return Object.keys(chartSelection).length === 0 ? undefined : { selection: chartSelection };
}

/** Abbreviates a total with a suffix, such as `1.2K` or `3.4M`. */
const COMPACT_NUMBER = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });
export const formatCompact = ({ value }: { value: number }) => COMPACT_NUMBER.format(value);

/** As `formatCompact`, but always with one decimal place so the totals line up, such as `1.0K` or `12.0M`. */
const FIXED_COMPACT_NUMBER = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
});
const formatFixedCompact = ({ value }: { value: number }) => FIXED_COMPACT_NUMBER.format(value);

export const volumeProfileTotalSegmentOptionsDef: OptionsDefs<AgVolumeProfileTotalSegmentOptions> = {
    enabled: boolean,
    fill: color,
    width: positiveNumber,
    minWidth: positiveNumber,
    gap: positiveNumber,
    label: {
        enabled: boolean,
        ...fontOptionsDef,
        formatter: callback,
    },
};

export const volumeProfileSelectionOptionsDef: OptionsDefs<AgVolumeProfileSelectionOptions> = {
    enabled: boolean,
    clickMode: strictUnion<AgSelectionClickMode>()('single', 'multiple'),
    enableDrag: boolean,
    selectedItem: shapeSelectionOptionsDef,
    unselectedItem: shapeSelectionOptionsDef,
    selectedBand: {
        fill: color,
        fillOpacity: ratio,
        stroke: color,
        strokeWidth: positiveNumber,
        lineDash: arrayOf(positiveNumber),
    } satisfies OptionsDefs<AgVolumeProfileSelectedBandOptions>,
};

/**
 * The axis fragment that draws the total volume segment on a price axis: a column of each level's total,
 * reserved on the side of the series area the bars grow from. Spread in so it stays outside the public axis types.
 */
export function createTotalSegmentAxisOptions(
    totalSegment: AgVolumeProfileTotalSegmentOptions | undefined,
    position: 'left' | 'right'
) {
    if (totalSegment?.enabled !== true) return undefined;

    const { fill, width, minWidth, gap, label } = totalSegment;
    const { formatter, ...labelOptions } = label ?? {};

    return {
        axisInsetValue: {
            enabled: true,
            position,
            width,
            minWidth,
            gap,
            fill,
            categoryKey: 'price',
            valueKey: 'total',
            label: {
                ...labelOptions,
                formatter: formatter
                    ? (params: { category: unknown; value: number; datum: any }) =>
                          formatter({ value: params.value, price: params.category, datum: params.datum })
                    : formatFixedCompact,
            },
        },
    };
}

/** The axis fragment that draws a band behind each selected level on a price axis. */
export function createSelectedBandAxisOptions(selection: AgVolumeProfileSelectionOptions | undefined) {
    if (selection?.enabled !== true) return undefined;

    return { axisSelectedBand: { enabled: true, ...selection.selectedBand } };
}

export function createVolumeProfileAxis(
    volumeProfile: AgVolumeProfileOptions | undefined
): Record<string, AgNumberAxisOptions | AgCategoryAxisOptions> {
    if (!volumeProfile) return {};

    const placedRight = volumeProfile.placement !== 'left';

    return {
        yVolumeProfile: {
            type: 'number',
            position: 'top',
            tick: { enabled: false },
            label: { enabled: false },
            nice: false,
            crosshair: { enabled: false },
            gridLine: { enabled: false },
            reverse: placedRight,
            // @ts-expect-error undocumented option
            layoutConstraints: {
                stacked: false,
                width: (volumeProfile.widthRatio ?? 0.5) * 100,
                unit: 'percent',
                align: placedRight ? 'end' : 'start',
            },
            ignoreZoom: true,
        } satisfies AgNumberAxisOptions,
        xVolumeProfilePrice: {
            type: 'category',
            position: 'right',
            tick: { enabled: false },
            label: { enabled: false },
            line: { enabled: false },
            crosshair: { enabled: false },
            gridLine: { enabled: false },
            paddingInner: 0,
            // @ts-expect-error undocumented options
            layoutConstraints: {
                stacked: false,
                width: 100,
                unit: 'percent',
                align: 'start',
            },
            linkZoom: 'y',
            ...createTotalSegmentAxisOptions(volumeProfile.totalSegment, placedRight ? 'right' : 'left'),
        } satisfies AgCategoryAxisOptions,
    };
}
