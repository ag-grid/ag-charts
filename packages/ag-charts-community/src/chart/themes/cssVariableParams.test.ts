import { afterEach, describe, expect, test } from 'vitest';

import type { AgCartesianChartOptions, AgChartThemeName, AgChartThemeParams } from 'ag-charts-types';

import { AgCharts } from '../../api/agCharts';
import { expectWarningsCalls } from '../../util/test/mockConsole';
import { themes } from '../mapping/themes';
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

/**
 * The shadow is not a plain colour, and the focus, hover and active colours use a different accent mix in the dark
 * theme, so none of these can travel through a CSS variable.
 */
const UNMAPPABLE_PROPERTIES = [
    '--ag-charts-popup-shadow',
    '--ag-charts-focus-color',
    '--ag-charts-button-hover-background-color',
    '--ag-charts-button-active-background-color',
];

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

/** Renders a chart and returns its root element, where the resolved parameters are published as custom properties. */
async function renderChartRoot(theme: AgCartesianChartOptions['theme'], charts: ChartOrProxy[]) {
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

    const root = container.querySelector<HTMLElement>('[class*="ag-charts-theme-"]');
    if (root == null) throw new Error('no chart root element found');
    return root;
}

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
        const { style } = await renderChartRoot(theme, charts);
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

describe('button state theme params', () => {
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

    const getButtonProperties = async (theme: AgCartesianChartOptions['theme']) => {
        const root = await renderChartRoot(theme, charts);
        return (name: string) => root.style.getPropertyValue(`--ag-charts-${name}`);
    };

    test.each(Object.keys(themes) as AgChartThemeName[])(
        '%s defaults match the existing button styling',
        async (themeName) => {
            const get = await getButtonProperties(themeName);

            expect(get('button-hover-background-color')).toBe(get('focus-color'));
            expect(get('button-active-background-color')).toBe(get('focus-color'));

            expect(get('button-hover-text-color')).toBe(get('button-text-color'));
            expect(get('button-active-text-color')).toBe(get('accent-color'));

            expect(get('button-hover-border-color')).toBe(get('button-border-color'));
            expect(get('button-hover-border-width')).toBe(get('button-border-width'));
            expect(get('button-disabled-border-color')).toBe(get('button-border-color'));
            expect(get('button-disabled-border-width')).toBe(get('button-border-width'));
            expect(get('button-active-border-color')).toBe(get('accent-color'));
            // The active border width falls back to the base button border width in CSS.
            expect(get('button-active-border-width')).toBe('');

            expect(get('button-disabled-background-color')).not.toBe('');
            expect(get('button-disabled-text-color')).not.toBe('');

            expect(get('button-horizontal-padding')).toBe('8px');
            expect(get('button-vertical-padding')).toBe('8px');
        }
    );

    test.each([
        ['true', true],
        ['false', false],
        ['an object', { color: 'red', width: 3 }],
    ] as const)('hover and disabled borders follow buttonBorder set to %s', async (_, buttonBorder) => {
        const get = await getButtonProperties({ params: { buttonBorder } });

        for (const state of ['hover', 'disabled']) {
            expect(get(`button-${state}-border-color`)).toBe(get('button-border-color'));
            expect(get(`button-${state}-border-width`)).toBe(get('button-border-width'));
        }
    });

    test('custom values are published as CSS variables', async () => {
        const params: AgChartThemeParams = {
            buttonHoverBackgroundColor: 'rgb(1, 1, 1)',
            buttonHoverTextColor: 'rgb(2, 2, 2)',
            buttonHoverBorder: { color: 'rgb(3, 3, 3)', width: 2 },
            buttonActiveBackgroundColor: 'rgb(4, 4, 4)',
            buttonActiveTextColor: 'rgb(5, 5, 5)',
            buttonActiveBorder: true,
            buttonDisabledBackgroundColor: 'rgb(6, 6, 6)',
            buttonDisabledTextColor: 'rgb(7, 7, 7)',
            buttonDisabledBorder: false,
            buttonHorizontalPadding: 20,
            buttonVerticalPadding: 2,
        };
        const get = await getButtonProperties({ params });

        expect(get('button-hover-background-color')).toBe('rgb(1, 1, 1)');
        expect(get('button-hover-text-color')).toBe('rgb(2, 2, 2)');
        expect(get('button-hover-border-color')).toBe('rgb(3, 3, 3)');
        expect(get('button-hover-border-width')).toBe('2px');
        expect(get('button-active-background-color')).toBe('rgb(4, 4, 4)');
        expect(get('button-active-text-color')).toBe('rgb(5, 5, 5)');
        expect(get('button-active-border-color')).toBe('var(--ag-charts-border-color)');
        expect(get('button-active-border-width')).toBe('var(--ag-charts-border-width)');
        expect(get('button-disabled-background-color')).toBe('rgb(6, 6, 6)');
        expect(get('button-disabled-text-color')).toBe('rgb(7, 7, 7)');
        expect(get('button-disabled-border-color')).toBe('none');
        expect(get('button-disabled-border-width')).toBe('0');
        expect(get('button-horizontal-padding')).toBe('20px');
        expect(get('button-vertical-padding')).toBe('2px');
    });

    test('new colour params can be referenced by other params', async () => {
        const get = await getButtonProperties({
            params: {
                buttonHoverBackgroundColor: 'rgb(9, 9, 9)',
                buttonActiveTextColor: { ref: 'buttonHoverBackgroundColor' },
            },
        });

        expect(get('button-active-text-color')).toBe('rgb(9, 9, 9)');
    });

    test('invalid values are rejected with a warning', async () => {
        const get = await getButtonProperties({
            params: {
                buttonHoverBorder: 'thick',
                buttonHorizontalPadding: '12px',
            } as unknown as AgChartThemeParams,
        });

        expectWarningsCalls().toHaveLength(2);
        expect(get('button-hover-border-color')).toBe(get('button-border-color'));
        expect(get('button-horizontal-padding')).toBe('8px');
    });
});
