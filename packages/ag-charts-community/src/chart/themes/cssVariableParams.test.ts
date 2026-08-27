import { afterEach, describe, expect, test } from 'vitest';

import type { AgCartesianChartOptions, AgChartThemeParams } from 'ag-charts-types';

import { AgCharts } from '../../api/agCharts';
import type { ChartOrProxy } from '../test/utils';
import { setupMockCanvas, setupMockConsole, waitForChartStability } from '../test/utils';
import { ChartTheme } from './chartTheme';
import { DarkTheme } from './darkTheme';

/**
 * The documentation examples adopt the site's dark mode through CSS rather than a theme swap
 * (AG-17743): the generated snippet points the default theme's colour parameters at the variables in
 * `external/ag-website-shared/src/components/example-runner/styles/example-chart-theme.css`, and AG
 * Charts re-resolves them when the site toggles `data-dark-mode`.
 *
 * That only works for colours a theme *parameter* can carry. These two tests fence off both halves
 * of that claim, so a change to either theme fails here rather than silently mis-colouring examples.
 */

/** The `ag-default-dark` parameter values the CSS variables carry. Keep in step with that file. */
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

/**
 * The palette entries `ag-default-dark` retunes. None can be driven from CSS - `theme.palette`
 * takes no option for the hierarchy or sequential colours, and supplying `strokes`/`up`/`down`/
 * `neutral` would change `paletteType` and so change light mode too - so the examples whose series
 * read them stay on the theme-name swap, listed as `PALETTE_SENSITIVE_TYPES` in
 * `plugins/ag-charts-generate-example-files/.../getDarkModeSnippet.ts`. If this set changes, that
 * list needs revisiting.
 */
const DARK_PALETTE_KEYS = [
    'altDown',
    'altNeutral',
    'altUp',
    'down',
    'hierarchyColors',
    'neutral',
    'secondHierarchyColors',
    'secondSequentialColors',
    'strokes',
    'up',
];

describe("the documentation examples' dark mode", () => {
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

    test('parameters reproduce the dark theme on top of the default one', async () => {
        const fromParams = await getThemeProperties({ baseTheme: 'ag-default', params: DARK_MODE_PARAMS });
        const fromDarkTheme = await getThemeProperties('ag-default-dark');

        expect(fromParams).toEqual(fromDarkTheme);
    });

    test('only the known palette entries fall outside the parameters', () => {
        const light: Record<string, unknown> = ChartTheme.getDefaultColors();
        const dark: Record<string, unknown> = new DarkTheme().getDefaultColors();

        const differing = Object.keys(light)
            .filter((key) => JSON.stringify(light[key]) !== JSON.stringify(dark[key]))
            .sort((a, b) => a.localeCompare(b));

        expect(differing).toEqual(DARK_PALETTE_KEYS);
    });
});
