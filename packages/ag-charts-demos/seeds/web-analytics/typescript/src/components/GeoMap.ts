import type { AgChartOptions, AgMapShapeSeriesOptions } from 'ag-charts-community';

import { type DataChart, createDataChart } from '../agChart';
import { SEQUENTIAL_BLUE, THEME } from '../chartTheme';
import { fmtInt } from '../format';
import { topology } from '../topology';
import type { CountryDatum } from '../types';

export function createGeoMap(data: CountryDatum[]): DataChart<CountryDatum[]> {
    return createDataChart(data, (data): AgChartOptions => {
        // The "Unknown" bucket has no matching geography, so it can't be placed.
        const mapData = data.filter((row) => row.country !== 'Unknown');
        const shape: AgMapShapeSeriesOptions = {
            type: 'map-shape',
            idKey: 'country',
            colorKey: 'sessions',
            colorName: 'Sessions',
            topologyIdKey: 'name',
            colorScale: {
                fills: SEQUENTIAL_BLUE.map((color) => ({ color })),
            },
        };
        return {
            theme: THEME,
            topology,
            data: mapData,
            series: [{ type: 'map-shape-background' }, shape],
            gradientLegend: { enabled: true },
            padding: 0,
            // Formats the session count wherever it appears — tooltip and legend scale.
            formatter: {
                color: ({ value }) => fmtInt(Number(value)),
            },
        };
    });
}
