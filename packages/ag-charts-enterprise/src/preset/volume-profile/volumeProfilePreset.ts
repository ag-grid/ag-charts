import { _Theme } from 'ag-charts-community';
import type {
    AgBaseFinancialPresetOptions,
    AgCartesianChartOptions,
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
        priceKey,
        upKey,
        downKey,
        tickSize,
        // Resolved from the chart's own options against the preset's `themeTemplate`; pulled out
        // here only to keep it out of `unusedOpts`.
        theme: _theme,
        ...unusedOpts
    } = opts;

    return {
        animation: { enabled: false },
        legend: { enabled: false },
        series: createVolumeProfileSeries(getTheme, { data, priceKey, upKey, downKey }, tickSize, 'x'),
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
            type: 'number',
            position: 'left',
        } satisfies AgNumberAxisOptions,
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
