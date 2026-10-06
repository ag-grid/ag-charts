import { _Theme } from 'ag-charts-community';
import type {
    AgBaseFinancialPresetOptions,
    AgCartesianChartOptions,
    AgCategoryAxisOptions,
    AgNumberAxisOptions,
    AgVolumeProfileChartPreset,
    DatumDefault,
} from 'ag-charts-types';

import { createVolumeProfileSeries } from './volumeProfile';

type ChartTheme = _Theme.ChartTheme;

export function volumeProfileChart(
    opts: AgVolumeProfileChartPreset & AgBaseFinancialPresetOptions,
    _presetTheme: unknown,
    getTheme: () => ChartTheme
): AgCartesianChartOptions<DatumDefault, never> {
    const {
        data = [],
        // Read by the preset's `transformSeriesData`, or resolved against its `themeTemplate`; pulled out here
        // only to keep them out of `unusedOpts`.
        priceKey: _priceKey,
        upKey: _upKey,
        downKey: _downKey,
        tickSize: _tickSize,
        theme: _theme,
        ...unusedOpts
    } = opts;

    return {
        data,
        animation: { enabled: false },
        legend: { enabled: false },
        series: createVolumeProfileSeries(getTheme, 'x'),
        axes: {
            ...createPriceAxis(),
            ...createVolumeAxis(),
        },
        ...unusedOpts,
    } satisfies AgCartesianChartOptions<DatumDefault, never>;
}

function createPriceAxis() {
    return {
        x: {
            type: 'category',
            position: 'left',
        } satisfies AgCategoryAxisOptions,
    };
}

function createVolumeAxis() {
    return {
        yVolumeProfile: {
            type: 'number',
            position: 'bottom',
        } satisfies AgNumberAxisOptions,
    };
}
