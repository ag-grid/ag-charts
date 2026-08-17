import { DEFAULT_SPARKLINE_CROSSHAIR_STROKE } from 'ag-charts-core';
import type {
    AgAxisGridLineOptions,
    AgChartTooltipOptions,
    AgCommonThemeableAxisOptions,
    ExtensibleTheme,
    WithThemeParams,
} from 'ag-charts-types';

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

// `width` alone: the axis template's `style` derives its `strokeWidth` from it, and specifying
// `style` here would replace that operation rather than compose with it.
const barGridLineDefaults: WithThemeParams<AgAxisGridLineOptions> = {
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

export const sparklineThemeTemplate: ExtensibleTheme = {
    common: {
        animation: { enabled: false },
        contextMenu: { enabled: false },
        keyboard: { enabled: false },
        background: { visible: false },
        navigator: { enabled: false },
        padding: { $applyPadding: 0 },
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
            padding: { $applyPadding: 2 },
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
                $applyPadding: {
                    top: 1,
                    right: 0,
                    bottom: 1,
                    left: 0,
                },
            },
        },
        series: {
            strokeWidth: 1,
            fillOpacity: 0.4,
        },
        tooltip: chartTooltipDefaults,
    },
};
