import { _Theme } from 'ag-charts-community';
import { isFiniteNumber } from 'ag-charts-core';
import type {
    AgBarSeriesOptions,
    AgCategoryAxisOptions,
    AgNumberAxisOptions,
    AgVolumeProfileOptions,
    DatumDefault,
} from 'ag-charts-types';

import { type VolumeProfileDatum, inferVolumeProfileTickSize, normaliseVolumeProfile } from './volumeProfileUtils';

type ChartTheme = _Theme.ChartTheme;

export function groupVolumeProfile(
    data: DatumDefault[],
    { priceKey = 'price', upKey, downKey }: Pick<AgVolumeProfileOptions, 'priceKey' | 'upKey' | 'downKey'>,
    tickSize: number | undefined
) {
    // Validation would clear an invalid tick size, which `transformSeriesData` receives unvalidated.
    const validTickSize = isFiniteNumber(tickSize) && tickSize > 0 ? tickSize : undefined;
    return normaliseVolumeProfile(
        data,
        { priceKey, upKey, downKey },
        validTickSize ?? inferVolumeProfileTickSize(data, priceKey) ?? 1
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
        } satisfies AgCategoryAxisOptions,
    };
}
