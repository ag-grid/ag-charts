import {
    type OptionsDefs,
    type PlainObject,
    type Validator,
    array,
    arrayOf,
    arrayOfDefs,
    boolean,
    callbackOf,
    color,
    constant,
    defined,
    fontOptionsDef,
    isFunction,
    isObject,
    isSymbol,
    number,
    optionsDefs,
    or,
    positiveNumber,
    ratio,
    required,
    string,
    themeOperator,
    undocumented,
    unionSymbol,
    without,
} from 'ag-charts-core';
import type {
    AgCartesianAxesTheme,
    AgChartTooltipOptions,
    AgInitialStateLegendOptions,
    AgNavigatorHandleOptions,
    AgNavigatorThemeableOptions,
    AgPolarAxesTheme,
    AgSeriesTooltip,
    AgStateSerializableDate,
    AgThemeOverrides,
} from 'ag-charts-types';

import {
    linearGaugeSeriesThemeableOptionsDef,
    linearGaugeTargetOptionsDef,
    radialGaugeSeriesThemeableOptionsDef,
    radialGaugeTargetOptionsDef,
} from '../../api/preset/gaugeOptionsDefs';
import { CategoryAxisModule } from '../../module/axis-modules/categoryAxisModule';
import { GroupedCategoryAxisModule } from '../../module/axis-modules/groupedCategoryAxisModule';
import { LogAxisModule } from '../../module/axis-modules/logAxisModule';
import { NumberAxisModule } from '../../module/axis-modules/numberAxisModule';
import { TimeAxisModule } from '../../module/axis-modules/timeAxisModule';
import { UnitTimeAxisModule } from '../../module/axis-modules/unitTimeAxisModule';
import {
    cartesianCrossLineOptionsDefs,
    commonCrossLineLabelOptionsDefs,
    commonCrossLineOptionsDefs,
} from '../axesOptionsDefs';
import {
    angleCategoryAxisOptionsDefs,
    angleNumberAxisOptionsDefs,
    ordinalTimeAxisOptionsDefs,
    radiusCategoryAxisOptionsDefs,
    radiusNumberAxisOptionsDefs,
} from '../axesOptionsEnterpriseDefs';
import { commonChartOptionsDefs, numberFormatValidator, textOrSegments } from '../commonOptionsDefs';
import { areaSeriesThemeableOptionsDef } from '../series/cartesian/areaSeriesOptionsDef';
import { barSeriesThemeableOptionsDef } from '../series/cartesian/barSeriesOptionsDef';
import { bubbleSeriesThemeableOptionsDef } from '../series/cartesian/bubbleSeriesOptionsDef';
import { histogramSeriesThemeableOptionsDef } from '../series/cartesian/histogramSeriesOptionsDef';
import { lineSeriesThemeableOptionsDef } from '../series/cartesian/lineSeriesOptionsDef';
import { scatterSeriesThemeableOptionsDef } from '../series/cartesian/scatterSeriesOptionsDef';
import { donutSeriesThemeableOptionsDef } from '../series/polar/donutSeriesOptionsDef';
import { pieSeriesThemeableOptionsDef } from '../series/polar/pieSeriesOptionsDef';
import {
    annotationCalloutStylesDefs,
    annotationCommentStylesDefs,
    annotationCrossLineStyleDefs,
    annotationDisjointChannelStyleDefs,
    annotationFibonacciStylesDefs,
    annotationLineStyleDefs,
    annotationMeasurerStylesDefs,
    annotationNoteStylesDefs,
    annotationOptionsDef,
    annotationParallelChannelStyleDefs,
    annotationQuickMeasurerStylesDefs,
    annotationShapeStylesDefs,
    annotationTextStylesDef,
} from './annotationOptionsDef';
import {
    boxPlotSeriesThemeableOptionsDef,
    candlestickSeriesThemeableOptionsDef,
    chordSeriesThemeableOptionsDef,
    coneFunnelSeriesThemeableOptionsDef,
    funnelSeriesThemeableOptionsDef,
    heatmapSeriesThemeableOptionsDef,
    mapLineBackgroundSeriesThemeableOptionsDef,
    mapLineSeriesThemeableOptionsDef,
    mapMarkerSeriesThemeableOptionsDef,
    mapShapeBackgroundSeriesThemeableOptionsDef,
    mapShapeSeriesThemeableOptionsDef,
    nightingaleSeriesThemeableOptionsDef,
    ohlcSeriesThemeableOptionsDef,
    pyramidSeriesThemeableOptionsDef,
    radarAreaSeriesThemeableOptionsDef,
    radarLineSeriesThemeableOptionsDef,
    radialBarSeriesThemeableOptionsDef,
    radialColumnSeriesThemeableOptionsDef,
    rangeAreaSeriesThemeableOptionsDef,
    rangeBarSeriesThemeableOptionsDef,
    sankeySeriesThemeableOptionsDef,
    sunburstSeriesThemeableOptionsDef,
    treemapSeriesThemeableOptionsDef,
    waterfallSeriesThemeableOptionsDef,
} from './enterpriseThemeableOptionsDef';

const serializableDate = optionsDefs<AgStateSerializableDate>(
    {
        __type: required(constant('date')),
        value: or(string, number),
    },
    'a serializable date object'
);

const navigatorHandleOptionsDef: OptionsDefs<AgNavigatorHandleOptions> = {
    width: positiveNumber,
    height: positiveNumber,
    grip: boolean,
    fill: color,
    stroke: color,
    strokeWidth: positiveNumber,
    cornerRadius: positiveNumber,
};

const navigatorOptionsDef: OptionsDefs<AgNavigatorThemeableOptions> = {
    enabled: boolean,
    height: positiveNumber,
    spacing: positiveNumber,
    cornerRadius: number,
    mask: {
        fill: color,
        fillOpacity: ratio,
        stroke: color,
        strokeWidth: positiveNumber,
    },
    minHandle: navigatorHandleOptionsDef,
    maxHandle: navigatorHandleOptionsDef,
    miniChart: {
        enabled: boolean,
        padding: {
            top: positiveNumber,
            bottom: positiveNumber,
        },
        label: {
            enabled: boolean,
            avoidCollisions: boolean,
            spacing: positiveNumber,
            format: numberFormatValidator,
            formatter: callbackOf(textOrSegments),
            interval: {
                minSpacing: positiveNumber,
                maxSpacing: positiveNumber,
                values: array,
                step: number,
            },
            ...fontOptionsDef,
        },
        series: defined,
    },
};

const cartesianAxesThemeDef: OptionsDefs<AgCartesianAxesTheme> = {
    number: {
        ...without(NumberAxisModule.options, ['type', 'crossLines']),
        top: without(NumberAxisModule.options, ['type', 'crossLines', 'position']),
        right: without(NumberAxisModule.options, ['type', 'crossLines', 'position']),
        bottom: without(NumberAxisModule.options, ['type', 'crossLines', 'position']),
        left: without(NumberAxisModule.options, ['type', 'crossLines', 'position']),
        crossLines: without(cartesianCrossLineOptionsDefs, ['type', 'value', 'range']),
    },
    log: {
        ...without(LogAxisModule.options, ['type', 'crossLines']),
        top: without(LogAxisModule.options, ['type', 'crossLines', 'position']),
        right: without(LogAxisModule.options, ['type', 'crossLines', 'position']),
        bottom: without(LogAxisModule.options, ['type', 'crossLines', 'position']),
        left: without(LogAxisModule.options, ['type', 'crossLines', 'position']),
        crossLines: without(cartesianCrossLineOptionsDefs, ['type', 'value', 'range']),
    },
    category: {
        ...without(CategoryAxisModule.options, ['type', 'crossLines']),
        top: without(CategoryAxisModule.options, ['type', 'crossLines', 'position']),
        right: without(CategoryAxisModule.options, ['type', 'crossLines', 'position']),
        bottom: without(CategoryAxisModule.options, ['type', 'crossLines', 'position']),
        left: without(CategoryAxisModule.options, ['type', 'crossLines', 'position']),
        crossLines: without(cartesianCrossLineOptionsDefs, ['type', 'value', 'range']),
    },
    time: {
        ...without(TimeAxisModule.options, ['type', 'crossLines']),
        top: without(TimeAxisModule.options, ['type', 'crossLines', 'position']),
        right: without(TimeAxisModule.options, ['type', 'crossLines', 'position']),
        bottom: without(TimeAxisModule.options, ['type', 'crossLines', 'position']),
        left: without(TimeAxisModule.options, ['type', 'crossLines', 'position']),
        crossLines: without(cartesianCrossLineOptionsDefs, ['type', 'value', 'range']),
    },
    'unit-time': {
        ...without(UnitTimeAxisModule.options, ['type', 'crossLines']),
        top: without(UnitTimeAxisModule.options, ['type', 'crossLines', 'position']),
        right: without(UnitTimeAxisModule.options, ['type', 'crossLines', 'position']),
        bottom: without(UnitTimeAxisModule.options, ['type', 'crossLines', 'position']),
        left: without(UnitTimeAxisModule.options, ['type', 'crossLines', 'position']),
        crossLines: without(cartesianCrossLineOptionsDefs, ['type', 'value', 'range']),
    },
    'grouped-category': {
        ...without(GroupedCategoryAxisModule.options, ['type']),
        top: without(GroupedCategoryAxisModule.options, ['type', 'position']),
        right: without(GroupedCategoryAxisModule.options, ['type', 'position']),
        bottom: without(GroupedCategoryAxisModule.options, ['type', 'position']),
        left: without(GroupedCategoryAxisModule.options, ['type', 'position']),
        crossLines: without(cartesianCrossLineOptionsDefs, ['type', 'value', 'range']),
    },
    'ordinal-time': {
        ...without(ordinalTimeAxisOptionsDefs, ['type', 'crossLines']),
        top: without(ordinalTimeAxisOptionsDefs, ['type', 'crossLines', 'position']),
        right: without(ordinalTimeAxisOptionsDefs, ['type', 'crossLines', 'position']),
        bottom: without(ordinalTimeAxisOptionsDefs, ['type', 'crossLines', 'position']),
        left: without(ordinalTimeAxisOptionsDefs, ['type', 'crossLines', 'position']),
        crossLines: without(cartesianCrossLineOptionsDefs, ['type', 'value', 'range']),
    },
};

const polarAxesThemeDef: OptionsDefs<AgPolarAxesTheme> = {
    'angle-category': {
        ...without(angleCategoryAxisOptionsDefs, ['type', 'crossLines']),
        crossLines: without(commonCrossLineOptionsDefs, ['type']),
    },
    'angle-number': {
        ...without(angleNumberAxisOptionsDefs, ['type', 'crossLines']),
        crossLines: without(commonCrossLineOptionsDefs, ['type']),
    },
    'radius-category': {
        ...without(radiusCategoryAxisOptionsDefs, ['type', 'crossLines']),
        crossLines: {
            ...without(commonCrossLineOptionsDefs, ['type']),
            label: {
                ...commonCrossLineLabelOptionsDefs,
                positionAngle: number,
            },
        },
    },
    'radius-number': {
        ...without(radiusNumberAxisOptionsDefs, ['type', 'crossLines']),
        crossLines: {
            ...without(commonCrossLineOptionsDefs, ['type']),
            label: {
                ...commonCrossLineLabelOptionsDefs,
                positionAngle: number,
            },
        },
    },
};

const undocumentedSeriesOptionsDef: OptionsDefs<any> = {
    visible: undocumented(boolean),
};

export const themeOverridesOptionsDef: OptionsDefs<AgThemeOverrides> = {
    common: {
        ...commonChartOptionsDefs,
        navigator: navigatorOptionsDef,
        axes: {
            ...cartesianAxesThemeDef,
            ...polarAxesThemeDef,
        },
        annotations: {
            ...annotationOptionsDef,
            line: annotationLineStyleDefs,
            'horizontal-line': annotationCrossLineStyleDefs,
            'vertical-line': annotationCrossLineStyleDefs,
            'disjoint-channel': annotationDisjointChannelStyleDefs,
            'parallel-channel': annotationParallelChannelStyleDefs,
            'fibonacci-retracement': annotationFibonacciStylesDefs,
            'fibonacci-retracement-trend-based': annotationFibonacciStylesDefs,
            callout: annotationCalloutStylesDefs,
            comment: annotationCommentStylesDefs,
            note: annotationNoteStylesDefs,
            text: annotationTextStylesDef,
            arrow: annotationLineStyleDefs,
            'arrow-up': annotationShapeStylesDefs,
            'arrow-down': annotationShapeStylesDefs,
            'date-range': annotationMeasurerStylesDefs,
            'price-range': annotationMeasurerStylesDefs,
            'date-price-range': annotationMeasurerStylesDefs,
            'quick-date-price-range': annotationQuickMeasurerStylesDefs,
        },
        chartToolbar: {
            enabled: boolean,
        },
        initialState: {
            legend: arrayOfDefs<AgInitialStateLegendOptions>(
                {
                    visible: boolean,
                    seriesId: string,
                    itemId: string,
                    legendItemName: string,
                },
                'legend state array'
            ),
            zoom: {
                rangeX: {
                    start: or(number, serializableDate),
                    end: or(number, serializableDate),
                },
                rangeY: {
                    start: or(number, serializableDate),
                    end: or(number, serializableDate),
                },
                ratioX: {
                    start: ratio,
                    end: ratio,
                },
                ratioY: {
                    start: ratio,
                    end: ratio,
                },
                autoScaledAxes: arrayOf(constant('y')),
            },
        },
    },
    line: {
        ...commonChartOptionsDefs,
        axes: cartesianAxesThemeDef,
        series: lineSeriesThemeableOptionsDef,
        navigator: navigatorOptionsDef,
        ...undocumentedSeriesOptionsDef,
    },
    scatter: {
        ...commonChartOptionsDefs,
        axes: cartesianAxesThemeDef,
        series: scatterSeriesThemeableOptionsDef,
        navigator: navigatorOptionsDef,
        ...undocumentedSeriesOptionsDef,
        // @ts-expect-error undocumented option - required by grid
        paired: undocumented(boolean),
    },
    bubble: {
        ...commonChartOptionsDefs,
        axes: cartesianAxesThemeDef,
        series: bubbleSeriesThemeableOptionsDef,
        navigator: navigatorOptionsDef,
        ...undocumentedSeriesOptionsDef,
    },
    area: {
        ...commonChartOptionsDefs,
        axes: cartesianAxesThemeDef,
        series: areaSeriesThemeableOptionsDef,
        navigator: navigatorOptionsDef,
        ...undocumentedSeriesOptionsDef,
    },
    bar: {
        ...commonChartOptionsDefs,
        axes: cartesianAxesThemeDef,
        series: barSeriesThemeableOptionsDef,
        navigator: navigatorOptionsDef,
        ...undocumentedSeriesOptionsDef,
    },
    'box-plot': {
        ...commonChartOptionsDefs,
        axes: cartesianAxesThemeDef,
        series: boxPlotSeriesThemeableOptionsDef,
        navigator: navigatorOptionsDef,
        ...undocumentedSeriesOptionsDef,
    },
    candlestick: {
        ...commonChartOptionsDefs,
        axes: cartesianAxesThemeDef,
        series: candlestickSeriesThemeableOptionsDef,
        navigator: navigatorOptionsDef,
        ...undocumentedSeriesOptionsDef,
    },
    'cone-funnel': {
        ...commonChartOptionsDefs,
        axes: cartesianAxesThemeDef,
        series: coneFunnelSeriesThemeableOptionsDef,
        navigator: navigatorOptionsDef,
        ...undocumentedSeriesOptionsDef,
    },
    funnel: {
        ...commonChartOptionsDefs,
        axes: cartesianAxesThemeDef,
        series: funnelSeriesThemeableOptionsDef,
        navigator: navigatorOptionsDef,
        ...undocumentedSeriesOptionsDef,
    },
    ohlc: {
        ...commonChartOptionsDefs,
        axes: cartesianAxesThemeDef,
        series: ohlcSeriesThemeableOptionsDef,
        navigator: navigatorOptionsDef,
        ...undocumentedSeriesOptionsDef,
    },
    histogram: {
        ...commonChartOptionsDefs,
        axes: without(cartesianAxesThemeDef, ['category', 'grouped-category', 'unit-time', 'ordinal-time']),
        series: histogramSeriesThemeableOptionsDef,
        navigator: navigatorOptionsDef,
        ...undocumentedSeriesOptionsDef,
    },
    heatmap: {
        ...commonChartOptionsDefs,
        axes: cartesianAxesThemeDef,
        series: heatmapSeriesThemeableOptionsDef,
        navigator: navigatorOptionsDef,
        ...undocumentedSeriesOptionsDef,
    },
    waterfall: {
        ...commonChartOptionsDefs,
        axes: cartesianAxesThemeDef,
        series: waterfallSeriesThemeableOptionsDef,
        navigator: navigatorOptionsDef,
        ...undocumentedSeriesOptionsDef,
    },
    'range-bar': {
        ...commonChartOptionsDefs,
        axes: cartesianAxesThemeDef,
        series: rangeBarSeriesThemeableOptionsDef,
        navigator: navigatorOptionsDef,
        ...undocumentedSeriesOptionsDef,
    },
    'range-area': {
        ...commonChartOptionsDefs,
        axes: cartesianAxesThemeDef,
        series: rangeAreaSeriesThemeableOptionsDef,
        navigator: navigatorOptionsDef,
        ...undocumentedSeriesOptionsDef,
    },
    donut: {
        ...commonChartOptionsDefs,
        series: donutSeriesThemeableOptionsDef,
        navigator: navigatorOptionsDef,
        ...undocumentedSeriesOptionsDef,
    },
    pie: {
        ...commonChartOptionsDefs,
        series: pieSeriesThemeableOptionsDef,
        navigator: navigatorOptionsDef,
        ...undocumentedSeriesOptionsDef,
    },
    'radar-line': {
        ...commonChartOptionsDefs,
        axes: polarAxesThemeDef,
        series: radarLineSeriesThemeableOptionsDef,
        navigator: navigatorOptionsDef,
        ...undocumentedSeriesOptionsDef,
    },
    'radar-area': {
        ...commonChartOptionsDefs,
        axes: polarAxesThemeDef,
        series: radarAreaSeriesThemeableOptionsDef,
        navigator: navigatorOptionsDef,
        ...undocumentedSeriesOptionsDef,
    },
    'radial-bar': {
        ...commonChartOptionsDefs,
        axes: polarAxesThemeDef,
        series: radialBarSeriesThemeableOptionsDef,
        navigator: navigatorOptionsDef,
        ...undocumentedSeriesOptionsDef,
    },
    'radial-column': {
        ...commonChartOptionsDefs,
        axes: polarAxesThemeDef,
        series: radialColumnSeriesThemeableOptionsDef,
        navigator: navigatorOptionsDef,
        ...undocumentedSeriesOptionsDef,
    },
    nightingale: {
        ...commonChartOptionsDefs,
        axes: polarAxesThemeDef,
        series: nightingaleSeriesThemeableOptionsDef,
        navigator: navigatorOptionsDef,
        ...undocumentedSeriesOptionsDef,
    },
    sunburst: {
        ...commonChartOptionsDefs,
        series: sunburstSeriesThemeableOptionsDef,
        navigator: navigatorOptionsDef,
        ...undocumentedSeriesOptionsDef,
    },
    treemap: {
        ...commonChartOptionsDefs,
        series: treemapSeriesThemeableOptionsDef,
        navigator: navigatorOptionsDef,
        ...undocumentedSeriesOptionsDef,
    },
    'map-shape': {
        ...commonChartOptionsDefs,
        series: mapShapeSeriesThemeableOptionsDef,
        navigator: navigatorOptionsDef,
        ...undocumentedSeriesOptionsDef,
    },
    'map-line': {
        ...commonChartOptionsDefs,
        series: mapLineSeriesThemeableOptionsDef,
        navigator: navigatorOptionsDef,
        ...undocumentedSeriesOptionsDef,
    },
    'map-marker': {
        ...commonChartOptionsDefs,
        series: mapMarkerSeriesThemeableOptionsDef,
        navigator: navigatorOptionsDef,
        ...undocumentedSeriesOptionsDef,
    },
    'map-shape-background': {
        ...commonChartOptionsDefs,
        series: mapShapeBackgroundSeriesThemeableOptionsDef,
        navigator: navigatorOptionsDef,
        ...undocumentedSeriesOptionsDef,
    },
    'map-line-background': {
        ...commonChartOptionsDefs,
        series: mapLineBackgroundSeriesThemeableOptionsDef,
        navigator: navigatorOptionsDef,
        ...undocumentedSeriesOptionsDef,
    },
    sankey: {
        ...commonChartOptionsDefs,
        series: sankeySeriesThemeableOptionsDef,
        navigator: navigatorOptionsDef,
        ...undocumentedSeriesOptionsDef,
    },
    chord: {
        ...commonChartOptionsDefs,
        series: chordSeriesThemeableOptionsDef,
        navigator: navigatorOptionsDef,
        ...undocumentedSeriesOptionsDef,
    },
    pyramid: {
        ...commonChartOptionsDefs,
        series: pyramidSeriesThemeableOptionsDef,
        navigator: navigatorOptionsDef,
        ...undocumentedSeriesOptionsDef,
    },
    'radial-gauge': {
        ...commonChartOptionsDefs,
        ...radialGaugeSeriesThemeableOptionsDef,
        targets: without(radialGaugeTargetOptionsDef, ['value']),
        tooltip: {
            ...(radialGaugeSeriesThemeableOptionsDef.tooltip as OptionsDefs<AgSeriesTooltip<any>>),
            ...(commonChartOptionsDefs.tooltip as OptionsDefs<AgChartTooltipOptions>),
        },
    },
    'linear-gauge': {
        ...commonChartOptionsDefs,
        ...linearGaugeSeriesThemeableOptionsDef,
        targets: without(linearGaugeTargetOptionsDef, ['value']),
        tooltip: {
            ...(linearGaugeSeriesThemeableOptionsDef.tooltip as OptionsDefs<AgSeriesTooltip<any>>),
            ...(commonChartOptionsDefs.tooltip as OptionsDefs<AgChartTooltipOptions>),
        },
    },
};

function mapValues<T extends PlainObject, R>(object: T, mapper: (value: T[keyof T], key: keyof T, object: T) => R) {
    const result: Record<string | symbol, R> = {};
    for (const key of Reflect.ownKeys(object)) {
        result[key] = mapper(object[key], key, object);
    }
    return result as Record<keyof T, R>;
}

export const themeOverridesOptionsWithOperatorsDef = mapValues(
    themeOverridesOptionsDef,
    function themeOperatorMapper(value: unknown, key: string | number | symbol): any {
        if (isSymbol(key)) return value;
        // TODO remove isSymbol from validators after theme symbols have been removed
        if (isFunction(value)) {
            return or(value as Validator, themeOperator, isSymbol);
        } else if (isObject(value)) {
            return or(
                optionsDefs(
                    unionSymbol in value
                        ? mapValues(value, (val) => (isObject(val) ? mapValues(val, themeOperatorMapper) : val))
                        : mapValues(value, themeOperatorMapper)
                ),
                themeOperator,
                isSymbol
            );
        }
        throw new Error(`Invalid theme override value: ${String(value)}`);
    }
) as OptionsDefs<AgThemeOverrides>;
