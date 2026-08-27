import { afterEach, describe, expect, test } from 'vitest';

import type { AgCartesianChartOptions, AgChartThemeParams } from 'ag-charts-types';

import { AgCharts } from '../../api/agCharts';
import type { ChartOrProxy } from '../test/utils';
import { setupMockCanvas, setupMockConsole, waitForChartStability } from '../test/utils';

/**
 * The colour parameters the documentation examples source from CSS variables, so that an example
 * adopts the site's dark mode through CSS rather than a theme swap (AG-17743), and the
 * `ag-default-dark` values those variables carry. Mirrors
 * `external/ag-website-shared/src/components/example-runner/styles/example-chart-theme.css`.
 */
const DARK_MODE_PARAMS: AgChartThemeParams = {
    axisLineColor: '#c3c5c9',
    backgroundColor: '#192232',
    borderColor: '#4b525e',
    chromeBackgroundColor: '#293140',
    crosshairLabelBackgroundColor: '#afb2b7',
    foregroundColor: '#fff',
    gridLineColor: '#545b67',
    groupedCategoryLineColor: '#7e838c',
    subtleTextColor: '#7c818a',
};

/** Neither is a plain colour, so neither can travel through a CSS variable. */
const UNMAPPABLE_PROPERTIES = ['--ag-charts-popup-shadow', '--ag-charts-focus-color'];

describe("the documentation examples' dark mode parameters", () => {
    setupMockConsole();
    setupMockCanvas();

    let charts: ChartOrProxy[] = [];

    afterEach(async () => {
        for (const chart of charts) {
            await waitForChartStability(chart);
            chart.destroy();
        }
        charts = [];
    });

    const getThemeProperties = async (theme: AgCartesianChartOptions['theme']) => {
        const container = document.body.appendChild(document.createElement('div'));
        const chart = AgCharts.create({
            theme,
            width: 400,
            height: 300,
            container,
            data: [{ x: 'a', y: 1 }],
            series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
        } as AgCartesianChartOptions);
        charts.push(chart);
        await waitForChartStability(chart);

        // The resolved parameters are published as custom properties on the chart's root element.
        const root = container.querySelector<HTMLElement>('[class*="ag-charts-theme-"]');
        if (root == null) throw new Error('no chart root element found');

        const { style } = root;
        const properties: Record<string, string> = {};
        for (let i = 0; i < style.length; i++) {
            const name = style[i];
            if (name.startsWith('--ag-charts') && !UNMAPPABLE_PROPERTIES.includes(name)) {
                properties[name] = style.getPropertyValue(name);
            }
        }
        return properties;
    };

    test('reproduce the dark theme on top of the default one', async () => {
        const fromParams = await getThemeProperties({ baseTheme: 'ag-default', params: DARK_MODE_PARAMS });
        const fromDarkTheme = await getThemeProperties('ag-default-dark');

        expect(fromParams).toEqual(fromDarkTheme);
    });
});
