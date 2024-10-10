import type {
    AgBaseSparklinePresetOptions,
    AgCartesianChartOptions,
    AgCartesianSeriesOptions,
    AgChartTheme,
    AgChartThemeName,
    AgSparklineOptions,
    AgTooltipPositionType,
} from 'ag-charts-types';

import { IS_ENTERPRISE } from '../../chart/themes/symbols';
import { IGNORED_PROP, assertEmpty, pickProps } from './presetUtils';

const commonAxisProperties = {
    line: {
        enabled: false,
    },
    title: {
        enabled: false,
    },
    label: {
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
                    gridLine: {
                        enabled: false,
                    },
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
    chartOpts.axes = swapAxes
        ? [
              { type: 'number', ...yAxis, position: 'left' },
              { type: 'category', ...xAxis, position: 'bottom' },
          ]
        : [
              { type: 'category', ...xAxis, position: 'left' },
              { type: 'number', ...yAxis, position: 'bottom' },
          ];

    return chartOpts;
}
