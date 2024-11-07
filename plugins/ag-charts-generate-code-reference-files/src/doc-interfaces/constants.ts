export const HIDDEN_API_INTERFACE_MEMBERS = {
    AgGradientLegendOptions: ['stop'],
    AgConeFunnelSeriesOptions: ['showInMiniChart'],
    AgFunnelSeriesOptions: ['showInMiniChart'],
    AgHeatmapSeriesOptions: ['showInLegend'],
    AgSunburstSeriesHighlightStyle: ['item', 'series'],
    AgSunburstSeriesOptions: ['showInLegend'],
    AgTreemapSeriesHighlightStyle: ['item', 'series'],
    AgTreemapSeriesOptions: ['showInLegend'],
    AgAngleCategoryAxisOptions: ['keys'],
    AgAngleNumberAxisOptions: ['keys'],
    AgRadiusCategoryAxisOptions: ['keys'],
    AgRadiusNumberAxisOptions: ['keys'],
} satisfies Record<string, string[]>;
