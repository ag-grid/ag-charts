import { simpleMemorize } from 'ag-charts-core';
import type {
    AgAreaSeriesOptions,
    AgAreaSeriesTooltipRendererParams,
    AgAxisGridLineOptions,
    AgBarSeriesOptions,
    AgBarSeriesTooltipRendererParams,
    AgBaseSparklinePresetOptions,
    AgCartesianAxisOptions,
    AgCartesianChartOptions,
    AgCategoryAxisOptions,
    AgChartTheme,
    AgChartThemeName,
    AgChartTooltipOptions,
    AgCommonThemeableAxisOptions,
    AgLineSeriesOptions,
    AgLineSeriesTooltipRendererParams,
    AgNumberAxisOptions,
    AgSparklineAxisOptions,
    AgSparklineOptions,
    AgSparklineTooltip,
    AgTimeAxisOptions,
    AgTooltipRendererResult,
    WithThemeParams,
} from 'ag-charts-types';

import { DEFAULT_SPARKLINE_CROSSHAIR_STROKE } from '../../chart/themes/symbols';
import { IGNORED_PROP, pickProps } from './presetUtils';

const commonAxisProperties = {
    title: {
        enabled: false,
    },
    label: {
        enabled: false,
    },
    line: {
        enabled: false,
    },
    gridLine: {
        enabled: false,
    },
    crosshair: {
        enabled: false,
        stroke: DEFAULT_SPARKLINE_CROSSHAIR_STROKE,
        lineDash: [0],
        label: {
            enabled: false,
        },
    },
};

const numericAxisProperties = {
    ...commonAxisProperties,
    nice: false,
};

const chartTooltipDefaults: AgChartTooltipOptions = {
    mode: 'compact',
    position: {
        anchorTo: 'node',
        placement: ['right', 'left'],
    },
    showArrow: false,
};

const barGridLineDefaults: WithThemeParams<AgAxisGridLineOptions> = {
    style: [{ stroke: { $ref: 'gridLineColor' } }],
    width: 2,
};

const barAxisDefaults: WithThemeParams<AgCommonThemeableAxisOptions> = {
    number: {
        gridLine: barGridLineDefaults,
    },
    time: {
        gridLine: barGridLineDefaults,
    },
    category: {
        gridLine: barGridLineDefaults,
    },
};

const SPARKLINE_THEME: WithThemeParams<AgChartTheme> = {
    overrides: {
        common: {
            animation: { enabled: false },
            contextMenu: { enabled: false },
            keyboard: { enabled: false },
            background: { visible: false },
            navigator: {
                enabled: false,
            },
            padding: {
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
            },
            axes: {
                number: {
                    ...numericAxisProperties,
                    interval: {
                        values: [0],
                    },
                },
                log: {
                    ...numericAxisProperties,
                },
                time: {
                    ...numericAxisProperties,
                },
                category: {
                    ...commonAxisProperties,
                },
            },
        },
        bar: {
            series: {
                crisp: false,
                label: {
                    placement: 'inside-end',
                    padding: 4,
                },
                // @ts-expect-error undocumented option
                sparklineMode: true,
            },
            tooltip: {
                ...chartTooltipDefaults,
                position: {
                    ...chartTooltipDefaults.position,
                    anchorTo: 'pointer',
                },
                range: 'nearest',
            },
            axes: barAxisDefaults,
        },
        line: {
            seriesArea: {
                padding: {
                    top: 2,
                    right: 2,
                    bottom: 2,
                    left: 2,
                },
            },
            series: {
                // @ts-expect-error undocumented option
                sparklineMode: true,
                strokeWidth: 1,
                marker: {
                    enabled: false,
                    size: 3,
                },
            },
            tooltip: chartTooltipDefaults,
        },
        area: {
            seriesArea: {
                padding: {
                    top: 1,
                    right: 0,
                    bottom: 1,
                    left: 0,
                },
            },
            series: {
                strokeWidth: 1,
                fillOpacity: 0.4,
            },
            tooltip: chartTooltipDefaults,
        },
    },
};

const setInitialBaseTheme = simpleMemorize(createInitialBaseTheme);

function createInitialBaseTheme(
    baseTheme: AgChartTheme | AgChartThemeName | undefined,
    initialBaseTheme: WithThemeParams<AgChartTheme>
): WithThemeParams<AgChartTheme> {
    if (typeof baseTheme === 'string') {
        return {
            ...initialBaseTheme,
            baseTheme,
        };
    }

    if (baseTheme != null) {
        return {
            ...baseTheme,
            // @ts-expect-error internal implementation
            baseTheme: setInitialBaseTheme(baseTheme.baseTheme, initialBaseTheme),
        };
    }

    return initialBaseTheme;
}

export function sparklineDataPreset(data: any[] | undefined): {
    data: any[] | undefined;
    series?: { xKey: string; yKey: string }[];
    datumKey?: string;
} {
    if (Array.isArray(data) && data.length !== 0) {
        const firstItem = data.find((v) => v != null);
        if (typeof firstItem === 'number') {
            const mappedData = data.map((y, x) => ({ x, y }));
            return { data: mappedData, series: [{ xKey: 'x', yKey: 'y' }], datumKey: 'y' };
        } else if (Array.isArray(firstItem)) {
            const mappedData = data.map((datum) => ({ x: datum?.[0], y: datum?.[1], datum }));
            return { data: mappedData, series: [{ xKey: 'x', yKey: 'y' }], datumKey: 'datum' };
        }
    } else if (data?.length === 0) {
        return { data, series: [{ xKey: 'x', yKey: 'y' }], datumKey: 'y' };
    }
    return { data };
}

function axisPreset(opts: AgSparklineAxisOptions | undefined): AgCartesianAxisOptions {
    switch (opts?.type) {
        case 'number': {
            const { type, min, max, reverse } = opts;
            return pickProps<Pick<AgNumberAxisOptions, 'type' | 'reverse' | 'min' | 'max'>>(opts, {
                type,
                reverse,
                min,
                max,
            });
        }
        case 'time': {
            const { type, min, max, reverse } = opts;
            return pickProps<Pick<AgTimeAxisOptions, 'type' | 'reverse' | 'min' | 'max'>>(opts, {
                type,
                reverse,
                min,
                max,
            });
        }
        case 'category':
        default: {
            const { paddingInner, paddingOuter, reverse } = opts ?? {};
            return pickProps<Pick<AgCategoryAxisOptions, 'type' | 'reverse' | 'paddingInner' | 'paddingOuter'>>(
                { ...opts, type: 'category' },
                {
                    type: 'category',
                    reverse,
                    paddingInner,
                    paddingOuter,
                }
            );
        }
    }
}

function gridLinePreset(
    opts: AgSparklineAxisOptions | undefined,
    defaultEnabled: boolean,
    sparkOpts: AgSparklineOptions
): AgAxisGridLineOptions {
    const gridLineOpts: AgAxisGridLineOptions = {};

    if (opts?.stroke != null) {
        gridLineOpts.style = [{ stroke: opts?.stroke }];
        gridLineOpts.enabled ??= true;
    }
    if (opts?.strokeWidth != null) {
        gridLineOpts.width = opts?.strokeWidth;
        gridLineOpts.enabled ??= true;
    }
    if (sparkOpts.type === 'bar' && sparkOpts.direction !== 'horizontal') {
        gridLineOpts.enabled ??= true;
    }
    if (opts?.visible != null) {
        gridLineOpts.enabled = opts.visible;
    }
    gridLineOpts.enabled ??= defaultEnabled;
    return gridLineOpts;
}

const tooltipRendererFn = simpleMemorize((context: any, tooltip?: AgSparklineTooltip<any>, datumKey?: string) => {
    return (
        params: AgBarSeriesTooltipRendererParams | AgLineSeriesTooltipRendererParams | AgAreaSeriesTooltipRendererParams
    ): AgTooltipRendererResult | string => {
        const xValue = params.datum[params.xKey];
        const yValue = params.datum[params.yKey];
        const datum = datumKey == null ? params.datum : params.datum[datumKey];

        const userContent = tooltip?.renderer?.({ context, datum, xValue, yValue });
        if (typeof userContent === 'string') return userContent;

        const content = userContent?.content ?? yValue.toFixed(2);

        return userContent?.title
            ? {
                  heading: undefined,
                  title: undefined,
                  data: [{ label: userContent.title, value: content }],
              }
            : {
                  heading: undefined,
                  title: content,
                  data: [],
              };
    };
});

interface UndocumentedProperties {
    overrideDevicePixelRatio?: number;
}

export function sparkline(opts: AgSparklineOptions): AgCartesianChartOptions {
    const {
        background,
        container,
        height,
        listeners,
        locale,
        minHeight,
        minWidth,
        overrideDevicePixelRatio,
        padding,
        width,
        theme: baseTheme,
        data: baseData,
        crosshair,
        axis,
        min,
        max,
        tooltip,
        context,
        styleNonce,
        ...optsRest
    } = opts as any as AgBaseSparklinePresetOptions & UndocumentedProperties;

    const chartOpts: AgCartesianChartOptions = pickProps<AgBaseSparklinePresetOptions & UndocumentedProperties>(opts, {
        background,
        container,
        height,
        listeners,
        locale,
        minHeight,
        minWidth,
        overrideDevicePixelRatio,
        padding,
        width,
        styleNonce,
        tooltip: IGNORED_PROP,
        context: IGNORED_PROP,
        data: IGNORED_PROP,
        crosshair: IGNORED_PROP,
        axis: IGNORED_PROP,
        min: IGNORED_PROP,
        max: IGNORED_PROP,
        theme: IGNORED_PROP,
    });

    const { data, series: [seriesOverrides] = [], datumKey } = sparklineDataPreset(baseData);

    const seriesOptions = optsRest as any as AgBarSeriesOptions | AgLineSeriesOptions | AgAreaSeriesOptions;

    // Assign is safe as it comes from a rest object
    if (seriesOverrides != null) Object.assign(seriesOptions, seriesOverrides);
    seriesOptions.tooltip = {
        ...tooltip,
        renderer: tooltipRendererFn(context, tooltip, datumKey),
    };

    chartOpts.theme = setInitialBaseTheme(baseTheme, SPARKLINE_THEME) as AgChartTheme; // TODO: Remove cast when `WithThemeParams` is public
    chartOpts.data = data;
    chartOpts.series = [seriesOptions];

    const swapAxes = seriesOptions.type === 'bar' && seriesOptions.direction === 'horizontal';
    const [crossAxisPosition, numberAxisPosition] = swapAxes
        ? (['left', 'bottom'] as const)
        : (['bottom', 'left'] as const);

    const crossAxis: AgCartesianAxisOptions = {
        ...axisPreset(axis),
        position: crossAxisPosition,
        ...pickProps<Pick<AgCartesianAxisOptions, 'crosshair'>>(opts, { crosshair }),
    };
    const numberAxis: AgCartesianAxisOptions = {
        type: 'number',
        gridLine: gridLinePreset(axis, false, opts),
        position: numberAxisPosition,
        ...pickProps<Pick<AgNumberAxisOptions, 'min' | 'max'>>(opts, { min, max }),
    };

    chartOpts.axes = swapAxes ? { x: numberAxis, y: crossAxis } : { x: crossAxis, y: numberAxis };

    return chartOpts;
}
