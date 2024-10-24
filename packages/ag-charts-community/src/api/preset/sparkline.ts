import {
    type AgAxisGridLineOptions,
    type AgAxisLineOptions,
    type AgBaseSparklinePresetOptions,
    type AgCartesianAxisOptions,
    type AgCartesianChartOptions,
    type AgCartesianSeriesOptions,
    type AgCategoryAxisOptions,
    type AgChartTheme,
    type AgChartThemeName,
    type AgLogAxisOptions,
    type AgNumberAxisOptions,
    type AgOrdinalTimeAxisOptions,
    type AgSparklineAxisOptions,
    type AgSparklineOptions,
    type AgTimeAxisOptions,
    type AgTooltipPositionType,
} from 'ag-charts-types';

import { IS_ENTERPRISE } from '../../chart/themes/symbols';
import { IGNORED_PROP, assertEmpty, pickProps } from './presetUtils';

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
        strokeOpacity: 0.25,
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

const bottomCrossHairAxisProperties = {
    bottom: {
        crosshair: {
            enabled: IS_ENTERPRISE,
        },
    },
};

const crossHairAxes = {
    category: bottomCrossHairAxisProperties,
    number: bottomCrossHairAxisProperties,
    log: bottomCrossHairAxisProperties,
    time: bottomCrossHairAxisProperties,
};

const crossHairTooltip = {
    position: {
        type: 'sparkline' as any as AgTooltipPositionType,
    },
};

const SPARKLINE_THEME: AgChartTheme = {
    overrides: {
        common: {
            animation: {
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
                // @ts-expect-error
                sparklineMode: true,
            },
            tooltip: {
                range: 'nearest',
            },
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
            axes: crossHairAxes,
            series: {
                // @ts-expect-error
                sparklineMode: true,
                strokeWidth: 1,
                marker: {
                    enabled: false,
                    size: 3,
                },
                tooltip: crossHairTooltip,
            },
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
            axes: crossHairAxes,
            series: {
                strokeWidth: 1,
                fillOpacity: 0.4,
                tooltip: crossHairTooltip,
            },
        },
    },
};

function setInitialBaseTheme(
    baseTheme: AgChartTheme | AgChartThemeName | undefined,
    initialBaseTheme: AgChartTheme
): AgChartTheme {
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

function axis(opts: AgSparklineAxisOptions): AgCartesianAxisOptions {
    switch (opts.type) {
        case 'number': {
            const { type, visible, stroke, strokeWidth, min, max, ...optsRest } = opts;
            assertEmpty(optsRest);
            return pickProps<Pick<AgNumberAxisOptions, 'type' | 'min' | 'max'>>(opts, {
                type: 'number',
                min,
                max,
            });
        }
        case 'log': {
            const { type, visible, stroke, strokeWidth, min, max, base, ...optsRest } = opts;
            assertEmpty(optsRest);
            return pickProps<Pick<AgLogAxisOptions, 'type' | 'min' | 'max' | 'base'>>(opts, {
                type: 'log',
                min,
                max,
                base,
            });
        }
        case 'time': {
            const { type, visible, stroke, strokeWidth, min, max, ...optsRest } = opts;
            assertEmpty(optsRest);
            return pickProps<Pick<AgTimeAxisOptions, 'type' | 'min' | 'max'>>(opts, {
                type: 'time',
                min,
                max,
            });
        }
        case 'category': {
            const { type, visible, stroke, strokeWidth, paddingInner, paddingOuter, ...optsRest } = opts;
            assertEmpty(optsRest);
            return pickProps<Pick<AgCategoryAxisOptions, 'type' | 'paddingInner' | 'paddingOuter'>>(opts, {
                type: 'category',
                paddingInner,
                paddingOuter,
            });
        }
        case 'ordinal-time': {
            const { type, visible, stroke, strokeWidth, paddingInner, paddingOuter, interval, ...optsRest } = opts;
            assertEmpty(optsRest);
            return pickProps<Pick<AgOrdinalTimeAxisOptions, 'type' | 'paddingInner' | 'paddingOuter' | 'interval'>>(
                opts,
                {
                    type: 'ordinal-time',
                    paddingInner,
                    paddingOuter,
                    interval,
                }
            );
        }
    }
}

function axisLineOptions(opts: AgSparklineAxisOptions | undefined, defaultEnabled: boolean): AgAxisLineOptions {
    const lineOpts: AgAxisLineOptions = {};
    lineOpts.enabled = opts?.visible;
    if (opts?.stroke != null) {
        lineOpts.stroke = opts?.stroke;
        lineOpts.enabled ??= true;
    }
    if (opts?.strokeWidth != null) {
        lineOpts.width = opts?.strokeWidth;
        lineOpts.enabled ??= true;
    }
    lineOpts.enabled ??= defaultEnabled;
    return lineOpts;
}

function axisGridLineOptions(opts: AgSparklineAxisOptions | undefined, defaultEnabled: boolean): AgAxisGridLineOptions {
    const gridLineOpts: AgAxisGridLineOptions = {};
    gridLineOpts.enabled = opts?.visible;
    if (opts?.stroke != null) {
        gridLineOpts.style = [{ stroke: opts?.stroke }];
        gridLineOpts.enabled ??= true;
    }
    if (opts?.strokeWidth != null) {
        gridLineOpts.width = opts?.strokeWidth;
        gridLineOpts.enabled ??= true;
    }
    gridLineOpts.enabled ??= defaultEnabled;
    return gridLineOpts;
}

function seriesAxisTheme(
    seriesType: AgCartesianSeriesOptions['type'],
    xAxisOpts: AgSparklineAxisOptions | undefined,
    yAxisOpts: AgSparklineAxisOptions | undefined
): { x: Omit<AgCartesianAxisOptions, 'type'>; y: Omit<AgCartesianAxisOptions, 'type'> } | undefined {
    switch (seriesType) {
        case 'bar':
            return {
                x: {
                    line: axisLineOptions(xAxisOpts, true),
                },
                y: {
                    line: axisLineOptions(yAxisOpts, false),
                },
            };
        case 'line':
        case 'area':
            return {
                x: {
                    gridLine: axisGridLineOptions(yAxisOpts, false),
                },
                y: {
                    gridLine: axisGridLineOptions(xAxisOpts, false),
                },
            };
    }
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
        padding,
        width,
        theme: baseTheme,
        data,
        xAxis,
        yAxis,
        ...optsRest
    } = opts as any as AgBaseSparklinePresetOptions;
    assertEmpty(optsRest);

    const seriesOptions = optsRest as any as AgCartesianSeriesOptions;

    const swapAxes = seriesOptions.type !== 'bar' || seriesOptions.direction !== 'horizontal';

    const chartOpts: AgCartesianChartOptions = pickProps<AgBaseSparklinePresetOptions>(opts, {
        background,
        container,
        height,
        listeners,
        locale,
        minHeight,
        minWidth,
        padding,
        width,
        data,
        xAxis: IGNORED_PROP,
        yAxis: IGNORED_PROP,
        theme: IGNORED_PROP,
    });

    chartOpts.theme = setInitialBaseTheme(baseTheme, SPARKLINE_THEME);
    chartOpts.series = [seriesOptions];

    const axisTheme = seriesAxisTheme(seriesOptions.type ?? 'line', xAxis, yAxis);
    const xAxisBase: AgCartesianAxisOptions = {
        ...(xAxis != null ? axis(xAxis) : { type: 'category' }),
        ...axisTheme?.x,
    };
    const yAxisBase: AgCartesianAxisOptions = {
        ...(yAxis != null ? axis(yAxis) : { type: 'number' }),
        ...axisTheme?.y,
    };

    chartOpts.axes = swapAxes
        ? [
              { ...yAxisBase, position: 'left' },
              { ...xAxisBase, position: 'bottom' },
          ]
        : [
              { ...xAxisBase, position: 'left' },
              { ...yAxisBase, position: 'bottom' },
          ];

    return chartOpts;
}
