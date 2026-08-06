import {
    type OptionsDefs,
    type PlainObject,
    type Validator,
    array,
    arrayOf,
    arrayOfDefs,
    boolean,
    borderOptionsDef,
    callbackOf,
    colorOrRef,
    commonChartOptionsDefs,
    constant,
    defined,
    fillOptionsDef,
    fontOptionsDef,
    isFunction,
    isObject,
    isSymbol,
    lineDashOptionsDef,
    linearGaugeSeriesThemeableOptionsDef,
    linearGaugeTargetOptionsDef,
    number,
    numberFormatValidator,
    optionsDefs,
    or,
    padding,
    positiveNumber,
    radialGaugeSeriesThemeableOptionsDef,
    radialGaugeTargetOptionsDef,
    ratio,
    required,
    string,
    strokeOptionsDef,
    textOrSegments,
    themeOperator,
    undocumented,
    union,
    unionSymbol,
    without,
} from 'ag-charts-core';
import type {
    AgBaseCartesianThemeOptions,
    AgCartesianAxesTheme,
    AgChartTooltipOptions,
    AgInitialStateLegendOptions,
    AgNavigatorHandleOptions,
    AgNavigatorThemeableOptions,
    AgPolarAxesTheme,
    AgScrollbarBaseOptions,
    AgScrollbarHorizontalOrientationOptions,
    AgScrollbarOptions,
    AgScrollbarVerticalOrientationOptions,
    AgSeriesAreaBackgroundRegion,
    AgSeriesAreaBackgroundRegionRange,
    AgSeriesTooltip,
    AgStateSerializableDate,
    AgThemeOverrides,
} from 'ag-charts-types';

import {
    cartesianCrossLineLabelOptionsDefs,
    categoryAxisOptionsDefs,
    commonCrossLineLabelOptionsDefs,
    crossLineStyleOptionsDefs,
    groupedCategoryAxisOptionsDefs,
    logAxisOptionsDefs,
    numberAxisOptionsDefs,
    radiusCrossLineLabelOptionsDefs,
    timeAxisOptionsDefs,
    unitTimeAxisOptionsDefs,
} from '../axesOptionsDefs';
import {
    angleCategoryAxisOptionsDefs,
    angleNumberAxisOptionsDefs,
    ordinalTimeAxisOptionsDefs,
    radiusCategoryAxisOptionsDefs,
    radiusNumberAxisOptionsDefs,
} from '../axesOptionsEnterpriseDefs';
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
    organizationSeriesThemeableOptionsDef,
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
    fill: colorOrRef,
    stroke: colorOrRef,
    strokeWidth: positiveNumber,
    cornerRadius: positiveNumber,
};

const navigatorOptionsDef: OptionsDefs<AgNavigatorThemeableOptions> = {
    enabled: boolean,
    height: positiveNumber,
    spacing: positiveNumber,
    cornerRadius: number,
    mask: {
        fill: colorOrRef,
        fillOpacity: ratio,
        stroke: colorOrRef,
        strokeWidth: positiveNumber,
    },
    minHandle: navigatorHandleOptionsDef,
    maxHandle: navigatorHandleOptionsDef,
    miniChart: {
        enabled: boolean,
        padding: padding,
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

const scrollbarTrackOptionsDef = {
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
    cornerRadius: positiveNumber,
    opacity: ratio,
};

const scrollbarThumbOptionsDef = {
    ...scrollbarTrackOptionsDef,
    minSize: positiveNumber,
    hoverStyle: {
        fill: fillOptionsDef.fill,
        stroke: strokeOptionsDef.stroke,
    },
};

const scrollbarBaseOptionsDef: OptionsDefs<AgScrollbarBaseOptions> = {
    enabled: boolean,
    thickness: positiveNumber,
    spacing: positiveNumber,
    tickSpacing: positiveNumber,
    visible: union('auto', 'always', 'never'),
    placement: union('outer', 'inner'),
    track: scrollbarTrackOptionsDef,
    thumb: scrollbarThumbOptionsDef,
};

const scrollbarHorizontalOrientationOptionsDef: OptionsDefs<AgScrollbarHorizontalOrientationOptions> = {
    ...scrollbarBaseOptionsDef,
    position: union('top', 'bottom'),
};

const scrollbarVerticalOrientationOptionsDef: OptionsDefs<AgScrollbarVerticalOrientationOptions> = {
    ...scrollbarBaseOptionsDef,
    position: union('left', 'right'),
};

export const scrollbarOptionsDef: OptionsDefs<AgScrollbarOptions> = {
    enabled: boolean,
    enableAxisScrolling: boolean,
    enableSeriesAreaScrolling: boolean,
    thickness: positiveNumber,
    spacing: positiveNumber,
    tickSpacing: positiveNumber,
    visible: union('auto', 'always', 'never'),
    placement: union('outer', 'inner'),
    track: scrollbarTrackOptionsDef,
    thumb: scrollbarThumbOptionsDef,
    horizontal: scrollbarHorizontalOrientationOptionsDef,
    vertical: scrollbarVerticalOrientationOptionsDef,
};

const cartesianCrossLineThemeableOptionsDefs = {
    ...crossLineStyleOptionsDefs,
    label: cartesianCrossLineLabelOptionsDefs,
};

export const seriesAreaBackgroundRegionRangeDef: OptionsDefs<AgSeriesAreaBackgroundRegionRange> = {
    axis: string,
    start: defined,
    end: defined,
};

const cartesianChartOptionsDefs: OptionsDefs<Omit<AgBaseCartesianThemeOptions, 'axes' | 'navigator'>> = {
    ...commonChartOptionsDefs,
    seriesArea: {
        border: borderOptionsDef,
        clip: boolean,
        cornerRadius: number,
        padding: or(themeOperator, padding),
        backgroundRegions: arrayOfDefs<AgSeriesAreaBackgroundRegion>({
            ...fillOptionsDef,
            ...strokeOptionsDef,
            xRange: seriesAreaBackgroundRegionRangeDef,
            yRange: seriesAreaBackgroundRegionRangeDef,
            label: cartesianCrossLineLabelOptionsDefs,
        }),
    },
};

const cartesianAxesThemeDef: OptionsDefs<AgCartesianAxesTheme> = {
    number: {
        ...without(numberAxisOptionsDefs, ['type', 'crossLines']),
        top: without(numberAxisOptionsDefs, ['type', 'crossLines', 'position']),
        right: without(numberAxisOptionsDefs, ['type', 'crossLines', 'position']),
        bottom: without(numberAxisOptionsDefs, ['type', 'crossLines', 'position']),
        left: without(numberAxisOptionsDefs, ['type', 'crossLines', 'position']),
        crossLines: cartesianCrossLineThemeableOptionsDefs,
    },
    log: {
        ...without(logAxisOptionsDefs, ['type', 'crossLines']),
        top: without(logAxisOptionsDefs, ['type', 'crossLines', 'position']),
        right: without(logAxisOptionsDefs, ['type', 'crossLines', 'position']),
        bottom: without(logAxisOptionsDefs, ['type', 'crossLines', 'position']),
        left: without(logAxisOptionsDefs, ['type', 'crossLines', 'position']),
        crossLines: cartesianCrossLineThemeableOptionsDefs,
    },
    category: {
        ...without(categoryAxisOptionsDefs, ['type', 'crossLines']),
        top: without(categoryAxisOptionsDefs, ['type', 'crossLines', 'position']),
        right: without(categoryAxisOptionsDefs, ['type', 'crossLines', 'position']),
        bottom: without(categoryAxisOptionsDefs, ['type', 'crossLines', 'position']),
        left: without(categoryAxisOptionsDefs, ['type', 'crossLines', 'position']),
        crossLines: cartesianCrossLineThemeableOptionsDefs,
    },
    time: {
        ...without(timeAxisOptionsDefs, ['type', 'crossLines']),
        top: without(timeAxisOptionsDefs, ['type', 'crossLines', 'position']),
        right: without(timeAxisOptionsDefs, ['type', 'crossLines', 'position']),
        bottom: without(timeAxisOptionsDefs, ['type', 'crossLines', 'position']),
        left: without(timeAxisOptionsDefs, ['type', 'crossLines', 'position']),
        crossLines: cartesianCrossLineThemeableOptionsDefs,
    },
    'unit-time': {
        ...without(unitTimeAxisOptionsDefs, ['type', 'crossLines']),
        top: without(unitTimeAxisOptionsDefs, ['type', 'crossLines', 'position']),
        right: without(unitTimeAxisOptionsDefs, ['type', 'crossLines', 'position']),
        bottom: without(unitTimeAxisOptionsDefs, ['type', 'crossLines', 'position']),
        left: without(unitTimeAxisOptionsDefs, ['type', 'crossLines', 'position']),
        crossLines: cartesianCrossLineThemeableOptionsDefs,
    },
    'grouped-category': {
        ...without(groupedCategoryAxisOptionsDefs, ['type']),
        top: without(groupedCategoryAxisOptionsDefs, ['type', 'position']),
        right: without(groupedCategoryAxisOptionsDefs, ['type', 'position']),
        bottom: without(groupedCategoryAxisOptionsDefs, ['type', 'position']),
        left: without(groupedCategoryAxisOptionsDefs, ['type', 'position']),
        crossLines: cartesianCrossLineThemeableOptionsDefs,
    },
    'ordinal-time': {
        ...without(ordinalTimeAxisOptionsDefs, ['type', 'crossLines']),
        top: without(ordinalTimeAxisOptionsDefs, ['type', 'crossLines', 'position']),
        right: without(ordinalTimeAxisOptionsDefs, ['type', 'crossLines', 'position']),
        bottom: without(ordinalTimeAxisOptionsDefs, ['type', 'crossLines', 'position']),
        left: without(ordinalTimeAxisOptionsDefs, ['type', 'crossLines', 'position']),
        crossLines: cartesianCrossLineThemeableOptionsDefs,
    },
};

const polarAxesThemeDef: OptionsDefs<AgPolarAxesTheme> = {
    'angle-category': {
        ...without(angleCategoryAxisOptionsDefs, ['type', 'crossLines']),
        crossLines: { ...crossLineStyleOptionsDefs, label: commonCrossLineLabelOptionsDefs },
    },
    'angle-number': {
        ...without(angleNumberAxisOptionsDefs, ['type', 'crossLines']),
        crossLines: { ...crossLineStyleOptionsDefs, label: commonCrossLineLabelOptionsDefs },
    },
    'radius-category': {
        ...without(radiusCategoryAxisOptionsDefs, ['type', 'crossLines']),
        crossLines: { ...crossLineStyleOptionsDefs, label: radiusCrossLineLabelOptionsDefs },
    },
    'radius-number': {
        ...without(radiusNumberAxisOptionsDefs, ['type', 'crossLines']),
        crossLines: { ...crossLineStyleOptionsDefs, label: radiusCrossLineLabelOptionsDefs },
    },
};

const undocumentedSeriesOptionsDef: OptionsDefs<any> = {
    visible: undocumented(boolean),
};

export const themeOverridesOptionsDef: OptionsDefs<AgThemeOverrides> = {
    common: {
        ...commonChartOptionsDefs,
        navigator: navigatorOptionsDef,
        scrollbar: scrollbarOptionsDef,
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
        ...cartesianChartOptionsDefs,
        axes: cartesianAxesThemeDef,
        series: lineSeriesThemeableOptionsDef,
        navigator: navigatorOptionsDef,
        scrollbar: scrollbarOptionsDef,
        ...undocumentedSeriesOptionsDef,
    },
    scatter: {
        ...cartesianChartOptionsDefs,
        axes: cartesianAxesThemeDef,
        series: scatterSeriesThemeableOptionsDef,
        navigator: navigatorOptionsDef,
        scrollbar: scrollbarOptionsDef,
        ...undocumentedSeriesOptionsDef,
        // @ts-expect-error undocumented option - required by grid
        paired: undocumented(boolean),
    },
    bubble: {
        ...cartesianChartOptionsDefs,
        axes: cartesianAxesThemeDef,
        series: bubbleSeriesThemeableOptionsDef,
        navigator: navigatorOptionsDef,
        scrollbar: scrollbarOptionsDef,
        ...undocumentedSeriesOptionsDef,
    },
    area: {
        ...cartesianChartOptionsDefs,
        axes: cartesianAxesThemeDef,
        series: areaSeriesThemeableOptionsDef,
        navigator: navigatorOptionsDef,
        scrollbar: scrollbarOptionsDef,
        ...undocumentedSeriesOptionsDef,
    },
    bar: {
        ...cartesianChartOptionsDefs,
        axes: cartesianAxesThemeDef,
        series: barSeriesThemeableOptionsDef,
        navigator: navigatorOptionsDef,
        scrollbar: scrollbarOptionsDef,
        ...undocumentedSeriesOptionsDef,
    },
    'box-plot': {
        ...cartesianChartOptionsDefs,
        axes: cartesianAxesThemeDef,
        series: boxPlotSeriesThemeableOptionsDef,
        navigator: navigatorOptionsDef,
        scrollbar: scrollbarOptionsDef,
        ...undocumentedSeriesOptionsDef,
    },
    candlestick: {
        ...cartesianChartOptionsDefs,
        axes: cartesianAxesThemeDef,
        series: candlestickSeriesThemeableOptionsDef,
        navigator: navigatorOptionsDef,
        scrollbar: scrollbarOptionsDef,
        ...undocumentedSeriesOptionsDef,
    },
    'cone-funnel': {
        ...cartesianChartOptionsDefs,
        axes: cartesianAxesThemeDef,
        series: coneFunnelSeriesThemeableOptionsDef,
        navigator: navigatorOptionsDef,
        scrollbar: scrollbarOptionsDef,
        ...undocumentedSeriesOptionsDef,
    },
    funnel: {
        ...cartesianChartOptionsDefs,
        axes: cartesianAxesThemeDef,
        series: funnelSeriesThemeableOptionsDef,
        navigator: navigatorOptionsDef,
        scrollbar: scrollbarOptionsDef,
        ...undocumentedSeriesOptionsDef,
    },
    ohlc: {
        ...cartesianChartOptionsDefs,
        axes: cartesianAxesThemeDef,
        series: ohlcSeriesThemeableOptionsDef,
        navigator: navigatorOptionsDef,
        scrollbar: scrollbarOptionsDef,
        ...undocumentedSeriesOptionsDef,
    },
    histogram: {
        ...cartesianChartOptionsDefs,
        axes: without(cartesianAxesThemeDef, ['category', 'grouped-category', 'unit-time', 'ordinal-time']),
        series: histogramSeriesThemeableOptionsDef,
        navigator: navigatorOptionsDef,
        scrollbar: scrollbarOptionsDef,
        ...undocumentedSeriesOptionsDef,
    },
    heatmap: {
        ...cartesianChartOptionsDefs,
        axes: cartesianAxesThemeDef,
        series: heatmapSeriesThemeableOptionsDef,
        navigator: navigatorOptionsDef,
        scrollbar: scrollbarOptionsDef,
        ...undocumentedSeriesOptionsDef,
    },
    waterfall: {
        ...cartesianChartOptionsDefs,
        axes: cartesianAxesThemeDef,
        series: waterfallSeriesThemeableOptionsDef,
        navigator: navigatorOptionsDef,
        scrollbar: scrollbarOptionsDef,
        ...undocumentedSeriesOptionsDef,
    },
    'range-bar': {
        ...cartesianChartOptionsDefs,
        axes: cartesianAxesThemeDef,
        series: rangeBarSeriesThemeableOptionsDef,
        navigator: navigatorOptionsDef,
        scrollbar: scrollbarOptionsDef,
        ...undocumentedSeriesOptionsDef,
    },
    'range-area': {
        ...cartesianChartOptionsDefs,
        axes: cartesianAxesThemeDef,
        series: rangeAreaSeriesThemeableOptionsDef,
        navigator: navigatorOptionsDef,
        scrollbar: scrollbarOptionsDef,
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
    organization: {
        ...commonChartOptionsDefs,
        series: organizationSeriesThemeableOptionsDef,
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
