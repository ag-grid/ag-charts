import {
    type OptionsDefs,
    arrayOf,
    boolean,
    callback,
    color,
    defined,
    fillOptionsDef,
    fontOptionsDef,
    lineDashOptionsDef,
    number,
    object,
    or,
    positiveNumber,
    ratio,
    string,
    strokeOptionsDef,
    typeUnion,
    union,
} from 'ag-charts-core';
import type {
    AgBaseSeriesOptions,
    AgChartAutoSizedBaseLabelOptions,
    AgChartLabelOptions,
    AgDropShadowOptions,
    AgErrorBarOptions,
    AgInterpolationType,
    AgSeriesMarkerOptions,
    AgSeriesTooltip,
} from 'ag-charts-types';

const rangeValidator = or(positiveNumber, union('exact', 'nearest'));

export const commonSeriesOptionsDefs: OptionsDefs<AgBaseSeriesOptions<any>> = {
    id: string,
    cursor: string,
    visible: boolean,
    data: arrayOf(object),
    showInLegend: boolean,
    nodeClickRange: rangeValidator,
    listeners: {
        nodeClick: callback,
        nodeDoubleClick: callback,
    },
    highlightStyle: {
        item: { ...fillOptionsDef, ...strokeOptionsDef },
        series: {
            enabled: boolean,
            dimOpacity: ratio,
            strokeWidth: positiveNumber,
        },
    },
};

// @ts-expect-error undocumented option
commonSeriesOptionsDefs.context = defined;

// @ts-expect-error undocumented option
commonSeriesOptionsDefs.highlight = {
    enabled: boolean,
};

export const markerOptionsDefs: OptionsDefs<AgSeriesMarkerOptions<any, any>> = {
    enabled: boolean,
    shape: or(union('circle', 'cross', 'diamond', 'heart', 'plus', 'pin', 'square', 'star', 'triangle'), callback),
    size: positiveNumber,
    itemStyler: callback,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
};

export const seriesLabelOptionsDefs: OptionsDefs<AgChartLabelOptions<any, any>> = {
    enabled: boolean,
    formatter: callback,
    ...fontOptionsDef,
};

export const autoSizedLabelOptionsDefs: OptionsDefs<AgChartAutoSizedBaseLabelOptions<any, any>> = {
    ...seriesLabelOptionsDefs,
    lineHeight: positiveNumber,
    minimumFontSize: positiveNumber,
    wrapping: union('never', 'always', 'hyphenate', 'on-space'),
    overflowStrategy: union('ellipsis', 'hide'),
};

export const errorBarOptionsDefs: OptionsDefs<AgErrorBarOptions<any>> = {
    visible: boolean,
    xLowerKey: string,
    xUpperKey: string,
    yLowerKey: string,
    yUpperKey: string,
    xLowerName: string,
    xUpperName: string,
    yLowerName: string,
    yUpperName: string,
    itemStyler: callback,
    cap: {
        visible: boolean,
        length: positiveNumber,
        lengthRatio: ratio,
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
    },
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
};

const placement = union(
    'top',
    'right',
    'bottom',
    'left',
    'top-left',
    'top-right',
    'bottom-left',
    'bottom-right',
    'center'
);

export const tooltipOptionsDefs: OptionsDefs<AgSeriesTooltip<any>> = {
    enabled: boolean,
    showArrow: boolean,
    range: rangeValidator,
    renderer: callback,
    position: {
        type: union(
            'pointer',
            'node',
            'top',
            'right',
            'bottom',
            'left',
            'top-left',
            'top-right',
            'bottom-left',
            'bottom-right'
        ),
        anchorTo: union('node', 'pointer', 'chart'),
        placement: or(placement, arrayOf(placement)),
        xOffset: number,
        yOffset: number,
    },
    interaction: {
        enabled: boolean,
    },
};

export const shadowOptionsDefs: OptionsDefs<AgDropShadowOptions> = {
    enabled: boolean,
    xOffset: number,
    yOffset: number,
    blur: positiveNumber,
    color: color,
};

export const interpolationValidator = typeUnion<AgInterpolationType>(
    {
        linear: {},
        smooth: {
            tension: ratio,
        },
        step: {
            position: union('start', 'middle', 'end'),
        },
    },
    'interpolation line options'
);
