import { _Theme } from 'ag-charts-community';
import type { AgBarSeriesOptions, AgNumberAxisOptions, AgVolumeProfileOptions } from 'ag-charts-types';

import { inferVolumeProfileTickSize, normaliseVolumeProfile } from './volumeProfileUtils';

type ChartTheme = _Theme.ChartTheme;

export function createVolumeProfileSeries(
    getTheme: () => ChartTheme,
    volumeProfile: AgVolumeProfileOptions | undefined,
    tickSize: number | undefined
) {
    if (!volumeProfile) return [];

    const { data, priceKey = 'price', upKey, downKey } = volumeProfile;
    const normalisedData = normaliseVolumeProfile(
        data,
        { priceKey, upKey, downKey },
        tickSize ?? inferVolumeProfileTickSize(data, priceKey) ?? 1
    );

    return [
        {
            data: normalisedData,
            type: 'bar',
            direction: 'horizontal',
            xKey: 'price',
            xName: 'Price',
            yKey: 'upVolume',
            yName: 'Up Volume',
            xKeyAxis: 'y',
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
            data: normalisedData,
            type: 'bar',
            direction: 'horizontal',
            xKey: 'price',
            xName: 'Price',
            yKey: 'downVolume',
            yName: 'Down Volume',
            xKeyAxis: 'y',
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
): Record<string, AgNumberAxisOptions> {
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
    };
}
