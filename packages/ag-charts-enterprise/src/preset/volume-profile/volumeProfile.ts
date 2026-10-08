import { _Theme } from 'ag-charts-community';
import { type OptionsDefs, boolean, callback, color, fontOptionsDef, positiveNumber } from 'ag-charts-core';
import type {
    AgBarSeriesOptions,
    AgCategoryAxisOptions,
    AgNumberAxisOptions,
    AgVolumeProfileOptions,
    AgVolumeProfileTotalSegmentOptions,
    DatumDefault,
} from 'ag-charts-types';

import { type VolumeProfileDatum, inferVolumeProfileTickSize, normaliseVolumeProfile } from './volumeProfileUtils';

type ChartTheme = InstanceType<typeof _Theme.ChartTheme>;

export function groupVolumeProfile(
    data: DatumDefault[],
    { priceKey = 'price', upKey, downKey }: Pick<AgVolumeProfileOptions, 'priceKey' | 'upKey' | 'downKey'>,
    tickSize: number | undefined
) {
    return normaliseVolumeProfile(
        data,
        { priceKey, upKey, downKey },
        tickSize ?? inferVolumeProfileTickSize(data, priceKey) ?? 1
    );
}

// Without `levels`, the series read the chart's data, which must then hold the grouped levels.
export function createVolumeProfileSeries(
    getTheme: () => ChartTheme,
    priceAxisKey: string,
    levels?: VolumeProfileDatum[]
) {
    const seriesData = levels == null ? {} : { data: levels };

    return [
        {
            ...seriesData,
            type: 'bar',
            direction: 'horizontal',
            xKey: 'price',
            xName: 'Price',
            yKey: 'upVolume',
            yName: 'Up Volume',
            xKeyAxis: priceAxisKey,
            yKeyAxis: 'yVolumeProfile',
            stackGroup: 'volumeProfile',
            fillOpacity: 1,
            // @ts-expect-error undocumented option
            simpleItemStyler: () => ({ fill: getTheme().palette.up?.fill }),
            tooltip: {
                enabled: true,
                renderer: (params) => {
                    return {
                        symbol: { marker: { enabled: false } },
                        data: [{ label: params.yName ?? params.yKey, value: params.datum[params.yKey] }],
                    };
                },
            },
        } satisfies AgBarSeriesOptions,
        {
            ...seriesData,
            type: 'bar',
            direction: 'horizontal',
            xKey: 'price',
            xName: 'Price',
            yKey: 'downVolume',
            yName: 'Down Volume',
            xKeyAxis: priceAxisKey,
            yKeyAxis: 'yVolumeProfile',
            stackGroup: 'volumeProfile',
            fillOpacity: 1,
            // @ts-expect-error undocumented option
            simpleItemStyler: () => ({ fill: getTheme().palette.down?.fill }),
            tooltip: {
                enabled: true,
                renderer: (params) => {
                    return {
                        symbol: { marker: { enabled: false } },
                        data: [
                            { label: params.yName ?? params.yKey, value: params.datum[params.yKey] },
                            { label: 'Total', value: params.datum.total },
                        ],
                    };
                },
            },
        } satisfies AgBarSeriesOptions,
    ];
}

/** Abbreviates a total with a suffix, such as `1.2K` or `3.4M`. */
const COMPACT_NUMBER = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });
const formatCompact = ({ value }: { value: number }) => COMPACT_NUMBER.format(value);

export const volumeProfileTotalSegmentOptionsDef: OptionsDefs<AgVolumeProfileTotalSegmentOptions> = {
    enabled: boolean,
    fill: color,
    width: positiveNumber,
    minWidth: positiveNumber,
    label: {
        enabled: boolean,
        ...fontOptionsDef,
        formatter: callback,
    },
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

    const { fill, width, minWidth, label } = totalSegment;
    const { formatter, ...labelOptions } = label ?? {};

    return {
        axisInsetValue: {
            enabled: true,
            position,
            width,
            minWidth,
            fill,
            categoryKey: 'price',
            valueKey: 'total',
            label: {
                ...labelOptions,
                formatter: formatter
                    ? (params: { category: unknown; value: number; datum: any }) =>
                          formatter({ value: params.value, price: params.category, datum: params.datum })
                    : formatCompact,
            },
        },
    };
}

export function createVolumeProfileAxis(
    volumeProfile: AgVolumeProfileOptions | undefined
): Record<string, AgNumberAxisOptions | AgCategoryAxisOptions> {
    if (!volumeProfile) return {};

    const placedRight = volumeProfile.placement === 'right';

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
