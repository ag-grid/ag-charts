import type { Mock } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger, ModuleRegistry, ambientLog, ambientLogger } from 'ag-charts-core';
import type {
    AgAreaSeriesOptions,
    AgBarSeriesOptions,
    AgCartesianChartOptions,
    AgChartOptions,
    AgChartTheme,
    AgLineSeriesOptions,
    AgNumberAxisOptions,
    AgSparklineOptions,
    SeriesType,
} from 'ag-charts-types';

import { sanitizeThemeModules } from '../chart/factory/processModuleOptions';
import { BarSeriesModule } from '../chart/series/cartesian/barSeriesModule';
import * as examples from '../chart/test/examples';
import { ChartTheme } from '../chart/themes/chartTheme';
import { VERSION } from '../version';
import { CategoryAxisModule } from './axis-modules/categoryAxisModule';
import { NumberAxisModule } from './axis-modules/numberAxisModule';
import { ChartOptions } from './optionsModule';
import { __clearStructuralCacheForTests } from './optionsStructuralCache';

function prepareOptions<T extends AgChartOptions>(userOptions: T, logger?: Logger): T {
    const chartOptions = new ChartOptions(userOptions, {} as T, {}, {}, {}, undefined, false, false, undefined, logger);
    return chartOptions.processedOptions;
}

// Mirrors AgCharts.__createSparkline() -> createOrUpdate(): no base options, the user options as the
// new options, and the sparkline preset metadata.
function prepareSparklineOptions(userOptions: AgSparklineOptions, logger?: Logger): AgChartOptions {
    const chartOptions = new ChartOptions(
        undefined,
        userOptions as AgChartOptions,
        {},
        {},
        { presetType: 'sparkline', pool: true, domMode: 'minimal', withDragInterpretation: false },
        undefined,
        false,
        false,
        undefined,
        logger
    );
    return chartOptions.processedOptions;
}

function getSeriesOptions(seriesType: string, mapper?: <T>(series: T) => T) {
    const seriesOptions = seriesOptionsMap[seriesType];
    return mapper ? seriesOptions.map(mapper) : seriesOptions;
}

function setSeriesType(
    type: 'bar' | 'line' | 'area',
    series: Omit<AgBarSeriesOptions | AgLineSeriesOptions | AgAreaSeriesOptions, 'type'>
): AgBarSeriesOptions | AgLineSeriesOptions | AgAreaSeriesOptions {
    return { ...series, type } as any;
}

const baseSeriesIPhone = {
    xKey: 'quarter',
    yKey: 'iphone',
    yName: 'IPhone',
};
const baseSeriesMac = {
    xKey: 'quarter',
    yKey: 'mac',
    yName: 'Mac',
};
const baseSeriesWearables = {
    xKey: 'quarter',
    yKey: 'wearables',
    yName: 'Wearables',
};
const baseSeriesServices = {
    xKey: 'quarter',
    yKey: 'services',
    yName: 'Services',
};

const colSeriesIPhone = setSeriesType('bar', baseSeriesIPhone);
const colSeriesMac = setSeriesType('bar', baseSeriesMac);
const colSeriesWearables = setSeriesType('bar', baseSeriesWearables);
const colSeriesServices = setSeriesType('bar', baseSeriesServices);
const lineSeriesIPhone = setSeriesType('line', baseSeriesIPhone);
const lineSeriesMac = setSeriesType('line', baseSeriesMac);
const areaSeriesIPhone = setSeriesType('area', baseSeriesIPhone);
const areaSeriesMac = setSeriesType('area', baseSeriesMac);
const areaSeriesWearables = setSeriesType('area', baseSeriesWearables);
const areaSeriesServices = setSeriesType('area', baseSeriesServices);

const seriesOptions: Array<AgBarSeriesOptions | AgLineSeriesOptions | AgAreaSeriesOptions> = [
    {
        ...colSeriesIPhone,
        fill: 'pink',
        showInLegend: true,
    } as AgBarSeriesOptions,
    lineSeriesMac,
    {
        ...colSeriesMac,
        fill: 'red',
        showInLegend: false,
    } as AgBarSeriesOptions,
    lineSeriesIPhone,
    {
        ...colSeriesWearables,
        showInLegend: true,
        grouped: true,
    } as AgBarSeriesOptions,
    {
        ...colSeriesServices,
        showInLegend: false,
        grouped: true,
    } as AgBarSeriesOptions,
];

const areas = [areaSeriesIPhone, areaSeriesMac, areaSeriesWearables, areaSeriesServices];
const lines = [lineSeriesIPhone, lineSeriesMac];
const columns = [colSeriesIPhone, colSeriesMac, colSeriesWearables, colSeriesServices];
const rangeColumns = [
    {
        type: 'range-bar',
        xKey: 'date',
        yLowKey: 'low',
        yHighKey: 'high',
    },
    {
        type: 'range-bar',
        xKey: 'date',
        yLowKey: 'low2',
        yHighKey: 'high2',
    },
];

const nightingales = [
    {
        type: 'nightingale',
        angleKey: 'product',
        radiusKey: 'A sales',
    },
    {
        type: 'nightingale',
        angleKey: 'product',
        radiusKey: 'B sales',
    },
];

const seriesOptionsMap: Record<string, any[]> = {
    area: areas,
    bar: columns,
    line: lines,
    nightingale: nightingales,
    'range-bar': rangeColumns,
};

type TestCase = {
    options: AgChartOptions;
};
const EXAMPLES: Record<string, TestCase> = {
    BAR_CHART_EXAMPLE: {
        options: examples.BAR_CHART_EXAMPLE,
    },
    GROUPED_BAR_CHART_EXAMPLE: {
        options: examples.GROUPED_BAR_CHART_EXAMPLE,
    },
    STACKED_BAR_CHART_EXAMPLE: {
        options: examples.STACKED_BAR_CHART_EXAMPLE,
    },
    ONE_HUNDRED_PERCENT_STACKED_BAR_EXAMPLE: {
        options: examples.ONE_HUNDRED_PERCENT_STACKED_BAR_EXAMPLE,
    },
    BAR_CHART_WITH_LABELS_EXAMPLE: {
        options: examples.BAR_CHART_WITH_LABELS_EXAMPLE,
    },
    SIMPLE_COLUMN_CHART_EXAMPLE: {
        options: examples.SIMPLE_COLUMN_CHART_EXAMPLE,
    },
    GROUPED_COLUMN_EXAMPLE: {
        options: examples.GROUPED_COLUMN_EXAMPLE,
    },
    STACKED_COLUMN_GRAPH_EXAMPLE: {
        options: examples.STACKED_COLUMN_GRAPH_EXAMPLE,
    },
    ONE_HUNDRED_PERCENT_STACKED_COLUMNS_EXAMPLE: {
        options: examples.ONE_HUNDRED_PERCENT_STACKED_COLUMNS_EXAMPLE,
    },
    COLUMN_CHART_WITH_NEGATIVE_VALUES_EXAMPLE: {
        options: examples.COLUMN_CHART_WITH_NEGATIVE_VALUES_EXAMPLE,
    },
    SIMPLE_PIE_CHART_EXAMPLE: {
        options: examples.SIMPLE_PIE_CHART_EXAMPLE,
    },
    SIMPLE_DONUT_CHART_EXAMPLE: {
        options: examples.SIMPLE_DONUT_CHART_EXAMPLE,
    },
    SIMPLE_LINE_CHART_EXAMPLE: {
        options: examples.SIMPLE_LINE_CHART_EXAMPLE,
    },
    LINE_GRAPH_WITH_GAPS_EXAMPLE: {
        options: examples.LINE_GRAPH_WITH_GAPS_EXAMPLE,
    },
    SIMPLE_SCATTER_CHART_EXAMPLE: {
        options: examples.SIMPLE_SCATTER_CHART_EXAMPLE,
    },
    BUBBLE_GRAPH_WITH_NEGATIVE_VALUES_EXAMPLE: {
        options: examples.BUBBLE_GRAPH_WITH_NEGATIVE_VALUES_EXAMPLE,
    },
    BUBBLE_GRAPH_WITH_CATEGORIES_EXAMPLE: {
        options: examples.BUBBLE_GRAPH_WITH_CATEGORIES_EXAMPLE,
    },
    SIMPLE_AREA_GRAPH_EXAMPLE: {
        options: examples.SIMPLE_AREA_GRAPH_EXAMPLE,
    },
    STACKED_AREA_GRAPH_EXAMPLE: {
        options: examples.STACKED_AREA_GRAPH_EXAMPLE,
    },
    ONE_HUNDRED_PERCENT_STACKED_AREA_GRAPH_EXAMPLE: {
        options: examples.ONE_HUNDRED_PERCENT_STACKED_AREA_GRAPH_EXAMPLE,
    },
    AREA_GRAPH_WITH_NEGATIVE_VALUES_EXAMPLE: {
        options: examples.AREA_GRAPH_WITH_NEGATIVE_VALUES_EXAMPLE,
    },
    // START ADVANCED EXAMPLES =====================================================================
    ADV_TIME_AXIS_WITH_IRREGULAR_INTERVALS: {
        options: examples.ADV_TIME_AXIS_WITH_IRREGULAR_INTERVALS,
    },
    LOG_AXIS_EXAMPLE: {
        options: examples.LOG_AXIS_EXAMPLE,
    },
    ADV_COMBINATION_SERIES_CHART_EXAMPLE: {
        options: examples.ADV_COMBINATION_SERIES_CHART_EXAMPLE,
    },
    ADV_CHART_CUSTOMISATION: {
        options: examples.ADV_CHART_CUSTOMISATION,
    },
    ADV_CUSTOM_MARKER_SHAPES_EXAMPLE: {
        options: examples.ADV_CUSTOM_MARKER_SHAPES_EXAMPLE,
    },
    ADV_CUSTOM_TOOLTIPS_EXAMPLE: {
        options: examples.ADV_CUSTOM_TOOLTIPS_EXAMPLE,
    },
    ADV_PER_MARKER_CUSTOMISATION_EXAMPLE: {
        options: examples.ADV_PER_MARKER_CUSTOMISATION,
    },
};

const COMBO_CHART_EXAMPLE: AgCartesianChartOptions = {
    series: [
        { type: 'line', xKey: 'abc', yKey: 'test2' },
        { type: 'bar', xKey: 'abc', yKey: 'test' },
        { type: 'area', xKey: 'abc', yKey: 'test3' },
    ],
    theme: {
        baseTheme: {
            baseTheme: 'ag-default',
            overrides: {
                bar: { series: { label: { enabled: true } } },
                line: { series: { label: { enabled: true } } },
                area: { series: { label: { enabled: true } } },
            },
        } as any,
        overrides: {},
    },
};

const COMPLEX_THEME_SCENARIO: AgCartesianChartOptions = {
    series: [
        { type: 'line', xKey: 'abc', yKey: 'test2' },
        { type: 'bar', xKey: 'abc', yKey: 'test' },
        { type: 'area', xKey: 'abc', yKey: 'test3' },
        { type: 'area', xKey: 'abc', yKey: 'test4', label: {} },
    ],
    axes: {
        x: { type: 'time', position: 'bottom' },
        xSecondary: { type: 'time', position: 'bottom', title: { text: 'Time' } },
        y: { type: 'number', position: 'left', title: { text: 'Velocity' } },
        ySecondary: { type: 'number', position: 'right', title: { text: 'G', enabled: true } },
    },
    theme: {
        baseTheme: {
            baseTheme: 'ag-default',
            overrides: {
                common: {
                    axes: {
                        number: { title: { _enabledFromTheme: true, enabled: false } },
                    },
                },
                bar: { series: { label: { enabled: false, _enabledFromTheme: true } } },
                line: { series: { label: { enabled: true, _enabledFromTheme: true } } },
            },
        } as any,
        overrides: {},
    },
};

const ENABLED_FALSE_OPTIONS: AgCartesianChartOptions = {
    ...examples.SIMPLE_LINE_CHART_EXAMPLE,
    title: {
        enabled: false,
        text: 'Custom Title',
        fontSize: 40,
        spacing: 200,
    },
    subtitle: {
        enabled: false,
        text: 'Custom Subtitle',
        fontSize: 20,
        spacing: 100,
    },
    footnote: {
        enabled: false,
        text: 'Custom Footnote',
        fontSize: 30,
        spacing: 150,
    },
    axes: {
        x: {
            position: 'bottom',
            type: 'time',
            interval: {
                maxSpacing: 26,
            },
            tick: {
                enabled: false,
                width: 66,
                size: 44,
            },
            title: {
                enabled: false,
                text: 'Custom Bottom Axis Title',
            },
            label: {
                enabled: false,
                avoidCollisions: false,
                autoRotate: true,
                minSpacing: 15,
            },
            crossLines: [
                {
                    enabled: false,
                    type: 'range',
                    range: [new Date('2019-01-01'), new Date('2019-06-01')],
                    label: {
                        enabled: false,
                        text: 'Custom Crossline Label',
                    },
                },
            ],
        },
        y: {
            position: 'left',
            type: 'number',
            title: {
                text: 'Custom Left Axis Title',
            },
            label: {
                autoRotate: true,
            },
        },
    },
    series: [
        {
            ...examples.SIMPLE_LINE_CHART_EXAMPLE.series?.[0],
            marker: {
                enabled: false,
                strokeWidth: 20,
            },
            label: {
                enabled: false,
                color: 'pink',
            },
            tooltip: {
                enabled: false,
                renderer: ({ datum, yKey }) => {
                    const { [yKey]: yValue } = datum;
                    return { title: `Custom Series Tooltip Renderer: ${yValue}` };
                },
            },
        },
    ] as AgLineSeriesOptions[],
    tooltip: {
        enabled: false,
        range: 20,
    },
    legend: {
        enabled: false,
        maxHeight: 100,
        maxWidth: 500,
        orientation: 'horizontal',
        spacing: 55,
        reverseOrder: true,
        pagination: {
            marker: {
                shape: 'circle',
            },
        },
        item: {
            label: {
                maxLength: 33,
            },
        },
    },
    navigator: {
        enabled: false,
        height: 229,
    },
    initialState: {
        zoom: {
            ratioX: {
                start: 0.5,
                end: 0.8,
            },
        },
    },
};

const INTRINSIC_ENABLE_CROSSLINE_OPTIONS: AgCartesianChartOptions = {
    ...examples.SIMPLE_LINE_CHART_EXAMPLE,
    axes: {
        x: {
            position: 'bottom',
            type: 'time',
            crossLines: [
                {
                    type: 'range',
                    range: [new Date('2019-01-01'), new Date('2019-06-01')],
                    label: {
                        text: 'Custom Crossline Label',
                    },
                },
            ],
        },
        y: {
            position: 'left',
            type: 'number',
        },
    },
};

describe('ChartOptions', () => {
    beforeEach(() => {
        console.warn = vi.fn();
        console.error = vi.fn();
        ambientLog.reset();
    });

    describe('structural cache validation issues', () => {
        const invalidOptions = (): AgChartOptions =>
            ({ series: [{ type: 'line', xKey: 'x', yKey: 'y', strokeWidth: 'notanumber' as any }] }) as AgChartOptions;

        beforeEach(() => {
            __clearStructuralCacheForTests();
            console.log = vi.fn();
            (globalThis as any).agChartsDebug = ['opts'];
        });

        afterEach(() => {
            delete (globalThis as any).agChartsDebug;
        });

        it('replays captured issues on a cache hit instead of discarding them', () => {
            const cacheProbe = (label: string) =>
                (console.log as Mock).mock.calls.filter(
                    (args) => args[0] === '[CACHE] StructuralOptions' && args[1] === label
                ).length;

            const first = new ChartOptions(invalidOptions(), {} as AgChartOptions, {}, {}, { domMode: 'minimal' });
            expect(first.validationIssues.length).toBeGreaterThan(0);
            expect(cacheProbe('miss')).toBe(1);

            const second = new ChartOptions(invalidOptions(), {} as AgChartOptions, {}, {}, { domMode: 'minimal' });
            expect(cacheProbe('hit')).toBe(1);
            expect(second.validationIssues).toEqual(first.validationIssues);
        });
    });

    describe('type warnings', () => {
        it('warns when a series type is missing', () => {
            prepareOptions({
                series: [{ xKey: 'x', yKey: 'y' } as any],
            });

            expect(console.warn).toHaveBeenCalledTimes(1);
            const [message] = (console.warn as Mock).mock.calls[0];
            expect(message).toContain('Option `series[0].type` is required and has not been provided');
            expect(message).toContain("'line'");
        });

        it('reports the missing module for the default series type when no series are provided', () => {
            // Restore exactly what was registered: the stacking/grouping suite below registers its own
            // ad-hoc series definitions at collection time, which re-registering the bundle would drop.
            const registeredModules = [...ModuleRegistry.listModules()];
            ModuleRegistry.reset();
            ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, NumberAxisModule]);
            try {
                prepareOptions({} as AgChartOptions);
            } finally {
                ModuleRegistry.reset();
                ModuleRegistry.registerModules(registeredModules);
            }

            const messages = (console.error as Mock).mock.calls.map(([m]) => String(m));
            expect(messages.some((m) => m.includes('required modules are not registered'))).toBe(true);
            expect(messages.some((m) => m.includes('LineSeriesModule'))).toBe(true);
        });

        it('stays silent when the default series type has a registered module', () => {
            prepareOptions({} as AgChartOptions);

            expect(console.error).not.toHaveBeenCalled();
            expect(console.warn).not.toHaveBeenCalled();
        });

        it('warns when a series type is unknown and suggests valid types', () => {
            prepareOptions({
                series: [{ type: 'lien' as any, xKey: 'x', yKey: 'y' }],
            });

            expect(console.warn).toHaveBeenCalledTimes(1);
            const [message] = (console.warn as Mock).mock.calls[0];
            expect(message).toContain('Unknown type `lien` at `series[0].type`');
            expect(message).toContain("'line'");
        });

        it('warns when an axis type is unknown and suggests valid types', () => {
            prepareOptions({
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                axes: {
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'nmuber' as any, position: 'left' },
                },
            });

            expect(console.warn).toHaveBeenCalledTimes(1);
            const [message] = (console.warn as Mock).mock.calls[0];
            expect(message).toContain('Unknown type `nmuber` at `axes.y.type`');
            expect(message).toContain("'number'");
            expect(message).toContain('ignoring.');
        });

        it('warns when an enterprise axis type is not registered', () => {
            const logger = new Logger();
            const instanceErrorOnce = vi.spyOn(logger, 'errorOnce');
            const ambientErrorOnce = vi.spyOn(ambientLogger, 'errorOnce');

            prepareOptions(
                {
                    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                    axes: {
                        x: { type: 'ordinal-time', position: 'bottom' },
                        y: { type: 'number', position: 'left' },
                    },
                } as any,
                logger
            );

            const messages = (console.error as Mock).mock.calls.map(([m]) => String(m));
            expect(messages.some((m) => m.includes('required modules are not registered'))).toBe(true);
            expect(messages.some((m) => m.includes('OrdinalTimeAxisModule'))).toBe(true);

            const instanceMessages = instanceErrorOnce.mock.calls.map(([m]) => String(m));
            expect(instanceMessages.some((m) => m.includes('required modules are not registered'))).toBe(true);
            expect(instanceMessages.some((m) => m.includes('OrdinalTimeAxisModule'))).toBe(true);
            expect(ambientErrorOnce).not.toHaveBeenCalled();
        });

        it('warns with a CDN-friendly message when an enterprise feature is used in UMD mode', () => {
            ModuleRegistry.setRegistryMode(ModuleRegistry.RegistryMode.UMD);
            try {
                const logger = new Logger();
                const instanceWarnOnce = vi.spyOn(logger, 'warnOnce');
                const ambientWarnOnce = vi.spyOn(ambientLogger, 'warnOnce');

                prepareOptions(
                    {
                        series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                        axes: {
                            x: { type: 'ordinal-time', position: 'bottom' },
                            y: { type: 'number', position: 'left' },
                        },
                    } as any,
                    logger
                );

                const warnings = (console.warn as Mock).mock.calls.map(([m]) => String(m));
                expect(
                    warnings.some((m) =>
                        m.includes(
                            "unable to use these enterprise features as 'ag-charts-enterprise' has not been loaded"
                        )
                    )
                ).toBe(true);
                expect(warnings.some((m) => m.includes('ordinal-time'))).toBe(true);
                expect(
                    warnings.some((m) => m.includes('https://www.ag-grid.com/charts/javascript/installation/'))
                ).toBe(true);
                expect(warnings.some((m) => m.includes('has not been loaded:\n\nordinal-time'))).toBe(true);
                expect(warnings.some((m) => m.includes('ordinal-time\n\nSee '))).toBe(true);
                expect(warnings.every((m) => !m.includes('import {'))).toBe(true);
                expect(warnings.every((m) => !m.includes('ModuleRegistry.registerModules'))).toBe(true);

                const errors = (console.error as Mock).mock.calls.map(([m]) => String(m));
                expect(errors.every((m) => !m.includes('unable to use these enterprise features'))).toBe(true);

                const instanceWarnings = instanceWarnOnce.mock.calls.map(([m]) => String(m));
                expect(instanceWarnings.some((m) => m.includes('ordinal-time'))).toBe(true);
                expect(ambientWarnOnce).not.toHaveBeenCalled();
            } finally {
                ModuleRegistry.clearRegistryModes();
            }
        });
    });

    describe('top-level object option type warnings', () => {
        const objectKeys = [
            'animation',
            'annotations',
            'contextMenu',
            'flashOnUpdate',
            'navigator',
            'scrollbar',
            'selection',
            'sync',
            'tooltip',
            'zoom',
        ] as const;

        const baseOptions = (extra: object): AgCartesianChartOptions =>
            ({
                data: [{ x: 'a', y: 1 }],
                series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
                ...extra,
            }) as AgCartesianChartOptions;

        it.each(objectKeys)('warns exactly once when `%s` is set to `true`, and ignores the value', (key) => {
            const processedOptions = prepareOptions(baseOptions({ [key]: true }));

            expect(console.warn).toHaveBeenCalledTimes(1);
            const [message] = (console.warn as Mock).mock.calls[0];
            expect(message).toContain(`Option \`${key}\` cannot be set to \`true\`; expecting an object, ignoring.`);
            expect(processedOptions[key as keyof AgCartesianChartOptions]).not.toBe(true);
        });

        it('warns exactly once when `series` is set to `true`, and ignores the value', () => {
            const processedOptions = prepareOptions({ data: [{ x: 'a', y: 1 }], series: true } as any);

            expect(console.warn).toHaveBeenCalledTimes(1);
            const [message] = (console.warn as Mock).mock.calls[0];
            expect(message).toContain('Option `series` cannot be set to `true`; expecting an array, ignoring.');
            expect(processedOptions.series).not.toBe(true);
        });
    });

    describe('tooltip range warnings', () => {
        it('warns when tooltip.range is set to area for non-area series', () => {
            prepareOptions({
                series: [{ type: 'line', xKey: 'x', yKey: 'y', tooltip: { range: 'area' } }],
            });

            const messages = (console.warn as Mock).mock.calls.map(([message]) => String(message));
            expect(messages.some((message) => message.includes('series[0].tooltip.range'))).toBe(true);
            expect(messages.some((message) => /["'`]?area["'`]?/.test(message))).toBe(true);
        });

        it('allows tooltip.range to be set to area for area series', () => {
            const options = prepareOptions({
                series: [{ type: 'area', xKey: 'x', yKey: 'y', tooltip: { range: 'area' } }],
            });

            expect(console.warn).not.toHaveBeenCalled();
            expect(options.series?.[0]?.tooltip?.range).toBe('area');
        });

        it('falls back to the default range when chart tooltip range is area for bar series', () => {
            const options = prepareOptions<AgCartesianChartOptions>({
                tooltip: { range: 'area' },
                series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
            });

            expect(console.warn).not.toHaveBeenCalled();
            expect(options.series?.[0]?.tooltip?.range).toBe('exact');
        });
    });

    describe('highlight.mode option', () => {
        it('does not warn when highlight.mode is left unset', () => {
            const options = prepareOptions<AgCartesianChartOptions>({
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            });

            expect(console.warn).not.toHaveBeenCalled();
            expect((options as any).highlight?.mode).toBeUndefined();
        });

        it('accepts highlight.mode: shared', () => {
            const options = prepareOptions<AgCartesianChartOptions>({
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                highlight: { mode: 'shared' },
            });

            expect(console.warn).not.toHaveBeenCalled();
            expect((options as any).highlight?.mode).toBe('shared');
        });

        it('rejects an invalid highlight.mode and drops it', () => {
            const options = prepareOptions<AgCartesianChartOptions>({
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                highlight: { mode: 'invalid' as any },
            });

            const messages = (console.warn as Mock).mock.calls.map(([m]) => String(m));
            expect(messages.some((m) => m.includes('Option `highlight.mode` cannot be set to `"invalid"`'))).toBe(true);
            expect(messages.some((m) => m.includes("expecting a keyword such as 'single' or 'shared'"))).toBe(true);
            // The invalid value is dropped rather than substituted, so `ChartHighlight`'s own
            // `mode = 'single'` property default applies at the chart-instance level.
            expect((options as any).highlight?.mode).toBeUndefined();
        });
    });

    describe('circular opaque payloads (CRT-1143 regression)', () => {
        // A `context` may hold self-references (AG Grid's cross-filter passes a component instance), so
        // the `update()` diff walk must skip these opaque pass-throughs by name or it overflows the stack.
        class CrossFilterContext {
            readonly self = this;
            readonly gui: { owner: CrossFilterContext };
            constructor() {
                this.gui = { owner: this };
            }
        }

        const lineOptions = (): AgChartOptions => ({
            series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
        });

        it('survives a full update() when the context payload reference changes', () => {
            const base = new ChartOptions(
                { ...lineOptions(), context: new CrossFilterContext() } as AgChartOptions,
                {} as AgChartOptions,
                {},
                {},
                {}
            );

            const nextContext = new CrossFilterContext();
            let updated!: ChartOptions;
            expect(() => {
                updated = new ChartOptions(
                    base,
                    { ...lineOptions(), context: nextContext } as AgChartOptions,
                    {},
                    {},
                    {}
                );
            }).not.toThrow();
            expect(updated.processedOptions.context).toBe(nextContext);
        });

        it('survives a full update() when a circular context is newly introduced', () => {
            const base = new ChartOptions(lineOptions(), {} as AgChartOptions, {}, {}, {});

            const context = new CrossFilterContext();
            let updated!: ChartOptions;
            expect(() => {
                updated = new ChartOptions(base, { ...lineOptions(), context } as AgChartOptions, {}, {}, {});
            }).not.toThrow();
            expect(updated.processedOptions.context).toBe(context);
        });

        it('survives a full update() when context is a self-referential plain object', () => {
            const base = new ChartOptions(lineOptions(), {} as AgChartOptions, {}, {}, {});

            const context: Record<string, unknown> = {};
            context.context = context;
            let updated!: ChartOptions;
            expect(() => {
                updated = new ChartOptions(base, { ...lineOptions(), context } as AgChartOptions, {}, {}, {});
            }).not.toThrow();
            expect(updated.processedOptions.context).toBe(context);
        });
    });

    describe('#processSeriesOptions', () => {
        test('Simple series options processing works as expected', () => {
            const { series: options } = prepareOptions({ series: seriesOptions });

            expect(options).toMatchInlineSnapshot(`
              [
                {
                  "direction": "vertical",
                  "fill": "pink",
                  "fillOpacity": 1,
                  "highlight": {
                    "enabled": true,
                    "unhighlightedItem": {
                      "opacity": 0.6,
                    },
                    "unhighlightedSeries": {
                      "opacity": 0.2,
                    },
                  },
                  "label": {
                    "border": {
                      "enabled": false,
                      "stroke": "rgba(24, 29, 31, 0.08)",
                      "strokeWidth": 1,
                    },
                    "collision": {
                      "alwaysShow": true,
                      "collideWith": {
                        "seriesItems": true,
                      },
                      "threshold": 4,
                    },
                    "cornerRadius": 4,
                    "enabled": false,
                    "fontFamily": ""IBM Plex Sans", -apple-system, "system-ui", "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif",
                    "fontSize": 12,
                    "fontWeight": 400,
                    "insideStyle": {
                      "border": {
                        "enabled": false,
                      },
                      "color": "#ffffff",
                    },
                    "outsideStyle": {
                      "border": {
                        "enabled": false,
                      },
                      "color": "#181d1f",
                    },
                    "padding": 8,
                    "placement": "inside-center",
                    "spacing": 8,
                  },
                  "lineDash": [
                    0,
                  ],
                  "lineDashOffset": 0,
                  "segmentation": {
                    "enabled": false,
                    "key": "x",
                  },
                  "selection": {
                    "enabled": false,
                    "selectedItem": {
                      "strokeWidth": 2,
                    },
                    "unselectedItem": {
                      "opacity": 0.6,
                    },
                    "unselectedSeries": {
                      "opacity": 0.2,
                    },
                  },
                  "seriesGrouping": {
                    "groupCount": 4,
                    "groupId": "bar-quarter-grouped",
                    "groupIndex": 0,
                    "stackCount": 0,
                    "stackIndex": 0,
                  },
                  "shadow": {
                    "blur": 5,
                    "color": "#00000080",
                    "enabled": false,
                    "xOffset": 3,
                    "yOffset": 3,
                  },
                  "showInLegend": true,
                  "stroke": "#2b5c95",
                  "strokeWidth": 0,
                  "tooltip": {
                    "position": {
                      "anchorTo": "pointer",
                      "offset": 12,
                      "xOffset": 0,
                      "yOffset": 0,
                    },
                    "range": "exact",
                  },
                  "type": "bar",
                  "visible": true,
                  "xKey": "quarter",
                  "yKey": "iphone",
                  "yName": "IPhone",
                },
                {
                  "direction": "vertical",
                  "fill": "red",
                  "fillOpacity": 1,
                  "highlight": {
                    "enabled": true,
                    "unhighlightedItem": {
                      "opacity": 0.6,
                    },
                    "unhighlightedSeries": {
                      "opacity": 0.2,
                    },
                  },
                  "label": {
                    "border": {
                      "enabled": false,
                      "stroke": "rgba(24, 29, 31, 0.08)",
                      "strokeWidth": 1,
                    },
                    "collision": {
                      "alwaysShow": true,
                      "collideWith": {
                        "seriesItems": true,
                      },
                      "threshold": 4,
                    },
                    "cornerRadius": 4,
                    "enabled": false,
                    "fontFamily": ""IBM Plex Sans", -apple-system, "system-ui", "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif",
                    "fontSize": 12,
                    "fontWeight": 400,
                    "insideStyle": {
                      "border": {
                        "enabled": false,
                      },
                      "color": "#ffffff",
                    },
                    "outsideStyle": {
                      "border": {
                        "enabled": false,
                      },
                      "color": "#181d1f",
                    },
                    "padding": 8,
                    "placement": "inside-center",
                    "spacing": 8,
                  },
                  "lineDash": [
                    0,
                  ],
                  "lineDashOffset": 0,
                  "segmentation": {
                    "enabled": false,
                    "key": "x",
                  },
                  "selection": {
                    "enabled": false,
                    "selectedItem": {
                      "strokeWidth": 2,
                    },
                    "unselectedItem": {
                      "opacity": 0.6,
                    },
                    "unselectedSeries": {
                      "opacity": 0.2,
                    },
                  },
                  "seriesGrouping": {
                    "groupCount": 4,
                    "groupId": "bar-quarter-grouped",
                    "groupIndex": 1,
                    "stackCount": 0,
                    "stackIndex": 0,
                  },
                  "shadow": {
                    "blur": 5,
                    "color": "#00000080",
                    "enabled": false,
                    "xOffset": 3,
                    "yOffset": 3,
                  },
                  "showInLegend": false,
                  "stroke": "#cc6f10",
                  "strokeWidth": 0,
                  "tooltip": {
                    "position": {
                      "anchorTo": "pointer",
                      "offset": 12,
                      "xOffset": 0,
                      "yOffset": 0,
                    },
                    "range": "exact",
                  },
                  "type": "bar",
                  "visible": true,
                  "xKey": "quarter",
                  "yKey": "mac",
                  "yName": "Mac",
                },
                {
                  "direction": "vertical",
                  "fill": "#459d55",
                  "fillOpacity": 1,
                  "highlight": {
                    "enabled": true,
                    "unhighlightedItem": {
                      "opacity": 0.6,
                    },
                    "unhighlightedSeries": {
                      "opacity": 0.2,
                    },
                  },
                  "label": {
                    "border": {
                      "enabled": false,
                      "stroke": "rgba(24, 29, 31, 0.08)",
                      "strokeWidth": 1,
                    },
                    "collision": {
                      "alwaysShow": true,
                      "collideWith": {
                        "seriesItems": true,
                      },
                      "threshold": 4,
                    },
                    "cornerRadius": 4,
                    "enabled": false,
                    "fontFamily": ""IBM Plex Sans", -apple-system, "system-ui", "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif",
                    "fontSize": 12,
                    "fontWeight": 400,
                    "insideStyle": {
                      "border": {
                        "enabled": false,
                      },
                      "color": "#ffffff",
                    },
                    "outsideStyle": {
                      "border": {
                        "enabled": false,
                      },
                      "color": "#181d1f",
                    },
                    "padding": 8,
                    "placement": "inside-center",
                    "spacing": 8,
                  },
                  "lineDash": [
                    0,
                  ],
                  "lineDashOffset": 0,
                  "segmentation": {
                    "enabled": false,
                    "key": "x",
                  },
                  "selection": {
                    "enabled": false,
                    "selectedItem": {
                      "strokeWidth": 2,
                    },
                    "unselectedItem": {
                      "opacity": 0.6,
                    },
                    "unselectedSeries": {
                      "opacity": 0.2,
                    },
                  },
                  "seriesGrouping": {
                    "groupCount": 4,
                    "groupId": "bar-quarter-grouped",
                    "groupIndex": 2,
                    "stackCount": 0,
                    "stackIndex": 0,
                  },
                  "shadow": {
                    "blur": 5,
                    "color": "#00000080",
                    "enabled": false,
                    "xOffset": 3,
                    "yOffset": 3,
                  },
                  "showInLegend": true,
                  "stroke": "#1e652e",
                  "strokeWidth": 0,
                  "tooltip": {
                    "position": {
                      "anchorTo": "pointer",
                      "offset": 12,
                      "xOffset": 0,
                      "yOffset": 0,
                    },
                    "range": "exact",
                  },
                  "type": "bar",
                  "visible": true,
                  "xKey": "quarter",
                  "yKey": "wearables",
                  "yName": "Wearables",
                },
                {
                  "direction": "vertical",
                  "fill": "#34bfe1",
                  "fillOpacity": 1,
                  "highlight": {
                    "enabled": true,
                    "unhighlightedItem": {
                      "opacity": 0.6,
                    },
                    "unhighlightedSeries": {
                      "opacity": 0.2,
                    },
                  },
                  "label": {
                    "border": {
                      "enabled": false,
                      "stroke": "rgba(24, 29, 31, 0.08)",
                      "strokeWidth": 1,
                    },
                    "collision": {
                      "alwaysShow": true,
                      "collideWith": {
                        "seriesItems": true,
                      },
                      "threshold": 4,
                    },
                    "cornerRadius": 4,
                    "enabled": false,
                    "fontFamily": ""IBM Plex Sans", -apple-system, "system-ui", "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif",
                    "fontSize": 12,
                    "fontWeight": 400,
                    "insideStyle": {
                      "border": {
                        "enabled": false,
                      },
                      "color": "#ffffff",
                    },
                    "outsideStyle": {
                      "border": {
                        "enabled": false,
                      },
                      "color": "#181d1f",
                    },
                    "padding": 8,
                    "placement": "inside-center",
                    "spacing": 8,
                  },
                  "lineDash": [
                    0,
                  ],
                  "lineDashOffset": 0,
                  "segmentation": {
                    "enabled": false,
                    "key": "x",
                  },
                  "selection": {
                    "enabled": false,
                    "selectedItem": {
                      "strokeWidth": 2,
                    },
                    "unselectedItem": {
                      "opacity": 0.6,
                    },
                    "unselectedSeries": {
                      "opacity": 0.2,
                    },
                  },
                  "seriesGrouping": {
                    "groupCount": 4,
                    "groupId": "bar-quarter-grouped",
                    "groupIndex": 3,
                    "stackCount": 0,
                    "stackIndex": 0,
                  },
                  "shadow": {
                    "blur": 5,
                    "color": "#00000080",
                    "enabled": false,
                    "xOffset": 3,
                    "yOffset": 3,
                  },
                  "showInLegend": false,
                  "stroke": "#18859e",
                  "strokeWidth": 0,
                  "tooltip": {
                    "position": {
                      "anchorTo": "pointer",
                      "offset": 12,
                      "xOffset": 0,
                      "yOffset": 0,
                    },
                    "range": "exact",
                  },
                  "type": "bar",
                  "visible": true,
                  "xKey": "quarter",
                  "yKey": "services",
                  "yName": "Services",
                },
                {
                  "highlight": {
                    "enabled": true,
                    "unhighlightedSeries": {
                      "opacity": 0.2,
                    },
                  },
                  "interpolation": {
                    "type": "linear",
                  },
                  "label": {
                    "border": {
                      "enabled": false,
                      "stroke": "rgba(24, 29, 31, 0.08)",
                      "strokeWidth": 1,
                    },
                    "collision": {
                      "alwaysShow": true,
                    },
                    "cornerRadius": 4,
                    "enabled": false,
                    "fontFamily": ""IBM Plex Sans", -apple-system, "system-ui", "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif",
                    "fontSize": 12,
                    "fontWeight": 400,
                    "insideStyle": {
                      "border": {
                        "enabled": false,
                      },
                      "color": "#ffffff",
                    },
                    "outsideStyle": {
                      "border": {
                        "enabled": false,
                      },
                      "color": "#181d1f",
                    },
                    "padding": 8,
                    "placement": "top",
                  },
                  "lineDash": [
                    0,
                  ],
                  "lineDashOffset": 0,
                  "marker": {
                    "fill": "#e1cc00",
                    "shape": "circle",
                    "size": 7,
                    "stroke": "#a69400",
                    "strokeWidth": 0,
                  },
                  "segmentation": {
                    "enabled": false,
                    "key": "x",
                  },
                  "selection": {
                    "enabled": false,
                    "selectedItem": {
                      "strokeWidth": 2,
                    },
                    "unselectedItem": {
                      "opacity": 0.6,
                    },
                    "unselectedSeries": {
                      "opacity": 0.2,
                    },
                  },
                  "stroke": "#e1cc00",
                  "strokeOpacity": 1,
                  "strokeWidth": 2,
                  "tooltip": {
                    "position": {
                      "anchorTo": "node",
                      "offset": 12,
                      "xOffset": 0,
                      "yOffset": 0,
                    },
                    "range": "nearest",
                  },
                  "type": "line",
                  "visible": true,
                  "xKey": "quarter",
                  "yKey": "mac",
                  "yName": "Mac",
                },
                {
                  "highlight": {
                    "enabled": true,
                    "unhighlightedSeries": {
                      "opacity": 0.2,
                    },
                  },
                  "interpolation": {
                    "type": "linear",
                  },
                  "label": {
                    "border": {
                      "enabled": false,
                      "stroke": "rgba(24, 29, 31, 0.08)",
                      "strokeWidth": 1,
                    },
                    "collision": {
                      "alwaysShow": true,
                    },
                    "cornerRadius": 4,
                    "enabled": false,
                    "fontFamily": ""IBM Plex Sans", -apple-system, "system-ui", "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif",
                    "fontSize": 12,
                    "fontWeight": 400,
                    "insideStyle": {
                      "border": {
                        "enabled": false,
                      },
                      "color": "#ffffff",
                    },
                    "outsideStyle": {
                      "border": {
                        "enabled": false,
                      },
                      "color": "#181d1f",
                    },
                    "padding": 8,
                    "placement": "top",
                  },
                  "lineDash": [
                    0,
                  ],
                  "lineDashOffset": 0,
                  "marker": {
                    "fill": "#9669cb",
                    "shape": "circle",
                    "size": 7,
                    "stroke": "#603c88",
                    "strokeWidth": 0,
                  },
                  "segmentation": {
                    "enabled": false,
                    "key": "x",
                  },
                  "selection": {
                    "enabled": false,
                    "selectedItem": {
                      "strokeWidth": 2,
                    },
                    "unselectedItem": {
                      "opacity": 0.6,
                    },
                    "unselectedSeries": {
                      "opacity": 0.2,
                    },
                  },
                  "stroke": "#9669cb",
                  "strokeOpacity": 1,
                  "strokeWidth": 2,
                  "tooltip": {
                    "position": {
                      "anchorTo": "node",
                      "offset": 12,
                      "xOffset": 0,
                      "yOffset": 0,
                    },
                    "range": "nearest",
                  },
                  "type": "line",
                  "visible": true,
                  "xKey": "quarter",
                  "yKey": "iphone",
                  "yName": "IPhone",
                },
              ]
            `);
        });

        test('Series options with grouped columns processing works as expected', () => {
            const { series: options } = prepareOptions({
                series: seriesOptions.map((s) => (s.type === 'bar' ? { ...s, grouped: true } : s)),
            });

            expect(options).toMatchInlineSnapshot(`
              [
                {
                  "direction": "vertical",
                  "fill": "pink",
                  "fillOpacity": 1,
                  "highlight": {
                    "enabled": true,
                    "unhighlightedItem": {
                      "opacity": 0.6,
                    },
                    "unhighlightedSeries": {
                      "opacity": 0.2,
                    },
                  },
                  "label": {
                    "border": {
                      "enabled": false,
                      "stroke": "rgba(24, 29, 31, 0.08)",
                      "strokeWidth": 1,
                    },
                    "collision": {
                      "alwaysShow": true,
                      "collideWith": {
                        "seriesItems": true,
                      },
                      "threshold": 4,
                    },
                    "cornerRadius": 4,
                    "enabled": false,
                    "fontFamily": ""IBM Plex Sans", -apple-system, "system-ui", "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif",
                    "fontSize": 12,
                    "fontWeight": 400,
                    "insideStyle": {
                      "border": {
                        "enabled": false,
                      },
                      "color": "#ffffff",
                    },
                    "outsideStyle": {
                      "border": {
                        "enabled": false,
                      },
                      "color": "#181d1f",
                    },
                    "padding": 8,
                    "placement": "inside-center",
                    "spacing": 8,
                  },
                  "lineDash": [
                    0,
                  ],
                  "lineDashOffset": 0,
                  "segmentation": {
                    "enabled": false,
                    "key": "x",
                  },
                  "selection": {
                    "enabled": false,
                    "selectedItem": {
                      "strokeWidth": 2,
                    },
                    "unselectedItem": {
                      "opacity": 0.6,
                    },
                    "unselectedSeries": {
                      "opacity": 0.2,
                    },
                  },
                  "seriesGrouping": {
                    "groupCount": 4,
                    "groupId": "bar-quarter-grouped",
                    "groupIndex": 0,
                    "stackCount": 0,
                    "stackIndex": 0,
                  },
                  "shadow": {
                    "blur": 5,
                    "color": "#00000080",
                    "enabled": false,
                    "xOffset": 3,
                    "yOffset": 3,
                  },
                  "showInLegend": true,
                  "stroke": "#2b5c95",
                  "strokeWidth": 0,
                  "tooltip": {
                    "position": {
                      "anchorTo": "pointer",
                      "offset": 12,
                      "xOffset": 0,
                      "yOffset": 0,
                    },
                    "range": "exact",
                  },
                  "type": "bar",
                  "visible": true,
                  "xKey": "quarter",
                  "yKey": "iphone",
                  "yName": "IPhone",
                },
                {
                  "direction": "vertical",
                  "fill": "red",
                  "fillOpacity": 1,
                  "highlight": {
                    "enabled": true,
                    "unhighlightedItem": {
                      "opacity": 0.6,
                    },
                    "unhighlightedSeries": {
                      "opacity": 0.2,
                    },
                  },
                  "label": {
                    "border": {
                      "enabled": false,
                      "stroke": "rgba(24, 29, 31, 0.08)",
                      "strokeWidth": 1,
                    },
                    "collision": {
                      "alwaysShow": true,
                      "collideWith": {
                        "seriesItems": true,
                      },
                      "threshold": 4,
                    },
                    "cornerRadius": 4,
                    "enabled": false,
                    "fontFamily": ""IBM Plex Sans", -apple-system, "system-ui", "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif",
                    "fontSize": 12,
                    "fontWeight": 400,
                    "insideStyle": {
                      "border": {
                        "enabled": false,
                      },
                      "color": "#ffffff",
                    },
                    "outsideStyle": {
                      "border": {
                        "enabled": false,
                      },
                      "color": "#181d1f",
                    },
                    "padding": 8,
                    "placement": "inside-center",
                    "spacing": 8,
                  },
                  "lineDash": [
                    0,
                  ],
                  "lineDashOffset": 0,
                  "segmentation": {
                    "enabled": false,
                    "key": "x",
                  },
                  "selection": {
                    "enabled": false,
                    "selectedItem": {
                      "strokeWidth": 2,
                    },
                    "unselectedItem": {
                      "opacity": 0.6,
                    },
                    "unselectedSeries": {
                      "opacity": 0.2,
                    },
                  },
                  "seriesGrouping": {
                    "groupCount": 4,
                    "groupId": "bar-quarter-grouped",
                    "groupIndex": 1,
                    "stackCount": 0,
                    "stackIndex": 0,
                  },
                  "shadow": {
                    "blur": 5,
                    "color": "#00000080",
                    "enabled": false,
                    "xOffset": 3,
                    "yOffset": 3,
                  },
                  "showInLegend": false,
                  "stroke": "#cc6f10",
                  "strokeWidth": 0,
                  "tooltip": {
                    "position": {
                      "anchorTo": "pointer",
                      "offset": 12,
                      "xOffset": 0,
                      "yOffset": 0,
                    },
                    "range": "exact",
                  },
                  "type": "bar",
                  "visible": true,
                  "xKey": "quarter",
                  "yKey": "mac",
                  "yName": "Mac",
                },
                {
                  "direction": "vertical",
                  "fill": "#459d55",
                  "fillOpacity": 1,
                  "highlight": {
                    "enabled": true,
                    "unhighlightedItem": {
                      "opacity": 0.6,
                    },
                    "unhighlightedSeries": {
                      "opacity": 0.2,
                    },
                  },
                  "label": {
                    "border": {
                      "enabled": false,
                      "stroke": "rgba(24, 29, 31, 0.08)",
                      "strokeWidth": 1,
                    },
                    "collision": {
                      "alwaysShow": true,
                      "collideWith": {
                        "seriesItems": true,
                      },
                      "threshold": 4,
                    },
                    "cornerRadius": 4,
                    "enabled": false,
                    "fontFamily": ""IBM Plex Sans", -apple-system, "system-ui", "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif",
                    "fontSize": 12,
                    "fontWeight": 400,
                    "insideStyle": {
                      "border": {
                        "enabled": false,
                      },
                      "color": "#ffffff",
                    },
                    "outsideStyle": {
                      "border": {
                        "enabled": false,
                      },
                      "color": "#181d1f",
                    },
                    "padding": 8,
                    "placement": "inside-center",
                    "spacing": 8,
                  },
                  "lineDash": [
                    0,
                  ],
                  "lineDashOffset": 0,
                  "segmentation": {
                    "enabled": false,
                    "key": "x",
                  },
                  "selection": {
                    "enabled": false,
                    "selectedItem": {
                      "strokeWidth": 2,
                    },
                    "unselectedItem": {
                      "opacity": 0.6,
                    },
                    "unselectedSeries": {
                      "opacity": 0.2,
                    },
                  },
                  "seriesGrouping": {
                    "groupCount": 4,
                    "groupId": "bar-quarter-grouped",
                    "groupIndex": 2,
                    "stackCount": 0,
                    "stackIndex": 0,
                  },
                  "shadow": {
                    "blur": 5,
                    "color": "#00000080",
                    "enabled": false,
                    "xOffset": 3,
                    "yOffset": 3,
                  },
                  "showInLegend": true,
                  "stroke": "#1e652e",
                  "strokeWidth": 0,
                  "tooltip": {
                    "position": {
                      "anchorTo": "pointer",
                      "offset": 12,
                      "xOffset": 0,
                      "yOffset": 0,
                    },
                    "range": "exact",
                  },
                  "type": "bar",
                  "visible": true,
                  "xKey": "quarter",
                  "yKey": "wearables",
                  "yName": "Wearables",
                },
                {
                  "direction": "vertical",
                  "fill": "#34bfe1",
                  "fillOpacity": 1,
                  "highlight": {
                    "enabled": true,
                    "unhighlightedItem": {
                      "opacity": 0.6,
                    },
                    "unhighlightedSeries": {
                      "opacity": 0.2,
                    },
                  },
                  "label": {
                    "border": {
                      "enabled": false,
                      "stroke": "rgba(24, 29, 31, 0.08)",
                      "strokeWidth": 1,
                    },
                    "collision": {
                      "alwaysShow": true,
                      "collideWith": {
                        "seriesItems": true,
                      },
                      "threshold": 4,
                    },
                    "cornerRadius": 4,
                    "enabled": false,
                    "fontFamily": ""IBM Plex Sans", -apple-system, "system-ui", "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif",
                    "fontSize": 12,
                    "fontWeight": 400,
                    "insideStyle": {
                      "border": {
                        "enabled": false,
                      },
                      "color": "#ffffff",
                    },
                    "outsideStyle": {
                      "border": {
                        "enabled": false,
                      },
                      "color": "#181d1f",
                    },
                    "padding": 8,
                    "placement": "inside-center",
                    "spacing": 8,
                  },
                  "lineDash": [
                    0,
                  ],
                  "lineDashOffset": 0,
                  "segmentation": {
                    "enabled": false,
                    "key": "x",
                  },
                  "selection": {
                    "enabled": false,
                    "selectedItem": {
                      "strokeWidth": 2,
                    },
                    "unselectedItem": {
                      "opacity": 0.6,
                    },
                    "unselectedSeries": {
                      "opacity": 0.2,
                    },
                  },
                  "seriesGrouping": {
                    "groupCount": 4,
                    "groupId": "bar-quarter-grouped",
                    "groupIndex": 3,
                    "stackCount": 0,
                    "stackIndex": 0,
                  },
                  "shadow": {
                    "blur": 5,
                    "color": "#00000080",
                    "enabled": false,
                    "xOffset": 3,
                    "yOffset": 3,
                  },
                  "showInLegend": false,
                  "stroke": "#18859e",
                  "strokeWidth": 0,
                  "tooltip": {
                    "position": {
                      "anchorTo": "pointer",
                      "offset": 12,
                      "xOffset": 0,
                      "yOffset": 0,
                    },
                    "range": "exact",
                  },
                  "type": "bar",
                  "visible": true,
                  "xKey": "quarter",
                  "yKey": "services",
                  "yName": "Services",
                },
                {
                  "highlight": {
                    "enabled": true,
                    "unhighlightedSeries": {
                      "opacity": 0.2,
                    },
                  },
                  "interpolation": {
                    "type": "linear",
                  },
                  "label": {
                    "border": {
                      "enabled": false,
                      "stroke": "rgba(24, 29, 31, 0.08)",
                      "strokeWidth": 1,
                    },
                    "collision": {
                      "alwaysShow": true,
                    },
                    "cornerRadius": 4,
                    "enabled": false,
                    "fontFamily": ""IBM Plex Sans", -apple-system, "system-ui", "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif",
                    "fontSize": 12,
                    "fontWeight": 400,
                    "insideStyle": {
                      "border": {
                        "enabled": false,
                      },
                      "color": "#ffffff",
                    },
                    "outsideStyle": {
                      "border": {
                        "enabled": false,
                      },
                      "color": "#181d1f",
                    },
                    "padding": 8,
                    "placement": "top",
                  },
                  "lineDash": [
                    0,
                  ],
                  "lineDashOffset": 0,
                  "marker": {
                    "fill": "#e1cc00",
                    "shape": "circle",
                    "size": 7,
                    "stroke": "#a69400",
                    "strokeWidth": 0,
                  },
                  "segmentation": {
                    "enabled": false,
                    "key": "x",
                  },
                  "selection": {
                    "enabled": false,
                    "selectedItem": {
                      "strokeWidth": 2,
                    },
                    "unselectedItem": {
                      "opacity": 0.6,
                    },
                    "unselectedSeries": {
                      "opacity": 0.2,
                    },
                  },
                  "stroke": "#e1cc00",
                  "strokeOpacity": 1,
                  "strokeWidth": 2,
                  "tooltip": {
                    "position": {
                      "anchorTo": "node",
                      "offset": 12,
                      "xOffset": 0,
                      "yOffset": 0,
                    },
                    "range": "nearest",
                  },
                  "type": "line",
                  "visible": true,
                  "xKey": "quarter",
                  "yKey": "mac",
                  "yName": "Mac",
                },
                {
                  "highlight": {
                    "enabled": true,
                    "unhighlightedSeries": {
                      "opacity": 0.2,
                    },
                  },
                  "interpolation": {
                    "type": "linear",
                  },
                  "label": {
                    "border": {
                      "enabled": false,
                      "stroke": "rgba(24, 29, 31, 0.08)",
                      "strokeWidth": 1,
                    },
                    "collision": {
                      "alwaysShow": true,
                    },
                    "cornerRadius": 4,
                    "enabled": false,
                    "fontFamily": ""IBM Plex Sans", -apple-system, "system-ui", "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif",
                    "fontSize": 12,
                    "fontWeight": 400,
                    "insideStyle": {
                      "border": {
                        "enabled": false,
                      },
                      "color": "#ffffff",
                    },
                    "outsideStyle": {
                      "border": {
                        "enabled": false,
                      },
                      "color": "#181d1f",
                    },
                    "padding": 8,
                    "placement": "top",
                  },
                  "lineDash": [
                    0,
                  ],
                  "lineDashOffset": 0,
                  "marker": {
                    "fill": "#9669cb",
                    "shape": "circle",
                    "size": 7,
                    "stroke": "#603c88",
                    "strokeWidth": 0,
                  },
                  "segmentation": {
                    "enabled": false,
                    "key": "x",
                  },
                  "selection": {
                    "enabled": false,
                    "selectedItem": {
                      "strokeWidth": 2,
                    },
                    "unselectedItem": {
                      "opacity": 0.6,
                    },
                    "unselectedSeries": {
                      "opacity": 0.2,
                    },
                  },
                  "stroke": "#9669cb",
                  "strokeOpacity": 1,
                  "strokeWidth": 2,
                  "tooltip": {
                    "position": {
                      "anchorTo": "node",
                      "offset": 12,
                      "xOffset": 0,
                      "yOffset": 0,
                    },
                    "range": "nearest",
                  },
                  "type": "line",
                  "visible": true,
                  "xKey": "quarter",
                  "yKey": "iphone",
                  "yName": "IPhone",
                },
              ]
            `);
        });

        test('Series options with stacked columns processing works as expected', () => {
            const { series: options } = prepareOptions({
                series: seriesOptions.map((s) => (s.type === 'bar' ? { ...s, stacked: true, grouped: undefined } : s)),
            });

            expect(options).toMatchInlineSnapshot(`
              [
                {
                  "direction": "vertical",
                  "fill": "pink",
                  "fillOpacity": 1,
                  "highlight": {
                    "enabled": true,
                    "unhighlightedItem": {
                      "opacity": 0.6,
                    },
                    "unhighlightedSeries": {
                      "opacity": 0.2,
                    },
                  },
                  "label": {
                    "border": {
                      "enabled": false,
                      "stroke": "rgba(24, 29, 31, 0.08)",
                      "strokeWidth": 1,
                    },
                    "collision": {
                      "alwaysShow": true,
                      "collideWith": {
                        "seriesItems": true,
                      },
                      "threshold": 4,
                    },
                    "cornerRadius": 4,
                    "enabled": false,
                    "fontFamily": ""IBM Plex Sans", -apple-system, "system-ui", "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif",
                    "fontSize": 12,
                    "fontWeight": 400,
                    "insideStyle": {
                      "border": {
                        "enabled": false,
                      },
                      "color": "#ffffff",
                    },
                    "outsideStyle": {
                      "border": {
                        "enabled": false,
                      },
                      "color": "#181d1f",
                    },
                    "padding": 8,
                    "placement": "inside-center",
                    "spacing": 8,
                  },
                  "lineDash": [
                    0,
                  ],
                  "lineDashOffset": 0,
                  "segmentation": {
                    "enabled": false,
                    "key": "x",
                  },
                  "selection": {
                    "enabled": false,
                    "selectedItem": {
                      "strokeWidth": 2,
                    },
                    "unselectedItem": {
                      "opacity": 0.6,
                    },
                    "unselectedSeries": {
                      "opacity": 0.2,
                    },
                  },
                  "seriesGrouping": {
                    "groupCount": 1,
                    "groupId": "bar-quarter-stacked",
                    "groupIndex": 0,
                    "stackCount": 4,
                    "stackIndex": 0,
                  },
                  "shadow": {
                    "blur": 5,
                    "color": "#00000080",
                    "enabled": false,
                    "xOffset": 3,
                    "yOffset": 3,
                  },
                  "showInLegend": true,
                  "stroke": "#2b5c95",
                  "strokeWidth": 0,
                  "tooltip": {
                    "position": {
                      "anchorTo": "pointer",
                      "offset": 12,
                      "xOffset": 0,
                      "yOffset": 0,
                    },
                    "range": "exact",
                  },
                  "type": "bar",
                  "visible": true,
                  "xKey": "quarter",
                  "yKey": "iphone",
                  "yName": "IPhone",
                },
                {
                  "direction": "vertical",
                  "fill": "red",
                  "fillOpacity": 1,
                  "highlight": {
                    "enabled": true,
                    "unhighlightedItem": {
                      "opacity": 0.6,
                    },
                    "unhighlightedSeries": {
                      "opacity": 0.2,
                    },
                  },
                  "label": {
                    "border": {
                      "enabled": false,
                      "stroke": "rgba(24, 29, 31, 0.08)",
                      "strokeWidth": 1,
                    },
                    "collision": {
                      "alwaysShow": true,
                      "collideWith": {
                        "seriesItems": true,
                      },
                      "threshold": 4,
                    },
                    "cornerRadius": 4,
                    "enabled": false,
                    "fontFamily": ""IBM Plex Sans", -apple-system, "system-ui", "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif",
                    "fontSize": 12,
                    "fontWeight": 400,
                    "insideStyle": {
                      "border": {
                        "enabled": false,
                      },
                      "color": "#ffffff",
                    },
                    "outsideStyle": {
                      "border": {
                        "enabled": false,
                      },
                      "color": "#181d1f",
                    },
                    "padding": 8,
                    "placement": "inside-center",
                    "spacing": 8,
                  },
                  "lineDash": [
                    0,
                  ],
                  "lineDashOffset": 0,
                  "segmentation": {
                    "enabled": false,
                    "key": "x",
                  },
                  "selection": {
                    "enabled": false,
                    "selectedItem": {
                      "strokeWidth": 2,
                    },
                    "unselectedItem": {
                      "opacity": 0.6,
                    },
                    "unselectedSeries": {
                      "opacity": 0.2,
                    },
                  },
                  "seriesGrouping": {
                    "groupCount": 1,
                    "groupId": "bar-quarter-stacked",
                    "groupIndex": 0,
                    "stackCount": 4,
                    "stackIndex": 1,
                  },
                  "shadow": {
                    "blur": 5,
                    "color": "#00000080",
                    "enabled": false,
                    "xOffset": 3,
                    "yOffset": 3,
                  },
                  "showInLegend": false,
                  "stroke": "#cc6f10",
                  "strokeWidth": 0,
                  "tooltip": {
                    "position": {
                      "anchorTo": "pointer",
                      "offset": 12,
                      "xOffset": 0,
                      "yOffset": 0,
                    },
                    "range": "exact",
                  },
                  "type": "bar",
                  "visible": true,
                  "xKey": "quarter",
                  "yKey": "mac",
                  "yName": "Mac",
                },
                {
                  "direction": "vertical",
                  "fill": "#459d55",
                  "fillOpacity": 1,
                  "highlight": {
                    "enabled": true,
                    "unhighlightedItem": {
                      "opacity": 0.6,
                    },
                    "unhighlightedSeries": {
                      "opacity": 0.2,
                    },
                  },
                  "label": {
                    "border": {
                      "enabled": false,
                      "stroke": "rgba(24, 29, 31, 0.08)",
                      "strokeWidth": 1,
                    },
                    "collision": {
                      "alwaysShow": true,
                      "collideWith": {
                        "seriesItems": true,
                      },
                      "threshold": 4,
                    },
                    "cornerRadius": 4,
                    "enabled": false,
                    "fontFamily": ""IBM Plex Sans", -apple-system, "system-ui", "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif",
                    "fontSize": 12,
                    "fontWeight": 400,
                    "insideStyle": {
                      "border": {
                        "enabled": false,
                      },
                      "color": "#ffffff",
                    },
                    "outsideStyle": {
                      "border": {
                        "enabled": false,
                      },
                      "color": "#181d1f",
                    },
                    "padding": 8,
                    "placement": "inside-center",
                    "spacing": 8,
                  },
                  "lineDash": [
                    0,
                  ],
                  "lineDashOffset": 0,
                  "segmentation": {
                    "enabled": false,
                    "key": "x",
                  },
                  "selection": {
                    "enabled": false,
                    "selectedItem": {
                      "strokeWidth": 2,
                    },
                    "unselectedItem": {
                      "opacity": 0.6,
                    },
                    "unselectedSeries": {
                      "opacity": 0.2,
                    },
                  },
                  "seriesGrouping": {
                    "groupCount": 1,
                    "groupId": "bar-quarter-stacked",
                    "groupIndex": 0,
                    "stackCount": 4,
                    "stackIndex": 2,
                  },
                  "shadow": {
                    "blur": 5,
                    "color": "#00000080",
                    "enabled": false,
                    "xOffset": 3,
                    "yOffset": 3,
                  },
                  "showInLegend": true,
                  "stroke": "#1e652e",
                  "strokeWidth": 0,
                  "tooltip": {
                    "position": {
                      "anchorTo": "pointer",
                      "offset": 12,
                      "xOffset": 0,
                      "yOffset": 0,
                    },
                    "range": "exact",
                  },
                  "type": "bar",
                  "visible": true,
                  "xKey": "quarter",
                  "yKey": "wearables",
                  "yName": "Wearables",
                },
                {
                  "direction": "vertical",
                  "fill": "#34bfe1",
                  "fillOpacity": 1,
                  "highlight": {
                    "enabled": true,
                    "unhighlightedItem": {
                      "opacity": 0.6,
                    },
                    "unhighlightedSeries": {
                      "opacity": 0.2,
                    },
                  },
                  "label": {
                    "border": {
                      "enabled": false,
                      "stroke": "rgba(24, 29, 31, 0.08)",
                      "strokeWidth": 1,
                    },
                    "collision": {
                      "alwaysShow": true,
                      "collideWith": {
                        "seriesItems": true,
                      },
                      "threshold": 4,
                    },
                    "cornerRadius": 4,
                    "enabled": false,
                    "fontFamily": ""IBM Plex Sans", -apple-system, "system-ui", "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif",
                    "fontSize": 12,
                    "fontWeight": 400,
                    "insideStyle": {
                      "border": {
                        "enabled": false,
                      },
                      "color": "#ffffff",
                    },
                    "outsideStyle": {
                      "border": {
                        "enabled": false,
                      },
                      "color": "#181d1f",
                    },
                    "padding": 8,
                    "placement": "inside-center",
                    "spacing": 8,
                  },
                  "lineDash": [
                    0,
                  ],
                  "lineDashOffset": 0,
                  "segmentation": {
                    "enabled": false,
                    "key": "x",
                  },
                  "selection": {
                    "enabled": false,
                    "selectedItem": {
                      "strokeWidth": 2,
                    },
                    "unselectedItem": {
                      "opacity": 0.6,
                    },
                    "unselectedSeries": {
                      "opacity": 0.2,
                    },
                  },
                  "seriesGrouping": {
                    "groupCount": 1,
                    "groupId": "bar-quarter-stacked",
                    "groupIndex": 0,
                    "stackCount": 4,
                    "stackIndex": 3,
                  },
                  "shadow": {
                    "blur": 5,
                    "color": "#00000080",
                    "enabled": false,
                    "xOffset": 3,
                    "yOffset": 3,
                  },
                  "showInLegend": false,
                  "stroke": "#18859e",
                  "strokeWidth": 0,
                  "tooltip": {
                    "position": {
                      "anchorTo": "pointer",
                      "offset": 12,
                      "xOffset": 0,
                      "yOffset": 0,
                    },
                    "range": "exact",
                  },
                  "type": "bar",
                  "visible": true,
                  "xKey": "quarter",
                  "yKey": "services",
                  "yName": "Services",
                },
                {
                  "highlight": {
                    "enabled": true,
                    "unhighlightedSeries": {
                      "opacity": 0.2,
                    },
                  },
                  "interpolation": {
                    "type": "linear",
                  },
                  "label": {
                    "border": {
                      "enabled": false,
                      "stroke": "rgba(24, 29, 31, 0.08)",
                      "strokeWidth": 1,
                    },
                    "collision": {
                      "alwaysShow": true,
                    },
                    "cornerRadius": 4,
                    "enabled": false,
                    "fontFamily": ""IBM Plex Sans", -apple-system, "system-ui", "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif",
                    "fontSize": 12,
                    "fontWeight": 400,
                    "insideStyle": {
                      "border": {
                        "enabled": false,
                      },
                      "color": "#ffffff",
                    },
                    "outsideStyle": {
                      "border": {
                        "enabled": false,
                      },
                      "color": "#181d1f",
                    },
                    "padding": 8,
                    "placement": "top",
                  },
                  "lineDash": [
                    0,
                  ],
                  "lineDashOffset": 0,
                  "marker": {
                    "fill": "#e1cc00",
                    "shape": "circle",
                    "size": 7,
                    "stroke": "#a69400",
                    "strokeWidth": 0,
                  },
                  "segmentation": {
                    "enabled": false,
                    "key": "x",
                  },
                  "selection": {
                    "enabled": false,
                    "selectedItem": {
                      "strokeWidth": 2,
                    },
                    "unselectedItem": {
                      "opacity": 0.6,
                    },
                    "unselectedSeries": {
                      "opacity": 0.2,
                    },
                  },
                  "stroke": "#e1cc00",
                  "strokeOpacity": 1,
                  "strokeWidth": 2,
                  "tooltip": {
                    "position": {
                      "anchorTo": "node",
                      "offset": 12,
                      "xOffset": 0,
                      "yOffset": 0,
                    },
                    "range": "nearest",
                  },
                  "type": "line",
                  "visible": true,
                  "xKey": "quarter",
                  "yKey": "mac",
                  "yName": "Mac",
                },
                {
                  "highlight": {
                    "enabled": true,
                    "unhighlightedSeries": {
                      "opacity": 0.2,
                    },
                  },
                  "interpolation": {
                    "type": "linear",
                  },
                  "label": {
                    "border": {
                      "enabled": false,
                      "stroke": "rgba(24, 29, 31, 0.08)",
                      "strokeWidth": 1,
                    },
                    "collision": {
                      "alwaysShow": true,
                    },
                    "cornerRadius": 4,
                    "enabled": false,
                    "fontFamily": ""IBM Plex Sans", -apple-system, "system-ui", "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif",
                    "fontSize": 12,
                    "fontWeight": 400,
                    "insideStyle": {
                      "border": {
                        "enabled": false,
                      },
                      "color": "#ffffff",
                    },
                    "outsideStyle": {
                      "border": {
                        "enabled": false,
                      },
                      "color": "#181d1f",
                    },
                    "padding": 8,
                    "placement": "top",
                  },
                  "lineDash": [
                    0,
                  ],
                  "lineDashOffset": 0,
                  "marker": {
                    "fill": "#9669cb",
                    "shape": "circle",
                    "size": 7,
                    "stroke": "#603c88",
                    "strokeWidth": 0,
                  },
                  "segmentation": {
                    "enabled": false,
                    "key": "x",
                  },
                  "selection": {
                    "enabled": false,
                    "selectedItem": {
                      "strokeWidth": 2,
                    },
                    "unselectedItem": {
                      "opacity": 0.6,
                    },
                    "unselectedSeries": {
                      "opacity": 0.2,
                    },
                  },
                  "stroke": "#9669cb",
                  "strokeOpacity": 1,
                  "strokeWidth": 2,
                  "tooltip": {
                    "position": {
                      "anchorTo": "node",
                      "offset": 12,
                      "xOffset": 0,
                      "yOffset": 0,
                    },
                    "range": "nearest",
                  },
                  "type": "line",
                  "visible": true,
                  "xKey": "quarter",
                  "yKey": "iphone",
                  "yName": "IPhone",
                },
              ]
            `);
        });

        describe('Stacking and grouping configuration combinations', () => {
            const seriesTypes: {
                [K in SeriesType]?: { stackable: boolean; groupable: boolean; stackedByDefault: boolean };
            } = {
                area: { stackable: true, groupable: false, stackedByDefault: false },
                bar: { stackable: true, groupable: true, stackedByDefault: false },
                line: { stackable: true, groupable: false, stackedByDefault: false },
                nightingale: { stackable: true, groupable: true, stackedByDefault: true },
                'range-bar': { stackable: false, groupable: true, stackedByDefault: false },
            };

            for (const [seriesType, { stackable, groupable, stackedByDefault }] of Object.entries(seriesTypes)) {
                ModuleRegistry.register({
                    type: 'series',
                    name: seriesType,
                    chartType: 'cartesian',
                    version: VERSION,
                    stackable,
                    groupable,
                    stackedByDefault,
                } as any);
            }

            it.each(Object.keys(seriesTypes))(
                "handle stacked property 'true' for series type [%s] appropriately",
                (seriesType) => {
                    const testOptions = getSeriesOptions(seriesType, (s) => ({ ...s, stacked: true }));
                    const options = prepareOptions({ series: testOptions });
                    const { stackable, groupable } = seriesTypes[seriesType as SeriesType]!;

                    for (const series of options.series) {
                        expect(series.stacked).toBe(undefined);
                        expect(series.grouped).toBe(undefined);

                        if (stackable) {
                            expect(console.warn).not.toHaveBeenCalled();
                            expect(series.seriesGrouping).toMatchSnapshot({
                                groupIndex: expect.any(Number),
                                groupCount: expect.any(Number),
                                stackIndex: expect.any(Number),
                                stackCount: expect.any(Number),
                            });
                        } else {
                            expect(console.warn).toHaveBeenCalledWith(
                                `AG Charts - unsupported stacking of series type "${seriesType}".`
                            );
                            if (groupable) {
                                expect(series.seriesGrouping).toMatchSnapshot({
                                    groupIndex: expect.any(Number),
                                    groupCount: expect.any(Number),
                                    stackIndex: expect.any(Number),
                                    stackCount: expect.any(Number),
                                });
                            } else {
                                expect(series.seriesGrouping).toBe(undefined);
                            }
                        }
                    }
                }
            );

            it.each(Object.keys(seriesTypes))(
                "handle stacked property 'false' for series type [%s] appropriately",
                (seriesType) => {
                    const testOptions = getSeriesOptions(seriesType, (s) => ({ ...s, stacked: false }));
                    const options = prepareOptions({ series: testOptions });
                    const { groupable } = seriesTypes[seriesType as SeriesType]!;

                    for (const series of options.series) {
                        expect(series.stacked).toBe(undefined);
                        expect(series.grouped).toBe(undefined);
                        expect(console.warn).not.toHaveBeenCalled();

                        if (groupable) {
                            expect(series.seriesGrouping).toMatchSnapshot({
                                groupIndex: expect.any(Number),
                                groupCount: expect.any(Number),
                                stackIndex: 0,
                                stackCount: 0,
                            });
                        } else {
                            expect(series.seriesGrouping).toBe(undefined);
                        }
                    }
                }
            );

            it.each(Object.keys(seriesTypes))(
                'handle omitted stacked property for series type [%s] appropriately',
                (seriesType) => {
                    const testOptions = getSeriesOptions(seriesType, (s) => ({ ...s, stacked: undefined }));
                    const options = prepareOptions({ series: testOptions });
                    const { stackable, stackedByDefault, groupable } = seriesTypes[seriesType as SeriesType]!;

                    for (const series of options.series) {
                        expect(series.stacked).toBe(undefined);
                        expect(series.grouped).toBe(undefined);
                        expect(console.warn).not.toHaveBeenCalled();

                        if (stackable && stackedByDefault) {
                            expect(series.seriesGrouping).toMatchSnapshot({
                                groupIndex: expect.any(Number),
                                groupCount: expect.any(Number),
                                stackIndex: expect.any(Number),
                                stackCount: expect.any(Number),
                            });
                        } else if (groupable) {
                            expect(series.seriesGrouping).toMatchSnapshot({
                                groupIndex: expect.any(Number),
                                groupCount: expect.any(Number),
                                stackIndex: 0,
                                stackCount: 0,
                            });
                        } else {
                            expect(series.seriesGrouping).toBe(undefined);
                        }
                    }
                }
            );

            it.each(Object.keys(seriesTypes))(
                "handle grouped property 'true' for series type [%s] appropriately",
                (seriesType) => {
                    const testOptions = getSeriesOptions(seriesType, (s) => ({ ...s, grouped: true }));
                    const options = prepareOptions({ series: testOptions });
                    const { groupable } = seriesTypes[seriesType as SeriesType]!;

                    for (const series of options.series) {
                        expect(series.stacked).toBe(undefined);
                        expect(series.grouped).toBe(undefined);

                        if (groupable) {
                            expect(console.warn).not.toHaveBeenCalled();
                            expect(series.seriesGrouping).toMatchSnapshot({
                                groupIndex: expect.any(Number),
                                groupCount: expect.any(Number),
                                stackIndex: 0,
                                stackCount: 0,
                            });
                        } else {
                            expect(console.warn).toHaveBeenCalledWith(
                                expect.stringMatching(/AG Charts - Unknown option `series\[\d+].grouped`, ignoring./)
                            );
                            expect(series.seriesGrouping).toBe(undefined);
                        }
                    }
                }
            );

            it.each(Object.keys(seriesTypes))(
                "handle grouped property 'false' for series type [%s] appropriately",
                (seriesType) => {
                    const testOptions = getSeriesOptions(seriesType, (s) => ({ ...s, grouped: false }));
                    const options = prepareOptions({ series: testOptions });
                    const { groupable, stackable, stackedByDefault } = seriesTypes[seriesType as SeriesType]!;

                    for (const series of options.series) {
                        expect(series.stacked).toBe(undefined);
                        expect(series.grouped).toBe(undefined);

                        if (groupable) {
                            expect(console.warn).not.toHaveBeenCalled();
                        } else {
                            expect(console.warn).toHaveBeenCalledWith(
                                expect.stringMatching(/AG Charts - Unknown option `series\[\d+].grouped`, ignoring./)
                            );
                        }

                        if (stackable && stackedByDefault) {
                            expect(series.seriesGrouping).toMatchSnapshot({
                                groupIndex: expect.any(Number),
                                groupCount: expect.any(Number),
                                stackIndex: expect.any(Number),
                                stackCount: expect.any(Number),
                            });
                        } else {
                            expect(series.seriesGrouping).toBe(undefined);
                        }
                    }
                }
            );

            it.each(Object.keys(seriesTypes))(
                'handle omitted grouped property for series type [%s] appropriately',
                (seriesType) => {
                    const testOptions = getSeriesOptions(seriesType, (s) => ({ ...s, grouped: undefined }));
                    const options = prepareOptions({ series: testOptions });
                    const { stackable, stackedByDefault, groupable } = seriesTypes[seriesType as SeriesType]!;

                    for (const series of options.series) {
                        expect(series.stacked).toBe(undefined);
                        expect(series.grouped).toBe(undefined);
                        expect(console.warn).not.toHaveBeenCalled();

                        if (stackable ? stackedByDefault || groupable : groupable) {
                            expect(series.seriesGrouping).toMatchSnapshot({
                                groupIndex: expect.any(Number),
                                groupCount: expect.any(Number),
                                stackIndex: expect.any(Number),
                                stackCount: expect.any(Number),
                            });
                        } else {
                            expect(series.seriesGrouping).toBe(undefined);
                        }
                    }
                }
            );

            it.each(Object.keys(seriesTypes))(
                "handle grouped property 'true', stacked property 'true' for series type [%s] appropriately",
                (seriesType) => {
                    const testOptions = getSeriesOptions(seriesType, (s) => ({ ...s, stacked: true, grouped: true }));
                    const options = prepareOptions({ series: testOptions });
                    const { stackable, groupable } = seriesTypes[seriesType as SeriesType]!;

                    for (const series of options.series) {
                        expect(series.stacked).toBe(undefined);
                        expect(series.grouped).toBe(undefined);

                        if (!stackable) {
                            expect(console.warn).toHaveBeenCalledWith(
                                `AG Charts - unsupported stacking of series type "${seriesType}".`
                            );
                        }
                        if (!groupable) {
                            expect(console.warn).toHaveBeenCalledWith(
                                expect.stringMatching(/AG Charts - Unknown option `series\[\d+].grouped`, ignoring./)
                            );
                        }
                        if (stackable && groupable) {
                            expect(console.warn).not.toHaveBeenCalled();
                        }

                        if (stackable) {
                            expect(series.seriesGrouping).toMatchSnapshot({
                                groupIndex: expect.any(Number),
                                groupCount: expect.any(Number),
                                stackIndex: expect.any(Number),
                                stackCount: expect.any(Number),
                            });
                        } else if (groupable) {
                            expect(series.seriesGrouping).toMatchSnapshot({
                                groupIndex: expect.any(Number),
                                groupCount: expect.any(Number),
                                stackIndex: 0,
                                stackCount: 0,
                            });
                        } else {
                            expect(series.seriesGrouping).toBe(undefined);
                        }
                    }
                }
            );

            it.each(Object.keys(seriesTypes))(
                "handle grouped property 'false', stacked property 'false' for series type [%s] appropriately",
                (seriesType) => {
                    const testOptions = getSeriesOptions(seriesType, (s) => ({
                        ...s,
                        stacked: false,
                        grouped: false,
                    }));
                    const options = prepareOptions({ series: testOptions });
                    const { groupable } = seriesTypes[seriesType as SeriesType]!;

                    for (const series of options.series) {
                        expect(series.stacked).toBe(undefined);
                        expect(series.grouped).toBe(undefined);
                        expect(series.seriesGrouping).toBe(undefined);

                        if (groupable) {
                            expect(console.warn).not.toHaveBeenCalled();
                        } else {
                            expect(console.warn).toHaveBeenCalledWith(
                                expect.stringMatching(/AG Charts - Unknown option `series\[\d+].grouped`, ignoring./)
                            );
                        }
                    }
                }
            );

            it.each(Object.keys(seriesTypes))(
                "handle grouped property 'true', stacked property 'false' for series type [%s] appropriately",
                (seriesType) => {
                    const testOptions = getSeriesOptions(seriesType, (s) => ({
                        ...s,
                        stacked: false,
                        grouped: true,
                    }));
                    const options = prepareOptions({ series: testOptions });
                    const { groupable } = seriesTypes[seriesType as SeriesType]!;

                    for (const series of options.series) {
                        expect(series.stacked).toBe(undefined);
                        expect(series.grouped).toBe(undefined);

                        if (groupable) {
                            expect(console.warn).not.toHaveBeenCalled();
                        } else {
                            expect(console.warn).toHaveBeenCalledWith(
                                expect.stringMatching(/AG Charts - Unknown option `series\[\d+].grouped`, ignoring./)
                            );
                        }

                        if (groupable) {
                            expect(series.seriesGrouping).toMatchSnapshot({
                                groupIndex: expect.any(Number),
                                groupCount: expect.any(Number),
                                stackIndex: 0,
                                stackCount: 0,
                            });
                        } else {
                            expect(series.seriesGrouping).toBe(undefined);
                        }
                    }
                }
            );

            it.each(Object.keys(seriesTypes))(
                "handle grouped property 'false', stacked property 'true' for series type [%s] appropriately",
                (seriesType) => {
                    const testOptions = getSeriesOptions(seriesType, (s) => ({
                        ...s,
                        stacked: true,
                        grouped: false,
                    }));
                    const options = prepareOptions({ series: testOptions });
                    const { groupable, stackable } = seriesTypes[seriesType as SeriesType]!;

                    for (const series of options.series) {
                        expect(series.stacked).toBe(undefined);
                        expect(series.grouped).toBe(undefined);

                        if (stackable) {
                            expect(series.seriesGrouping).toMatchSnapshot({
                                groupIndex: expect.any(Number),
                                groupCount: expect.any(Number),
                                stackIndex: expect.any(Number),
                                stackCount: expect.any(Number),
                            });
                        }

                        if (stackable && groupable) {
                            expect(console.warn).not.toHaveBeenCalled();
                        } else {
                            if (!stackable) {
                                expect(console.warn).toHaveBeenCalledWith(
                                    `AG Charts - unsupported stacking of series type "${seriesType}".`
                                );
                            }
                            if (!groupable) {
                                expect(console.warn).toHaveBeenCalledWith(
                                    expect.stringMatching(
                                        /AG Charts - Unknown option `series\[\d+].grouped`, ignoring./
                                    )
                                );
                            }
                        }
                    }
                }
            );

            it.each(Object.keys(seriesTypes))(
                'handle omitted grouped and stacked properties for series type [%s] appropriately',
                (seriesType) => {
                    const testOptions = getSeriesOptions(seriesType, (s) => ({
                        ...s,
                        stacked: undefined,
                        grouped: undefined,
                    }));
                    const options = prepareOptions({ series: testOptions });
                    const { stackable, stackedByDefault, groupable } = seriesTypes[seriesType as SeriesType]!;

                    for (const series of options.series) {
                        expect(series.stacked).toBe(undefined);
                        expect(series.grouped).toBe(undefined);
                        expect(console.warn).not.toHaveBeenCalled();

                        if (stackable ? stackedByDefault || groupable : groupable) {
                            expect(series.seriesGrouping).toMatchSnapshot({
                                groupIndex: expect.any(Number),
                                groupCount: expect.any(Number),
                                stackIndex: expect.any(Number),
                                stackCount: expect.any(Number),
                            });
                        } else {
                            expect(series.seriesGrouping).toBe(undefined);
                        }
                    }
                }
            );
        });
    });

    describe('#prepareOptions', () => {
        it.each(Object.entries(EXAMPLES))('for %s it should prepare options as expected', (_exampleName, example) => {
            const options: AgChartOptions = example.options;
            options.container = document.createElement('div');

            const preparedOptions = prepareOptions(options);

            if (options.data) {
                expect(preparedOptions).toHaveProperty('data', options.data);
                expect(preparedOptions).toMatchSnapshot({
                    container: expect.any(HTMLElement),
                    data: expect.any(Array.isArray(options.data) ? Array : Object),
                });
            } else {
                const optionsCopy = { ...preparedOptions };
                optionsCopy.series = (optionsCopy.series as any[]).map((v) => {
                    const copy = { ...v };
                    delete copy.data;
                    return copy;
                });
                expect(optionsCopy).toMatchSnapshot({
                    container: expect.any(HTMLElement),
                });
            }
        });

        it('should merge combo-chart series overrides as expected', () => {
            const options = COMBO_CHART_EXAMPLE;
            options.container = document.createElement('div');

            const preparedOptions = prepareOptions(options);

            expect(preparedOptions.series?.length).toEqual(3);
            expect(preparedOptions.series?.map((s) => s.type)).toEqual(['line', 'bar', 'area']);
            expect(preparedOptions.series?.map((s) => 'label' in s && s.label?.enabled)).toEqual([true, true, true]);
        });

        it('should merge complex theme setups as expected', () => {
            const options = COMPLEX_THEME_SCENARIO;

            options.container = document.createElement('div');

            const preparedOptions = prepareOptions(options);

            expect(Object.keys(preparedOptions.axes ?? {})).toHaveLength(4);
            expect(preparedOptions.axes).toMatchObject({
                x: { type: 'time', title: { enabled: false } },
                y: { type: 'number', title: { enabled: false } },
                __AXIS_ID_2: { type: 'time', title: { enabled: true } },
                __AXIS_ID_3: { type: 'number', title: { enabled: true } },
            });
            expect(preparedOptions.series?.length).toEqual(4);
            expect(preparedOptions.series?.map((s) => s.type)).toEqual(['line', 'bar', 'area', 'area']);
            expect(preparedOptions.series?.map((s) => 'label' in s && s.label?.enabled)).toEqual([
                true,
                false,
                false,
                true,
            ]);
        });

        it('should drop unregistered theme overrides before processing', () => {
            const warnSpy = vi.spyOn(console, 'warn');
            const theme: AgChartTheme = {
                overrides: {
                    common: {
                        annotations: { enabled: true },
                        navigator: { enabled: true } as any,
                        axes: {
                            // @ts-expect-error Testing unregistered axis plugins
                            'angle-number': { crosshair: { enabled: true } },
                        },
                    },
                    'radial-bar': { series: { strokeWidth: 5, errorBar: { visible: true } } } as any,
                },
            };

            const chartOptions = new ChartOptions(
                {
                    data: [{ x: 1, y: 2 }],
                    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                    theme,
                },
                {} as AgCartesianChartOptions,
                {},
                {},
                {}
            );

            try {
                expect(chartOptions.activeTheme.overrides?.common?.navigator?.enabled).toBe(true);
                expect(chartOptions.activeTheme.overrides?.common?.annotations?.enabled).toBe(true);
                expect(chartOptions.activeTheme.overrides?.common?.axes?.['angle-number']).toBeUndefined();
                expect((chartOptions.activeTheme.overrides as any)?.['radial-bar']).toBeUndefined();
                expect(warnSpy).toHaveBeenCalledTimes(2);
                expect(warnSpy.mock.calls[0]?.[0]).toContain('theme.overrides.common.axes.angle-number.crosshair');
                expect(warnSpy.mock.calls[1]?.[0]).toContain('theme.overrides.radial-bar.series.errorBar');
            } finally {
                warnSpy.mockRestore();
            }
        });

        it('sanitizes theme defaults when modules are missing', () => {
            const baseTheme = new ChartTheme();
            const themeWithExtras = Object.create(baseTheme, {
                config: {
                    value: { ...baseTheme.config, 'radial-bar': { series: { strokeWidth: 2 } } },
                    enumerable: true,
                },
                overrides: {
                    value: {
                        ...(baseTheme.overrides ?? {}),
                        common: {
                            ...(baseTheme.overrides?.common ?? {}),
                            navigator: { enabled: true },
                            axes: {
                                ...(baseTheme.overrides?.common?.axes ?? {}),
                                number: {
                                    ...(baseTheme.overrides?.common?.axes?.number ?? {}),
                                    crosshair: { enabled: true },
                                    bandHighlight: { enabled: false },
                                },
                            },
                        },
                        'radial-bar': { series: { strokeWidth: 5 } },
                        line: { series: { errorBar: { enabled: true } } },
                    },
                    enumerable: true,
                },
                presets: {
                    value: { ...(baseTheme.presets ?? {}), 'linear-gauge': { enabled: true } },
                    enumerable: true,
                },
            }) as ChartTheme;

            const sanitizedTheme = sanitizeThemeModules(themeWithExtras);

            expect(sanitizedTheme.config['radial-bar']).toBeUndefined();
            expect((sanitizedTheme.overrides as any)?.['radial-bar']).toBeUndefined();
            expect((sanitizedTheme.overrides as any)?.common?.navigator?.enabled).toBe(true);
            expect((sanitizedTheme.overrides as any)?.common?.axes?.number?.crosshair?.enabled).toBe(true);
            expect((sanitizedTheme.overrides as any)?.common?.axes?.number?.bandHighlight).toBeUndefined();
            expect((sanitizedTheme.overrides as any)?.line?.series?.errorBar).toBeUndefined();
            expect((sanitizedTheme.presets as any)?.['linear-gauge']).toBeUndefined();
        });

        it('should use default theme options when `enabled` is set to `false` on an options object', () => {
            const options = ENABLED_FALSE_OPTIONS;
            options.container = document.createElement('div');

            const preparedOptions = prepareOptions(options);
            const theme = new ChartTheme();

            expect(preparedOptions.title?.enabled).toBe(false);
            expect(preparedOptions.title?.text).toBe(theme.config.line.title.text);
            expect(preparedOptions.title?.fontSize).toBe(17);
            expect(preparedOptions.title?.spacing).toBe(20);

            expect(preparedOptions.subtitle?.enabled).toBe(false);
            expect(preparedOptions.subtitle?.text).toBe(theme.config.line.subtitle.text);
            expect(preparedOptions.subtitle?.fontSize).toBe(13);
            expect(preparedOptions.subtitle?.spacing).toBe(theme.config.line.subtitle.spacing);

            expect(preparedOptions.footnote?.enabled).toBe(false);
            expect(preparedOptions.footnote?.text).toBe(theme.config.line.footnote.text);
            expect(preparedOptions.footnote?.fontSize).toBe(13);
            expect(preparedOptions.footnote?.spacing).toBe(theme.config.line.footnote.spacing);

            const numberAxis = preparedOptions.axes?.x as AgNumberAxisOptions;
            expect(numberAxis?.tick?.enabled).toBe(false);
            expect(numberAxis?.tick?.width).toBe(theme.config.line.axes.time.tick.width);
            expect(numberAxis?.tick?.size).toBe(theme.config.line.axes.time.tick.size);

            expect(numberAxis?.title?.enabled).toBe(false);
            expect(numberAxis?.title?.text).toBe(theme.config.line.axes.time.title.text);

            expect(numberAxis?.label?.enabled).toBe(false);
            expect(numberAxis?.label?.avoidCollisions).toBe(theme.config.line.axes.time.label.avoidCollisions);
            expect(numberAxis?.label?.autoRotate).toBe(theme.config.line.axes.time.label.autoRotate);
            expect(numberAxis?.label?.minSpacing).toBe(theme.config.line.axes.time.label.minSpacing);

            expect(preparedOptions.axes!.y?.title?.enabled).toBe(true);
            expect(preparedOptions.axes!.y?.title?.text).toBe('Custom Left Axis Title');

            const series0 = preparedOptions.series?.[0] as AgLineSeriesOptions | undefined;
            expect(series0?.marker?.enabled).toBe(false);
            expect(series0?.marker?.strokeWidth).toBe(0);
            expect(series0?.label?.enabled).toBe(false);
            expect(series0?.label?.outsideStyle?.color).toBe('#181d1f');

            expect(series0?.tooltip?.enabled).toBe(false);
            expect(series0?.tooltip?.renderer).toBe(theme.config.line.series.tooltip.renderer);

            expect(preparedOptions.tooltip?.enabled).toBe(false);
            expect(preparedOptions.tooltip?.range).toBe(theme.config.line.tooltip.range);

            expect(preparedOptions.legend).not.toBeUndefined();
        });

        it('should intrinsically enable nested crossline options', () => {
            const options = INTRINSIC_ENABLE_CROSSLINE_OPTIONS;
            options.container = document.createElement('div');

            const preparedOptions = prepareOptions(options);

            const numberAxis = preparedOptions.axes?.x as AgNumberAxisOptions;
            expect(numberAxis.crossLines?.[0].enabled).toBe(true);
            expect(numberAxis.crossLines?.[0].label?.enabled).toBe(undefined);
        });

        describe('axes', () => {
            it('should persist valid axes', () => {
                const options: AgCartesianChartOptions = {
                    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                    axes: {
                        x: { type: 'category', position: 'bottom' },
                        y: { type: 'number', position: 'left' },
                        myAxis: { type: 'number', position: 'right' },
                    },
                };

                const preparedOptions = prepareOptions(options);

                expect(Object.keys(preparedOptions.axes ?? {})).toHaveLength(3);
                expect(preparedOptions.axes).toMatchObject({
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                    __AXIS_ID_2: { type: 'number', position: 'right' },
                });
                expect(preparedOptions.series?.[0]).toMatchObject({
                    xKeyAxis: 'x',
                    yKeyAxis: 'y',
                });
            });

            it('should remap axes to the primary axis ids', () => {
                const options: AgCartesianChartOptions = {
                    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                    axes: {
                        myAxis0: { type: 'category', position: 'bottom' },
                        myAxis1: { type: 'number', position: 'top' },
                        myAxis2: { type: 'number', position: 'left' },
                    },
                };

                const preparedOptions = prepareOptions(options);

                expect(Object.keys(preparedOptions.axes ?? {})).toHaveLength(3);
                expect(preparedOptions.axes).toMatchObject({
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                    __AXIS_ID_2: { type: 'number', position: 'top' },
                });
                expect(preparedOptions.series?.[0]).toMatchObject({
                    xKeyAxis: 'x',
                    yKeyAxis: 'y',
                });
            });

            it('should remap axes to the primary axis ids when given incorrect directional ids', () => {
                const options: AgCartesianChartOptions = {
                    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                    axes: {
                        y: { type: 'category', position: 'bottom' },
                        x: { type: 'number', position: 'left' },
                        myAxis: { type: 'number', position: 'right' },
                    },
                };

                const preparedOptions = prepareOptions(options);

                expect(Object.keys(preparedOptions.axes ?? {})).toHaveLength(3);
                expect(preparedOptions.axes).toMatchObject({
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                    __AXIS_ID_2: { type: 'number', position: 'right' },
                });
                expect(preparedOptions.series?.[0]).toMatchObject({
                    xKeyAxis: 'x',
                    yKeyAxis: 'y',
                });
            });

            it('should append an axis when only referenced by a series axis key', () => {
                const options: AgCartesianChartOptions = {
                    series: [{ type: 'line', xKey: 'x', yKey: 'y', xKeyAxis: 'myAxis', yKeyAxis: 'y' }],
                    axes: {
                        x: { type: 'category', position: 'bottom' },
                        y: { type: 'number', position: 'left' },
                    },
                };

                const preparedOptions = prepareOptions(options);

                expect(Object.keys(preparedOptions.axes ?? {})).toHaveLength(3);
                expect(preparedOptions.axes).toMatchObject({
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                    __AXIS_ID_2: { type: 'category', position: 'top' },
                });
                expect(preparedOptions.series?.[0]).toMatchObject({
                    xKeyAxis: '__AXIS_ID_2',
                    yKeyAxis: 'y',
                });
            });

            it('should append a primary axis when only one series references a secondary axis', () => {
                const options: AgCartesianChartOptions = {
                    series: [
                        { type: 'line', xKey: 'x', yKey: 'y' },
                        { type: 'line', xKey: 'x', yKey: 'y', yKeyAxis: 'myAxis' },
                    ],
                    axes: {
                        myAxis: { type: 'number' },
                        x: { type: 'category', position: 'bottom' },
                    },
                };

                const preparedOptions = prepareOptions(options);

                expect(Object.keys(preparedOptions.axes ?? {})).toHaveLength(3);
                expect(preparedOptions.axes).toMatchObject({
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                    __AXIS_ID_2: { type: 'number' }, // myAxis
                });
                expect(preparedOptions.series?.[0]).toMatchObject({
                    xKeyAxis: 'x',
                    yKeyAxis: 'y',
                });
                expect(preparedOptions.series?.[1]).toMatchObject({
                    xKeyAxis: 'x',
                    yKeyAxis: '__AXIS_ID_2', // myAxis
                });
            });

            it('should append a primary axis when only one series references an undefined secondary axis', () => {
                const options: AgCartesianChartOptions = {
                    series: [
                        { type: 'line', xKey: 'x', yKey: 'y' },
                        { type: 'line', xKey: 'x', yKey: 'y', yKeyAxis: 'myAxis' },
                    ],
                    axes: {
                        y: { type: 'number' },
                        x: { type: 'category', position: 'bottom' },
                    },
                };

                const preparedOptions = prepareOptions(options);

                expect(Object.keys(preparedOptions.axes ?? {})).toHaveLength(3);
                expect(preparedOptions.axes).toMatchObject({
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number' },
                    __AXIS_ID_2: { type: 'number' }, // myAxis
                });
                expect(preparedOptions.series?.[0]).toMatchObject({
                    xKeyAxis: 'x',
                    yKeyAxis: 'y',
                });
                expect(preparedOptions.series?.[1]).toMatchObject({
                    xKeyAxis: 'x',
                    yKeyAxis: '__AXIS_ID_2', // myAxis
                });
            });

            it('should append a secondary axis when all series reference axes', () => {
                const options: AgCartesianChartOptions = {
                    series: [
                        { type: 'line', xKey: 'x', yKey: 'y', yKeyAxis: 'myOtherAxis' },
                        { type: 'line', xKey: 'x', yKey: 'y', yKeyAxis: 'myAxis' },
                    ],
                    axes: {
                        myAxis: { type: 'number' },
                        x: { type: 'category', position: 'bottom' },
                        myOtherAxis: { type: 'number' },
                    },
                };

                const preparedOptions = prepareOptions(options);

                expect(Object.keys(preparedOptions.axes ?? {})).toHaveLength(3);
                expect(preparedOptions.axes).toMatchObject({
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number' },
                    __AXIS_ID_2: { type: 'number' }, // myOtherAxis
                });
                expect(preparedOptions.series?.[0]).toMatchObject({
                    xKeyAxis: 'x',
                    yKeyAxis: '__AXIS_ID_2', // myOtherAxis
                });
                expect(preparedOptions.series?.[1]).toMatchObject({
                    xKeyAxis: 'x',
                    yKeyAxis: 'y', // myAxis
                });
            });

            it('should provide default axes where a direction is missing', () => {
                const options: AgCartesianChartOptions = {
                    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                    axes: {
                        x: { type: 'category', position: 'bottom' },
                        myAxis: { type: 'number', position: 'top' },
                    },
                };

                const preparedOptions = prepareOptions(options);

                expect(Object.keys(preparedOptions.axes ?? {})).toHaveLength(3);
                expect(preparedOptions.axes).toMatchObject({
                    y: { type: 'number', position: 'left' },
                    x: { type: 'category', position: 'bottom' },
                    __AXIS_ID_1: { type: 'number', position: 'top' }, // myAxis
                });
                expect(preparedOptions.series?.[0]).toMatchObject({
                    xKeyAxis: 'x',
                    yKeyAxis: 'y',
                });
            });

            it('should persist axes when no position is provided and keys are standard', () => {
                const options: AgCartesianChartOptions = {
                    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                    axes: {
                        y: { type: 'number' },
                        x: { type: 'time' },
                        myAxis: { type: 'number' },
                    },
                };

                const preparedOptions = prepareOptions(options);

                expect(Object.keys(preparedOptions.axes ?? {})).toHaveLength(3);
                expect(preparedOptions.axes).toMatchObject({
                    x: { type: 'time' }, // matched by key
                    y: { type: 'number' }, // matched by key
                    __AXIS_ID_2: { type: 'number' },
                });
                expect(preparedOptions.series?.[0]).toMatchObject({
                    xKeyAxis: 'x',
                    yKeyAxis: 'y',
                });
            });

            it('should remap axes when no position is provided and keys are non-standard', () => {
                const options: AgCartesianChartOptions = {
                    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                    axes: {
                        myAxis0: { type: 'time' },
                        myAxis1: { type: 'number' },
                        myAxis2: { type: 'number' },
                    },
                };

                const preparedOptions = prepareOptions(options);

                expect(Object.keys(preparedOptions.axes ?? {})).toHaveLength(3);
                expect(preparedOptions.axes).toMatchObject({
                    x: { type: 'time' }, // matched by index, myAxis0
                    y: { type: 'number' }, // matched by index, myAxis1
                    __AXIS_ID_2: { type: 'number' }, // myAxis2
                });
                expect(preparedOptions.series?.[0]).toMatchObject({
                    xKeyAxis: 'x',
                    yKeyAxis: 'y',
                });
            });

            it('should remap axes when a mixture of position and no position', () => {
                const options: AgCartesianChartOptions = {
                    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                    axes: {
                        x: { type: 'category' },
                        y: { type: 'number', position: 'left' },
                        myAxis: { type: 'number' },
                    },
                };

                const preparedOptions = prepareOptions(options);

                expect(Object.keys(preparedOptions.axes ?? {})).toHaveLength(3);
                expect(preparedOptions.axes).toMatchObject({
                    x: { type: 'category' },
                    y: { type: 'number' },
                    __AXIS_ID_2: { type: 'number' },
                });
                expect(preparedOptions.series?.[0]).toMatchObject({
                    xKeyAxis: 'x',
                    yKeyAxis: 'y',
                });
            });

            // TODO: predict the axes based on their types?
            it.fails(
                'should remap axes when no position is provided and keys are non-standard and axes are in wrong order',
                () => {
                    const options: AgCartesianChartOptions = {
                        series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                        axes: {
                            myAxis0: { type: 'number' },
                            myAxis1: { type: 'time' },
                        },
                    };

                    const preparedOptions = prepareOptions(options);

                    expect(Object.keys(preparedOptions.axes ?? {})).toHaveLength(2);
                    expect(preparedOptions.axes).toMatchObject({
                        x: { type: 'time' },
                        y: { type: 'number' },
                    });
                    expect(preparedOptions.series?.[0]).toMatchObject({
                        xKeyAxis: 'x',
                        yKeyAxis: 'y',
                    });
                }
            );

            it('should create default axes by series type', () => {
                const options: AgCartesianChartOptions = {
                    series: [{ type: 'scatter', xKey: 'x', yKey: 'y' }],
                };

                const preparedOptions = prepareOptions(options);

                expect(Object.keys(preparedOptions.axes ?? {})).toHaveLength(2);
                expect(preparedOptions.axes).toMatchObject({
                    x: { type: 'number', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                });
            });

            it('should create default axes when series have axis keys but no axes are provided', () => {
                const options: AgCartesianChartOptions = {
                    series: [{ type: 'line', xKey: 'x', yKey: 'y', xKeyAxis: 'myXAxis', yKeyAxis: 'myYAxis' }],
                };

                const preparedOptions = prepareOptions(options);

                expect(Object.keys(preparedOptions.axes ?? {})).toHaveLength(2);
                expect(preparedOptions.axes).toMatchObject({
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                });
                expect(preparedOptions.series?.[0]).toMatchObject({
                    xKeyAxis: 'x',
                    yKeyAxis: 'y',
                });
            });

            it('should create new axes when series have axis keys that do not match provided axes', () => {
                const options: AgCartesianChartOptions = {
                    series: [{ type: 'line', xKey: 'x', yKey: 'y', xKeyAxis: 'myXAxis', yKeyAxis: 'myYAxis' }],
                    axes: {
                        x: { type: 'category', position: 'bottom' },
                    },
                };

                const preparedOptions = prepareOptions(options);

                expect(Object.keys(preparedOptions.axes ?? {})).toHaveLength(3);
                expect(preparedOptions.axes).toMatchObject({
                    x: { type: 'category', position: 'bottom' },
                    __AXIS_ID_2: { type: 'category', position: 'top' },
                    y: { type: 'number', position: 'left' },
                });
                expect(preparedOptions.series?.[0]).toMatchObject({
                    xKeyAxis: '__AXIS_ID_2', // user's myXAxis
                    yKeyAxis: 'y', // user's myYAxis, since no axes.y provided
                });
            });

            it('should create default and secondary axes when series have axis keys but no axes are provided', () => {
                const options: AgCartesianChartOptions = {
                    series: [
                        { type: 'line', xKey: 'x', yKey: 'y', yKeyAxis: 'myYAxis' },
                        { type: 'line', xKey: 'x', yKey: 'y' },
                    ],
                };

                const preparedOptions = prepareOptions(options);

                expect(Object.keys(preparedOptions.axes ?? {})).toHaveLength(3);
                expect(preparedOptions.axes).toMatchObject({
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                    __AXIS_ID_2: { type: 'number', position: 'right' },
                });
                expect(preparedOptions.series?.[0]).toMatchObject({
                    xKeyAxis: 'x',
                    yKeyAxis: 'y', // user's myYAxis becomes the primary y-axis
                });
                expect(preparedOptions.series?.[1]).toMatchObject({
                    xKeyAxis: 'x',
                    yKeyAxis: '__AXIS_ID_2', // the implicit `yKeyAxis: 'y'` axis becomes a secondary axis
                });
            });

            it('should remap and create default axes', () => {
                const options: AgCartesianChartOptions = {
                    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                    axes: {
                        y: { type: 'category', position: 'bottom' },
                        myAxis: { type: 'number', position: 'top' },
                    },
                };

                const preparedOptions = prepareOptions(options);

                expect(Object.keys(preparedOptions.axes ?? {})).toHaveLength(3);
                expect(preparedOptions.axes).toMatchObject({
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                    __AXIS_ID_1: { type: 'number', position: 'top' },
                });
                expect(preparedOptions.series?.[0]).toMatchObject({
                    xKeyAxis: 'x',
                    yKeyAxis: 'y',
                });
            });

            it('should predict missing types and positions', () => {
                const options: AgCartesianChartOptions = {
                    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                    axes: {
                        x: {},
                        y: {},
                    },
                };

                const preparedOptions = prepareOptions(options);

                expect(Object.keys(preparedOptions.axes ?? {})).toHaveLength(2);
                expect(preparedOptions.axes).toMatchObject({
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                });
            });

            it('should predict missing types and positions for secondary axes', () => {
                const options: AgCartesianChartOptions = {
                    series: [
                        { type: 'line', xKey: 'x', yKey: 'y' },
                        { type: 'line', xKey: 'x', yKey: 'y', yKeyAxis: 'myAxis' },
                    ],
                    axes: {
                        x: {},
                        y: {},
                        myAxis: {},
                    },
                };

                const preparedOptions = prepareOptions(options);

                expect(Object.keys(preparedOptions.axes ?? {})).toHaveLength(3);
                expect(preparedOptions.axes).toMatchObject({
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                    __AXIS_ID_2: { type: 'number', position: 'right' },
                });
            });

            it('should should predict missing types when given positions', () => {
                const options: AgCartesianChartOptions = {
                    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                    axes: {
                        myAxis1: { position: 'left' },
                        myAxis2: { position: 'bottom' },
                    },
                };

                const preparedOptions = prepareOptions(options);

                expect(Object.keys(preparedOptions.axes ?? {})).toHaveLength(2);
                expect(preparedOptions.axes).toMatchObject({
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                });
            });

            it('should predict missing positions for primary axes when secondary axes have positions', () => {
                const options: AgCartesianChartOptions = {
                    series: [
                        { type: 'line', xKey: 'x', yKey: 'y' },
                        { type: 'line', xKey: 'x', yKey: 'y', yKeyAxis: 'myAxis' },
                    ],
                    axes: {
                        x: {},
                        y: {},
                        myAxis: { position: 'right' },
                    },
                };

                const preparedOptions = prepareOptions(options);

                expect(Object.keys(preparedOptions.axes ?? {})).toHaveLength(3);
                expect(preparedOptions.axes).toMatchObject({
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                    __AXIS_ID_2: { type: 'number', position: 'right' },
                });
            });

            it('should predict missing positions when primary and secondary axes given types', () => {
                const options: AgCartesianChartOptions = {
                    series: [
                        { type: 'line', xKey: 'x', yKey: 'y' },
                        { type: 'line', xKey: 'x', yKey: 'y', yKeyAxis: 'myAxis' },
                    ],
                    axes: {
                        x: {},
                        y: { type: 'number' },
                        myAxis: { type: 'number' },
                    },
                };

                const preparedOptions = prepareOptions(options);

                expect(Object.keys(preparedOptions.axes ?? {})).toHaveLength(3);
                expect(preparedOptions.axes).toMatchObject({
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                    __AXIS_ID_2: { type: 'number', position: 'right' },
                });
            });

            it('should discard secondary axes that are not referenced and have no position or type', () => {
                const options: AgCartesianChartOptions = {
                    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                    axes: {
                        myAxis1: {},
                        myAxis2: {},
                        myAxis3: {},
                    },
                };

                const preparedOptions = prepareOptions(options);

                expect(Object.keys(preparedOptions.axes ?? {})).toHaveLength(2);
            });

            it('should discard invalid axes', () => {
                const options: AgCartesianChartOptions = {
                    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                    axes: {
                        x: { type: 'invalid' } as any,
                        y: { type: 'invalid' } as any,
                    },
                };

                const preparedOptions = prepareOptions(options);

                expect(console.warn).toHaveBeenCalledTimes(2);
                const [[message1], [message2]] = (console.warn as Mock).mock.calls;
                expect(message1).toContain('Unknown type `invalid` at `axes.x.type`');
                expect(message2).toContain('Unknown type `invalid` at `axes.y.type`');

                expect(Object.keys(preparedOptions.axes ?? {})).toHaveLength(2);
                expect(preparedOptions.axes).toMatchObject({
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                });
            });

            it('should discard invalid axes and keep valid axes', () => {
                const options: AgCartesianChartOptions = {
                    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                    axes: {
                        x: { type: 'invalid' } as any,
                        y: { type: 'category', position: 'right' },
                    },
                };

                const preparedOptions = prepareOptions(options);

                expect(console.warn).toHaveBeenCalledTimes(1);
                const [[message1]] = (console.warn as Mock).mock.calls;
                expect(message1).toContain('Unknown type `invalid` at `axes.x.type`');

                expect(Object.keys(preparedOptions.axes ?? {})).toHaveLength(2);
                expect(preparedOptions.axes).toMatchObject({
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'category', position: 'right' },
                });
            });

            it('should flip axes when a series is horizontal', () => {
                const options: AgCartesianChartOptions = {
                    series: [{ type: 'bar', xKey: 'x', yKey: 'y', direction: 'horizontal' }],
                    axes: {
                        x: { type: 'category', position: 'left' },
                        y: { type: 'number', position: 'bottom' },
                    },
                };

                const preparedOptions = prepareOptions(options);

                expect(Object.keys(preparedOptions.axes ?? {})).toHaveLength(2);
                expect(preparedOptions.axes).toMatchObject({
                    x: { type: 'number', position: 'bottom' },
                    y: { type: 'category', position: 'left' },
                });
                expect(preparedOptions.series?.[0]).toMatchObject({
                    xKeyAxis: 'y',
                    yKeyAxis: 'x',
                });
            });

            it('should flip axes when a series is horizontal and no axes are provided', () => {
                const options: AgCartesianChartOptions = {
                    series: [
                        { type: 'bar', xKey: 'x', yKey: 'y', direction: 'horizontal', yKeyAxis: 'myAxis1' },
                        { type: 'bar', xKey: 'x', yKey: 'y', direction: 'horizontal', yKeyAxis: 'myAxis2' },
                    ],
                };

                const preparedOptions = prepareOptions(options);

                expect(Object.keys(preparedOptions.axes ?? {})).toHaveLength(3);
                expect(preparedOptions.axes).toMatchObject({
                    x: { type: 'number', position: 'bottom' }, // myAxis1
                    y: { type: 'category', position: 'left' },
                    __AXIS_ID_2: { type: 'number', position: 'top' }, // myAxis2
                });
                expect(preparedOptions.series?.[0]).toMatchObject({
                    xKeyAxis: 'y',
                    yKeyAxis: 'x', // myAxis1
                });
                expect(preparedOptions.series?.[1]).toMatchObject({
                    xKeyAxis: 'y',
                    yKeyAxis: '__AXIS_ID_2', // myAxis2
                });
            });

            it('should flip and position axes when a series is horizontal', () => {
                const options: AgCartesianChartOptions = {
                    series: [
                        {
                            type: 'bar',
                            xKey: 'x',
                            yKey: 'y',
                            direction: 'horizontal',
                            xKeyAxis: 'myAxis1', // should be left
                            yKeyAxis: 'myAxis2', // should be bottom
                        },
                        {
                            type: 'bar',
                            xKey: 'x',
                            yKey: 'y',
                            direction: 'horizontal',
                            xKeyAxis: 'myAxis1', // should be left
                            yKeyAxis: 'myAxis3', // should be top
                        },
                    ],
                    axes: {
                        myAxis1: { type: 'category' }, // should be left
                        myAxis2: { type: 'number' }, // should be bottom
                        myAxis3: { type: 'number' }, // should be top
                    },
                };

                const preparedOptions = prepareOptions(options);

                expect(Object.keys(preparedOptions.axes ?? {})).toHaveLength(3);
                expect(preparedOptions.axes).toMatchObject({
                    x: { type: 'number', position: 'bottom' }, // myAxis2
                    y: { type: 'category', position: 'left' }, // myAxis1
                    __AXIS_ID_2: { type: 'number', position: 'top' }, // myAxis3
                });
            });

            it('should alternate secondary x-axis positions', () => {
                const options: AgCartesianChartOptions = {
                    series: [
                        { type: 'line', xKey: 'x', yKey: 'y', xKeyAxis: 'myAxis1' },
                        { type: 'line', xKey: 'x', yKey: 'y', xKeyAxis: 'myAxis2' },
                        { type: 'line', xKey: 'x', yKey: 'y', xKeyAxis: 'myAxis3' },
                        { type: 'line', xKey: 'x', yKey: 'y', xKeyAxis: 'myAxis4' },
                    ],
                };

                const preparedOptions = prepareOptions(options);

                expect(Object.keys(preparedOptions.axes ?? {})).toHaveLength(5);
                expect(preparedOptions.axes).toMatchObject({
                    x: { type: 'category', position: 'bottom' },
                    __AXIS_ID_2: { type: 'category', position: 'top' },
                    __AXIS_ID_3: { type: 'category', position: 'bottom' },
                    __AXIS_ID_4: { type: 'category', position: 'bottom' },
                });
            });

            it('should alternate secondary y-axis positions', () => {
                const options: AgCartesianChartOptions = {
                    series: [
                        { type: 'line', xKey: 'x', yKey: 'y', yKeyAxis: 'myAxis1' },
                        { type: 'line', xKey: 'x', yKey: 'y', yKeyAxis: 'myAxis2' },
                        { type: 'line', xKey: 'x', yKey: 'y', yKeyAxis: 'myAxis3' },
                        { type: 'line', xKey: 'x', yKey: 'y', yKeyAxis: 'myAxis4' },
                    ],
                };

                const preparedOptions = prepareOptions(options);

                expect(Object.keys(preparedOptions.axes ?? {})).toHaveLength(5);
                expect(preparedOptions.axes).toMatchObject({
                    y: { type: 'number', position: 'left' },
                    __AXIS_ID_2: { type: 'number', position: 'right' },
                    __AXIS_ID_3: { type: 'number', position: 'left' },
                    __AXIS_ID_4: { type: 'number', position: 'left' },
                });
            });
        });
    });

    // Pins the post-theme-merge `processedOptions` for the documented AG Grid sparkline colDefs, so any
    // change to how the preset's theme template is layered shows up as a snapshot diff.
    describe('#prepareOptions > sparkline preset', () => {
        beforeEach(__clearStructuralCacheForTests);

        const sparklineData = [1, 3, 2, 5, 4];

        function sparklineTooltipRenderer(params: { xValue: any; yValue: any }) {
            return { title: String(params.xValue), content: String(params.yValue) };
        }

        function markerItemStyler(params: { highlightState?: string }) {
            return params.highlightState === 'highlighted-item' ? { size: 7 } : { size: 0 };
        }

        function labelFormatter(params: { value: any }) {
            return `${params.value}%`;
        }

        it('resolves a bar sparkline with user-supplied axis styling', () => {
            const options: AgSparklineOptions = {
                type: 'bar',
                direction: 'vertical',
                fill: '#fac858',
                data: sparklineData,
                axis: { type: 'category', stroke: '#cccccc', strokeWidth: 2, visible: true },
            };

            const preparedOptions = prepareSparklineOptions(options);

            expect(preparedOptions).toMatchSnapshot();
        });

        it('resolves a horizontal bar sparkline with user-supplied axis styling', () => {
            const options: AgSparklineOptions = {
                type: 'bar',
                direction: 'horizontal',
                min: 0,
                max: 6,
                fill: '#5470c6',
                data: sparklineData,
                axis: { type: 'category', stroke: '#cccccc', strokeWidth: 2, visible: true },
            };

            const preparedOptions = prepareSparklineOptions(options);

            expect(preparedOptions).toMatchSnapshot();
        });

        it('resolves a line sparkline with top-level padding', () => {
            const options: AgSparklineOptions = {
                type: 'line',
                stroke: 'rgb(124, 255, 178)',
                strokeWidth: 2,
                data: sparklineData,
                padding: { top: 5, bottom: 5 },
            };

            const preparedOptions = prepareSparklineOptions(options);

            expect(preparedOptions).toMatchSnapshot();
        });

        it('resolves an area sparkline with fill opacity and a marker styler', () => {
            const options: AgSparklineOptions = {
                type: 'area',
                fill: 'rgba(216, 204, 235, 0.3)',
                fillOpacity: 0.5,
                stroke: 'rgb(119,77,185)',
                data: sparklineData,
                marker: { enabled: true, size: 0, itemStyler: markerItemStyler },
                axis: { type: 'category', stroke: 'rgb(204, 204, 235)' },
            };

            const preparedOptions = prepareSparklineOptions(options);

            expect(preparedOptions).toMatchSnapshot();
        });

        it('resolves a line sparkline with a tooltip renderer and a marker styler', () => {
            const options: AgSparklineOptions = {
                type: 'line',
                stroke: 'rgb(124, 255, 178)',
                data: sparklineData,
                marker: { enabled: true, size: 0, itemStyler: markerItemStyler },
                tooltip: { renderer: sparklineTooltipRenderer },
            };

            const preparedOptions = prepareSparklineOptions(options);

            expect(preparedOptions).toMatchSnapshot();
        });

        it('resolves a bar sparkline with labels and a label formatter', () => {
            const options: AgSparklineOptions = {
                type: 'bar',
                direction: 'vertical',
                fill: '#fac858',
                data: sparklineData,
                padding: { top: 10, bottom: 10 },
                label: {
                    enabled: true,
                    color: '#999999',
                    placement: 'inside-end',
                    fontSize: 7.5,
                    padding: 1,
                    formatter: labelFormatter,
                },
            };

            const preparedOptions = prepareSparklineOptions(options);

            expect(preparedOptions).toMatchSnapshot();
        });

        it('resolves a line sparkline with a user theme override', () => {
            const options: AgSparklineOptions = {
                type: 'line',
                stroke: 'rgb(124, 255, 178)',
                data: sparklineData,
                // The preset's own theme sets `keyboard: { enabled: false }`, so this pins which
                // layer wins when the user overrides the same key.
                theme: { overrides: { common: { keyboard: { enabled: true } } } },
            };

            const preparedOptions = prepareSparklineOptions(options);

            expect(preparedOptions).toMatchSnapshot();
        });
    });

    describe('displayNullData propagation', () => {
        it('should propagate displayNullData to series allowNullKeys', () => {
            const options: AgCartesianChartOptions = {
                data: [
                    { x: null, y: 1 },
                    { x: 'a', y: 2 },
                ],
                series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
                displayNullData: true,
            } as any;

            const processed = prepareOptions(options);
            expect((processed.series![0] as any).allowNullKeys).toBe(true);
        });

        it('should not propagate displayNullData when series has explicit allowNullKeys', () => {
            const options: AgCartesianChartOptions = {
                data: [{ x: null, y: 1 }],
                series: [{ type: 'bar', xKey: 'x', yKey: 'y', allowNullKeys: false } as any],
                displayNullData: true,
            } as any;

            const processed = prepareOptions(options);
            expect((processed.series![0] as any).allowNullKeys).toBe(false);
        });

        it('should not set allowNullKeys when displayNullData is not provided', () => {
            const options: AgCartesianChartOptions = {
                data: [{ x: 'a', y: 1 }],
                series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
            };

            const processed = prepareOptions(options);
            expect((processed.series![0] as any).allowNullKeys).toBeUndefined();
        });
    });

    describe('font extraction', () => {
        function extractFonts(userOptions: AgChartOptions) {
            const chartOptions = new ChartOptions(userOptions, {} as AgChartOptions, {}, {}, {});
            return {
                fonts: chartOptions.fonts ?? new Set<string>(),
                googleFonts: chartOptions.googleFonts ?? new Set<string>(),
            };
        }

        it('collects weight-specific shorthands for concrete families and excludes generics', () => {
            const { fonts } = extractFonts({
                data: [{ x: 'a', y: 1 }],
                series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
                title: {
                    text: [{ text: '★', fontFamily: 'Font Awesome 6 Free', fontWeight: 900 }],
                },
                subtitle: { text: 'S', fontFamily: 'CustomFont, sans-serif' },
            } as AgChartOptions);

            // Weight is part of the spec: a family shipping one file per weight (e.g. FontAwesome solid
            // vs regular) must load the file the options reference.
            expect(fonts).toContain('900 16px "Font Awesome 6 Free"');
            expect(fonts).toContain('16px CustomFont');
            expect([...fonts].some((spec) => spec.includes('sans-serif'))).toBe(false);
        });

        it('routes google fonts to the googleFonts CDN set', () => {
            const { googleFonts } = extractFonts({
                data: [{ x: 'a', y: 1 }],
                series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
                loadGoogleFonts: true,
                title: { text: 'T', fontFamily: { googleFont: 'Pacifico' } },
            } as AgChartOptions);

            expect(googleFonts).toContain('Pacifico');
        });

        it('carries the referenced-font set through a fast-path delta update', () => {
            const baseOptions: AgChartOptions = {
                data: [{ x: 'a', y: 1 }],
                series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
                title: { text: [{ text: '★', fontFamily: 'Font Awesome 6 Free', fontWeight: 900 }] },
            } as AgChartOptions;
            const base = new ChartOptions(baseOptions, {} as AgChartOptions, {}, {}, {});

            // A width-only delta takes the fast path, which never re-extracts fonts.
            const updated = new ChartOptions(base, {} as AgChartOptions, {}, {}, {}, { width: 400 });

            expect(updated.fonts).toContain('900 16px "Font Awesome 6 Free"');
        });
    });

    describe('invalid `ontoColor` var fallback (AG-17816 AC4)', () => {
        const mockComputedStyle = (container: HTMLElement, values: Record<string, string>) => {
            vi.spyOn(container.ownerDocument.defaultView!, 'getComputedStyle').mockReturnValue({
                getPropertyValue: (key: string) => values[key] ?? '',
            } as any);
        };

        it('drops the invalid ontoColor, leaving ref + mix (transparency)', () => {
            const container = document.createElement('div');
            mockComputedStyle(container, { '--bad': 'not-a-color' });
            const chartOptions = new ChartOptions({}, {} as AgChartOptions, {}, {}, {});

            const node: any = { foregroundColor: { ref: 'accentColor', mix: 0.5, ontoColor: 'var(--bad)' } };
            chartOptions.processCSSVariablesPartial(node, container);

            expect(node).toEqual({ foregroundColor: { ref: 'accentColor', mix: 0.5 } });
            expect((console.warn as Mock).mock.calls.some(([m]) => String(m).includes('is not a valid color'))).toBe(
                true
            );
        });

        it('resolves a nested var() fallback in ontoColor', () => {
            const container = document.createElement('div');
            mockComputedStyle(container, { '--fallback': '#00ff00' });
            const chartOptions = new ChartOptions({}, {} as AgChartOptions, {}, {}, {});

            const node: any = {
                foregroundColor: { ref: 'accentColor', mix: 0.5, ontoColor: 'var(--onto, var(--fallback))' },
            };
            const cssVariables = chartOptions.processCSSVariablesPartial(node, container);

            expect(cssVariables).toEqual({ 'var(--onto, var(--fallback))': '#00ff00' });
            expect(node.foregroundColor).toEqual({
                ref: 'accentColor',
                mix: 0.5,
                ontoColor: 'var(--onto, var(--fallback))',
            });
        });

        it('deletes only the offending key for a direct-value invalid var', () => {
            const container = document.createElement('div');
            mockComputedStyle(container, { '--bad': 'not-a-color' });
            const chartOptions = new ChartOptions({}, {} as AgChartOptions, {}, {}, {});

            const node: any = { foregroundColor: 'var(--bad)', backgroundColor: 'red' };
            chartOptions.processCSSVariablesPartial(node, container);

            expect(node).toEqual({ backgroundColor: 'red' });
        });

        it('resolves an invalid ontoColor var on a theme param to the ref + mix blend, not undefined', () => {
            const container = document.createElement('div');
            mockComputedStyle(container, {});

            const chartOptions = new ChartOptions(
                {
                    container,
                    theme: {
                        params: {
                            accentColor: '#ff0000',
                            foregroundColor: { ref: 'accentColor', mix: 0.5, ontoColor: 'var(--bad)' },
                        },
                    },
                    data: [{ x: 'a', y: 1 }],
                    series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
                    axes: { x: { type: 'category' }, y: { type: 'number' } },
                } as any,
                {} as AgChartOptions,
                {},
                {},
                {}
            );

            expect((chartOptions.themeParameters as any).foregroundColor).toBe('rgba(255, 0, 0, 0.5)');
            expect((console.warn as Mock).mock.calls.some(([m]) => String(m).includes('is not a valid color'))).toBe(
                true
            );
        });
    });

    describe('CSS-variable validation warning routing', () => {
        it('routes the invalid-colour warning through the instance logger', () => {
            const container = document.createElement('div');
            vi.spyOn(container.ownerDocument.defaultView!, 'getComputedStyle').mockReturnValue({
                getPropertyValue: (key: string) => (key === '--bad' ? 'not-a-color' : ''),
            } as any);
            const logger = new Logger();
            const instanceWarnOnce = vi.spyOn(logger, 'warnOnce');
            const unrelatedWarnOnce = vi.spyOn(ambientLogger, 'warnOnce').mockImplementation(() => {});
            const chartOptions = new ChartOptions(
                {},
                {} as AgChartOptions,
                {},
                {},
                {},
                undefined,
                false,
                false,
                undefined,
                logger
            );

            chartOptions.processCSSVariablesPartial({ foregroundColor: 'var(--bad)' }, container);

            const isInvalidColour = ([m]: unknown[]) => String(m).includes('is not a valid color');
            expect(instanceWarnOnce.mock.calls.some(isInvalidColour)).toBe(true);
            expect(unrelatedWarnOnce.mock.calls.some(isInvalidColour)).toBe(false);
        });

        it('still warns and drops a var() that resolves to an unsupported lch() format (AG-17839)', () => {
            const container = document.createElement('div');
            vi.spyOn(container.ownerDocument.defaultView!, 'getComputedStyle').mockReturnValue({
                getPropertyValue: (key: string) => (key === '--x' ? 'lch(50% 70 40)' : ''),
            } as any);
            const chartOptions = new ChartOptions({}, {} as AgChartOptions, {}, {}, {});

            const node: any = { fill: 'var(--x)' };
            chartOptions.processCSSVariablesPartial(node, container);

            expect(node).toEqual({});
            expect(
                (console.warn as Mock).mock.calls.some(([m]) =>
                    String(m).includes('CSS property [var(--x)] is not a valid color, ignoring.')
                )
            ).toBe(true);
        });
    });

    describe('rejects unsupported color formats at validation time (AG-17839)', () => {
        it('warns and ignores an oklab() color set directly on series[0].fill', () => {
            const options = prepareOptions({
                series: [{ type: 'bar', xKey: 'x', yKey: 'y', fill: 'oklab(0.5 0.1 0.1)' }],
            });

            const message = (console.warn as Mock).mock.calls.map(([m]) => String(m)).find((m) => m.includes('.fill`'));
            expect(message).toContain('Option `series[0].fill`');
            expect(message).toContain('oklab(0.5 0.1 0.1)');
            expect(message).toContain('ignoring.');
            expect((options.series?.[0] as any).fill).not.toBe('oklab(0.5 0.1 0.1)');
        });

        it('warns and clears a lab() theme param instead of reaching a blend op', () => {
            const chartOptions = new ChartOptions(
                {
                    data: [{ x: 'a', y: 1 }],
                    series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
                    axes: { x: { type: 'category' }, y: { type: 'number' } },
                    theme: {
                        params: {
                            accentColor: 'lab(50% 40 59.5)',
                        },
                    },
                } as any,
                {} as AgChartOptions,
                {},
                {},
                {}
            );

            const message = (console.warn as Mock).mock.calls
                .map(([m]) => String(m))
                .find((m) => m.includes('theme.params.accentColor'));
            expect(message).toContain('Option `theme.params.accentColor`');
            expect(message).toContain('lab(50% 40 59.5)');
            expect(message).toContain('ignoring.');
            expect((chartOptions.themeParameters as any).accentColor).not.toBe('lab(50% 40 59.5)');
            expect((chartOptions.themeParameters as any).accentColor).toBeDefined();
        });

        it('rejects an lch() color stop in colorScale.fills[].color', () => {
            ModuleRegistry.setRegistryMode(ModuleRegistry.RegistryMode.Enterprise);
            try {
                const options = prepareOptions<AgCartesianChartOptions>({
                    series: [
                        {
                            type: 'scatter',
                            xKey: 'x',
                            yKey: 'y',
                            colorKey: 'x',
                            colorScale: {
                                fills: [
                                    { color: 'red', stop: 0 },
                                    { color: 'lch(50% 70 40)', stop: 1 },
                                ],
                            },
                        } as any,
                    ],
                });

                const message = (console.warn as Mock).mock.calls
                    .map(([m]) => String(m))
                    .find((m) => m.includes('colorScale'));
                expect(message).toContain('colorScale');
                expect(message).toContain('lch(50% 70 40)');
                expect(message).toContain('ignoring.');
                expect((options.series?.[0] as any).colorScale?.fills?.[1]?.color).not.toBe('lch(50% 70 40)');
            } finally {
                ModuleRegistry.clearRegistryModes();
            }
        });
    });

    describe('theme overrides and conditional defaults', () => {
        const barOptions = (overrides: object) => ({
            data: [{ category: 'A', value: 5 }],
            series: [{ type: 'bar', xKey: 'category', yKey: 'value' }],
            theme: { overrides: { bar: { series: overrides } } },
        });

        it('resolves a conditional default from a value supplied through theme overrides', () => {
            const prepared: any = prepareOptions(barOptions({ stroke: 'rgb(190, 55, 55)' }) as any);

            expect(prepared.series[0].strokeWidth).toBe(2);
        });

        // Themes style; they do not activate. Only an explicit `enabled` switches a border on.
        it('does not enable a feature from styling supplied through theme overrides', () => {
            const prepared: any = prepareOptions(
                barOptions({ label: { border: { stroke: 'rgb(190, 55, 55)' } } }) as any
            );

            expect(prepared.series[0].label.border?.enabled ?? false).toBe(false);
        });

        it('honours an explicit enabled supplied through theme overrides', () => {
            const prepared: any = prepareOptions(
                barOptions({ label: { border: { enabled: true, stroke: 'rgb(190, 55, 55)' } } }) as any
            );

            expect(prepared.series[0].label.border.enabled).toBe(true);
        });
    });

    describe('negative padding validation (AG-17973)', () => {
        it('rejects negative chart-level padding and keeps the theme default', () => {
            const options = prepareOptions<AgChartOptions>({
                padding: { top: -20, right: -20, bottom: -20, left: -20 },
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            });

            const messages = (console.warn as Mock).mock.calls.map(([m]) => String(m));
            expect(messages).toHaveLength(4);
            expect(messages.every((m) => m.startsWith('AG Charts - Option `padding.'))).toBe(true);
            expect(messages.every((m) => m.includes('expecting a number greater than or equal to 0'))).toBe(true);
            // The invalid object padding is dropped in full, so the theme default (20 on every side) applies.
            expect((options as any).padding).toEqual({ top: 20, right: 20, bottom: 20, left: 20 });
        });

        it('rejects negative padding on a series label box and keeps the theme default', () => {
            const options = prepareOptions<AgChartOptions>({
                series: [{ type: 'bar', xKey: 'x', yKey: 'y', label: { padding: -20 } } as AgBarSeriesOptions],
            });

            const messages = (console.warn as Mock).mock.calls.map(([m]) => String(m));
            expect(messages).toHaveLength(1);
            expect(messages[0]).toContain('Option `series[0].label.padding` cannot be set to `-20`');
            expect(messages[0]).toContain('expecting a number greater than or equal to 0');
            // The invalid scalar padding is dropped, so the bar label's theme default (8) applies.
            expect((options.series?.[0] as any).label.padding).toBe(8);
        });

        it('rejects negative legend item padding and keeps the theme default', () => {
            const options = prepareOptions<AgChartOptions>({
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                legend: { item: { padding: -10 } },
            });

            const messages = (console.warn as Mock).mock.calls.map(([m]) => String(m));
            expect(messages).toHaveLength(1);
            expect(messages[0]).toContain('Option `legend.item.padding` cannot be set to `-10`');
            expect(messages[0]).toContain('expecting a number greater than or equal to 0');
            // The invalid scalar padding is dropped, so the legend item's theme default applies.
            expect((options as any).legend.item.padding).toEqual({ top: 4, right: 8, bottom: 4, left: 8 });
        });

        it('does not warn and preserves a negative padding on a cross-line label (deliberate exemption)', () => {
            const options = prepareOptions<AgCartesianChartOptions>({
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                axes: {
                    x: { type: 'category', position: 'bottom' },
                    y: {
                        type: 'number',
                        position: 'left',
                        crossLines: [{ type: 'line', value: 5, label: { text: 'threshold', padding: -30 } }],
                    },
                },
            });

            const messages = (console.warn as Mock).mock.calls.map(([m]) => String(m));
            expect(messages.some((m) => m.includes('padding'))).toBe(false);
            expect((options.axes as any).y.crossLines[0].label.padding).toBe(-30);
        });
    });

    const invalidOptions = (extra?: object): AgChartOptions =>
        ({
            series: [{ type: 'line', xKey: 'x', yKey: 'y', strokeWidth: 'notanumber' as any }],
            ...extra,
        }) as AgChartOptions;

    describe('validations.consoleLogLevel', () => {
        it('silences first-render validation warnings when set to `none`, without silencing validation itself', () => {
            const chartOptions = new ChartOptions(
                invalidOptions({ validations: { consoleLogLevel: 'none' } }),
                {} as AgChartOptions,
                {},
                {},
                {}
            );

            expect(console.warn).not.toHaveBeenCalled();
            expect(chartOptions.validationIssues.length).toBeGreaterThan(0);
        });

        it('warns for the same invalid options without a consoleLogLevel override', () => {
            const chartOptions = new ChartOptions(invalidOptions(), {} as AgChartOptions, {}, {}, {});

            expect(console.warn).toHaveBeenCalled();
            expect(chartOptions.validationIssues.length).toBeGreaterThan(0);
        });

        it('silences validation warnings when set to `error`', () => {
            const chartOptions = new ChartOptions(
                invalidOptions({ validations: { consoleLogLevel: 'error' } }),
                {} as AgChartOptions,
                {},
                {},
                {}
            );

            expect(console.warn).not.toHaveBeenCalled();
            expect(chartOptions.validationIssues.length).toBeGreaterThan(0);
        });

        it('reports an invalid consoleLogLevel value rather than silencing logging with it', () => {
            const chartOptions = new ChartOptions(
                invalidOptions({ validations: { consoleLogLevel: 'verbose' } }),
                {} as AgChartOptions,
                {},
                {},
                {}
            );

            expect(chartOptions.validationIssues.some((issue) => issue.code === 'validations.consoleLogLevel')).toBe(
                true
            );
            const messages = (console.warn as Mock).mock.calls.map(([m]) => String(m));
            expect(messages.some((m) => m.includes('validations.consoleLogLevel'))).toBe(true);
            expect(messages.some((m) => m.includes('notanumber'))).toBe(true);
        });

        it('reports an explicit null consoleLogLevel rather than deferring to a silencing override', () => {
            const chartOptions = new ChartOptions(
                invalidOptions({ validations: { consoleLogLevel: null } }),
                {} as AgChartOptions,
                { validations: { consoleLogLevel: 'none' } } as Partial<AgChartOptions>,
                {},
                {}
            );

            const messages = (console.warn as Mock).mock.calls.map(([m]) => String(m));
            expect(messages.some((m) => m.includes('notanumber'))).toBe(true);
            expect(chartOptions.validationIssues.length).toBeGreaterThan(0);
        });

        it('returns to default logging once a delta update removes a `none` override', () => {
            const base = new ChartOptions(
                invalidOptions({ validations: { consoleLogLevel: 'none' } }),
                {} as AgChartOptions,
                {},
                {},
                {}
            );
            expect(console.warn).not.toHaveBeenCalled();

            const updated = new ChartOptions(base, invalidOptions(), {}, {}, {});

            expect(console.warn).toHaveBeenCalled();
            expect(updated.validationIssues.length).toBeGreaterThan(0);
        });
    });

    describe('validations.throwOn', () => {
        it('does not throw for the default (option absent), and still logs the existing warning', () => {
            const chartOptions = new ChartOptions(invalidOptions(), {} as AgChartOptions, {}, {}, {});

            expect(console.warn).toHaveBeenCalled();
            expect(chartOptions.validationIssues.length).toBeGreaterThan(0);
        });

        it('does not throw when explicitly set to `none`', () => {
            expect(
                () =>
                    new ChartOptions(
                        invalidOptions({ validations: { throwOn: 'none' } }),
                        {} as AgChartOptions,
                        {},
                        {},
                        {}
                    )
            ).not.toThrow();

            expect(console.warn).toHaveBeenCalled();
        });

        it.each(['loud', null, 42])(
            'does not throw for an unrecognised throwOn value (%s), and the union validator still reports it',
            (badValue) => {
                let chartOptions!: ChartOptions<AgChartOptions>;
                expect(() => {
                    chartOptions = new ChartOptions(
                        invalidOptions({ validations: { throwOn: badValue } }),
                        {} as AgChartOptions,
                        {},
                        {},
                        {}
                    );
                }).not.toThrow();

                expect(chartOptions.validationIssues.some((issue) => issue.code === 'validations.throwOn')).toBe(true);
                const messages = (console.warn as Mock).mock.calls.map(([m]) => String(m));
                expect(messages.some((m) => m.includes('validations.throwOn'))).toBe(true);
            }
        );

        it('throws on a warning-severity option error, naming the option path in the message', () => {
            expect(
                () =>
                    new ChartOptions(
                        invalidOptions({ validations: { throwOn: 'warning' } }),
                        {} as AgChartOptions,
                        {},
                        {},
                        {}
                    )
            ).toThrowError(/^AG Charts - validations\.throwOn: warning - `series\[0\]\.strokeWidth`: /);
        });

        it('does not claim the option was ignored in the thrown message, while the console record is unchanged (TC2)', () => {
            expect(
                () =>
                    new ChartOptions(
                        invalidOptions({ validations: { throwOn: 'warning' } }),
                        {} as AgChartOptions,
                        {},
                        {},
                        {}
                    )
            ).toThrowError(/expecting a number greater than or equal to 0\.$/);

            // The warn-and-default wording still describes the console record accurately: it is written
            // for every chart, armed or not, and unarmed charts really do ignore the value.
            const messages = (console.warn as Mock).mock.calls.map(([m]) => String(m));
            expect(messages.some((m) => m.endsWith(', ignoring.'))).toBe(true);
        });

        it('writes the console record before throwing (AC2)', () => {
            expect(
                () =>
                    new ChartOptions(
                        invalidOptions({ validations: { throwOn: 'warning' } }),
                        {} as AgChartOptions,
                        {},
                        {},
                        {}
                    )
            ).toThrow();

            const messages = (console.warn as Mock).mock.calls.map(([m]) => String(m));
            expect(messages.some((m) => m.includes('notanumber'))).toBe(true);
        });

        it('throws for the first qualifying issue rather than collecting the whole batch first (AC3)', () => {
            const options: AgChartOptions = {
                series: [
                    {
                        type: 'line',
                        xKey: 'x',
                        yKey: 'y',
                        strokeWidth: 'notanumber' as any,
                        lineDash: 'notanarray' as any,
                    },
                ],
                validations: { throwOn: 'warning' },
            } as AgChartOptions;

            expect(() => new ChartOptions(options, {} as AgChartOptions, {}, {}, {})).toThrow();

            expect(console.warn).toHaveBeenCalledTimes(1);
        });

        it('does not throw at `error` for a warning-severity option error (nothing in the option pass is error-severity)', () => {
            expect(
                () =>
                    new ChartOptions(
                        invalidOptions({ validations: { throwOn: 'error' } }),
                        {} as AgChartOptions,
                        {},
                        {},
                        {}
                    )
            ).not.toThrow();

            expect(console.warn).toHaveBeenCalled();
        });

        it('throws at `deprecation` too, since the threshold is inclusive of every louder severity', () => {
            expect(
                () =>
                    new ChartOptions(
                        invalidOptions({ validations: { throwOn: 'deprecation' } }),
                        {} as AgChartOptions,
                        {},
                        {},
                        {}
                    )
            ).toThrowError(/^AG Charts - validations\.throwOn: warning - /);
        });

        it('re-validates and throws again on a warm update, rather than carrying validation issues forward (S6/D4)', () => {
            const validOptions: AgChartOptions = {
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                validations: { throwOn: 'warning' },
            } as AgChartOptions;

            const base = new ChartOptions(validOptions, {} as AgChartOptions, {}, {}, {});
            expect(console.warn).not.toHaveBeenCalled();

            expect(
                () => new ChartOptions(base, invalidOptions({ validations: { throwOn: 'warning' } }), {}, {}, {})
            ).toThrow();
        });

        it('does not throw when fail-fast is suppressed for the CSS-refresh re-construction', () => {
            expect(
                () =>
                    new ChartOptions(
                        invalidOptions({ validations: { throwOn: 'warning' } }),
                        {} as AgChartOptions,
                        {},
                        {},
                        {},
                        undefined,
                        false,
                        true
                    )
            ).not.toThrow();
        });

        describe('unregistered modules (AC5)', () => {
            const unregisteredAxisOptions = (extra?: object): AgChartOptions =>
                ({
                    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                    axes: {
                        x: { type: 'ordinal-time', position: 'bottom' },
                        y: { type: 'number', position: 'left' },
                    },
                    ...extra,
                }) as any;

            it('throws at `error` for a dropped axis module, after the console record is written', () => {
                const logger = new Logger();

                expect(() =>
                    prepareOptions(unregisteredAxisOptions({ validations: { throwOn: 'error' } }), logger)
                ).toThrow(/required modules are not registered/);

                const messages = (console.error as Mock).mock.calls.map(([m]) => String(m));
                expect(messages.some((m) => m.includes('required modules are not registered'))).toBe(true);
            });

            it('silently drops the unregistered module at `none`, exactly as today', () => {
                const logger = new Logger();

                expect(() => prepareOptions(unregisteredAxisOptions(), logger)).not.toThrow();

                const messages = (console.error as Mock).mock.calls.map(([m]) => String(m));
                expect(messages.some((m) => m.includes('required modules are not registered'))).toBe(true);
            });

            it('throws at `error` for a dropped plugin module too, not just series/axes', () => {
                const logger = new Logger();
                const options = {
                    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                    zoom: { enabled: true },
                    validations: { throwOn: 'error' },
                } as AgChartOptions;

                expect(() => prepareOptions(options, logger)).toThrow(/required modules are not registered/);

                const messages = (console.error as Mock).mock.calls.map(([m]) => String(m));
                expect(messages.some((m) => m.includes('required modules are not registered'))).toBe(true);
            });
        });
    });

    describe('validations.onErrorRaised', () => {
        const badStrokeWidthOptions = (validations?: object) =>
            ({
                series: [{ type: 'line', xKey: 'x', yKey: 'y', strokeWidth: 'notanumber' }],
                validations,
            }) as unknown as AgChartOptions;

        // `onErrorRaised` is wired up on the `Chart`, absent at this level, so assert on
        // `validationIssues`, the array the listener is fed from.
        it('records an issue whose message matches the console warning content', () => {
            const chartOptions = new ChartOptions(badStrokeWidthOptions(), {} as AgChartOptions, {}, {}, {});

            const messages = (console.warn as Mock).mock.calls.map(([m]) => String(m));
            expect(chartOptions.validationIssues).toContainEqual({
                severity: 'warning',
                message:
                    'Option `series[0].strokeWidth` cannot be set to `"notanumber"`; expecting a number greater than or equal to 0, ignoring.',
                code: 'series[0].strokeWidth',
            });
            expect(messages).toContain(
                'AG Charts - Option `series[0].strokeWidth` cannot be set to `"notanumber"`; expecting a number greater than or equal to 0, ignoring.'
            );
        });

        it('records the issue independently of `consoleLogLevel` silencing the console', () => {
            const chartOptions = new ChartOptions(
                badStrokeWidthOptions({ consoleLogLevel: 'none' }),
                {} as AgChartOptions,
                {},
                {},
                {}
            );

            expect(console.warn).not.toHaveBeenCalled();
            expect(chartOptions.validationIssues).toContainEqual({
                severity: 'warning',
                message:
                    'Option `series[0].strokeWidth` cannot be set to `"notanumber"`; expecting a number greater than or equal to 0, ignoring.',
                code: 'series[0].strokeWidth',
            });
        });

        it('rejects a non-function `onErrorRaised` without throwing', () => {
            let chartOptions: ChartOptions | undefined;
            expect(() => {
                chartOptions = new ChartOptions(
                    {
                        series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                        validations: { onErrorRaised: 'not-a-function' as any },
                    } as AgChartOptions,
                    {} as AgChartOptions,
                    {},
                    {},
                    {}
                );
            }).not.toThrow();

            expect(chartOptions!.validationIssues).toContainEqual({
                severity: 'warning',
                message:
                    'Option `validations.onErrorRaised` cannot be set to `"not-a-function"`; expecting a function, ignoring.',
                code: 'validations.onErrorRaised',
            });
        });
    });
});
