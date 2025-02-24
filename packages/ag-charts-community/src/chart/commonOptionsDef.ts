import {
    type OptionsDefs,
    arrayOf,
    boolean,
    callback,
    constant,
    fillOptionsDef,
    fontOptionsDef,
    lineDashOptionsDef,
    number,
    object,
    optionsDefs,
    or,
    positiveNumber,
    ratio,
    required,
    string,
    strokeOptionsDef,
    union,
} from 'ag-charts-core';
import type {
    AgBaseSeriesOptions,
    AgChartLabelOptions,
    AgDropShadowOptions,
    AgErrorBarOptions,
    AgLineLinearType,
    AgLineSmoothType,
    AgLineStepType,
    AgSeriesMarkerOptions,
    AgSeriesTooltip,
} from 'ag-charts-types';

const rangeValidator = or(positiveNumber, union('exact', 'nearest'));

export const commonSeriesOptionsDef: OptionsDefs<AgBaseSeriesOptions<any>> = {
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
commonSeriesOptionsDef.highlight = {
    enabled: boolean,
};

export const markerOptionsDef: OptionsDefs<AgSeriesMarkerOptions<any, any>> = {
    enabled: boolean,
    shape: or(union('circle', 'cross', 'diamond', 'heart', 'plus', 'pin', 'square', 'star', 'triangle'), callback),
    size: positiveNumber,
    itemStyler: callback,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
};

export const seriesLabelOptionsDef: OptionsDefs<AgChartLabelOptions<any, any>> = {
    enabled: boolean,
    formatter: callback,
    ...fontOptionsDef,
};

export const errorBarOptionsDef: OptionsDefs<AgErrorBarOptions<any>> = {
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

export const tooltipOptionsDef: OptionsDefs<AgSeriesTooltip<any>> = {
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
        anchorTo: union('node', 'pointer', 'canvas'),
        placement: or(placement, arrayOf(placement)),
        xOffset: number,
        yOffset: number,
    },
    interaction: {
        enabled: boolean,
    },
};

export const shadowOptionsDef: OptionsDefs<AgDropShadowOptions> = {
    enabled: boolean,
    xOffset: number,
    yOffset: number,
    blur: positiveNumber,
    color: string,
};

export const interpolationValidator = or(
    optionsDefs<AgLineLinearType>(
        {
            type: required(constant('linear')),
        },
        'linear interpolation line options'
    ),
    optionsDefs<AgLineSmoothType>(
        {
            type: required(constant('smooth')),
            tension: ratio,
        },
        'smooth interpolation line options'
    ),
    optionsDefs<AgLineStepType>(
        {
            type: required(constant('step')),
            position: union('start', 'middle', 'end'),
        },
        'step interpolation line options'
    )
);
