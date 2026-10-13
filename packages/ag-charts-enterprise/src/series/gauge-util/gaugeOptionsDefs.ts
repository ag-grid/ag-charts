import type {
    AgChartTooltipOptions,
    AgGaugeColorStop,
    AgRadialGaugeTargetLabelOptions,
    AgSeriesTooltip,
    FillsOptions,
} from 'ag-charts-community';
import {
    type OptionsDefs,
    and,
    arrayLength,
    arrayOf,
    colorOrRef,
    colorStopsOrderValidator,
    commonChartOptionsDefs,
    labelAutoFontSizeOptionsDefs,
    labelCollisionFitOptionsDefs,
    numericValue,
    optionsDefs,
    positiveNumber,
    seriesLabelOptionsDefs,
    tooltipOptionsDefs,
    union,
} from 'ag-charts-core';

export const fillsOptionsDef: OptionsDefs<FillsOptions> = {
    fills: and(
        arrayLength(2),
        arrayOf(optionsDefs<AgGaugeColorStop>({ color: colorOrRef, stop: numericValue }, '')),
        colorStopsOrderValidator
    ),
    fillMode: union('continuous', 'discrete'),
};

/** A gauge `tooltip` takes both series and chart tooltip options. */
export const gaugeTooltipOptionsDef: OptionsDefs<AgSeriesTooltip<any> & AgChartTooltipOptions> = {
    ...tooltipOptionsDefs,
    ...(commonChartOptionsDefs.tooltip as OptionsDefs<AgChartTooltipOptions>),
};

/** Target labels on both gauges share one shape. */
export const gaugeTargetLabelOptionsDef: OptionsDefs<AgRadialGaugeTargetLabelOptions> = {
    ...seriesLabelOptionsDefs,
    ...labelCollisionFitOptionsDefs,
    ...labelAutoFontSizeOptionsDefs,
    spacing: positiveNumber,
};
