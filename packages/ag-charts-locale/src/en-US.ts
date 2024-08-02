export const AG_CHARTS_LOCALE_EN_US: Record<string, string> = {
    // Screen reader announcement when the focused item becomes visible
    ariaAnnounceVisible: 'visible',
    // Screen reader announcement when the focused item becomes hidden
    ariaAnnounceHidden: 'hidden',
    // Screen reader announcement when focusing an item in the chart
    ariaAnnounceHoverDatum: '${datum}',
    // Screen reader announcement when focusing a chart
    ariaAnnounceChart: 'chart, ${seriesCount}[number] series',
    // Screen reader announcement when focusing an item in a treemap or sunburst chart
    ariaAnnounceHierarchyDatum: 'level ${level}[number], ${count}[number] children, ${description}',
    // Screen reader announcement when focusing a link in a Sankey or chord chart
    ariaAnnounceFlowProportionLink: 'link ${index} of ${count}, from ${from} to ${to}, ${sizeName} ${size}',
    // Screen reader announcement when focusing a node in a Sankey or chord chart
    ariaAnnounceFlowProportionNode: 'node ${index} of ${count}, ${description}',
    // Screen reader text for annotation-options toolbar
    ariaLabelAnnotationOptionsToolbar: 'Annotation Options',
    // Screen reader text for the color picker dialog
    ariaLabelColorPicker: 'Color picker',
    // Screen reader text for the financial charts toolbar
    ariaLabelFinancialCharts: 'Financial Charts',
    // Screen reader text for the legend toolbar
    ariaLabelLegend: 'Legend',
    // Screen reader text for the legend pagination button
    ariaLabelLegendPagination: 'Legend Pagination',
    // Screen reader text for the previous legend page button
    ariaLabelLegendPagePrevious: 'Previous Legend Page',
    // Screen reader text for the next legend page button
    ariaLabelLegendPageNext: 'Next Legend Page',
    // Screen reader text for the an item in the legend
    ariaLabelLegendItem: '${label}, Legend item ${index}[number] of ${count}[number], ',
    // Screen reader text for the an unknown item in the legend
    ariaLabelLegendItemUnknown: 'Unknown legend item',
    // Screen reader text for the navigator element
    ariaLabelNavigator: 'Navigator',
    // Screen reader text for an accessibility control that changes the position of the navigator's range
    ariaLabelNavigatorRange: 'Range',
    // Screen reader text for an accessibility control that changes the start of the navigator's range
    ariaLabelNavigatorMinimum: 'Minimum',
    // Screen reader text for an accessibility control that changes the end of the navigator's range
    ariaLabelNavigatorMaximum: 'Maximum',
    // Screen reader text for ranges toolbar
    ariaLabelRangesToolbar: 'Ranges',
    // Screen reader text for zoom toolbar
    ariaLabelZoomToolbar: 'Zoom',
    // Screen reader text for the value of the navigator's range
    ariaValuePanRange: '${min}[percent] to ${max}[percent]',
    // Default text for the 'loading data' overlay
    overlayLoadingData: 'Loading data...',
    // Default text for the 'no data' overlay
    overlayNoData: 'No data to display',
    // Default text for the 'no visible series' overlay
    overlayNoVisibleSeries: 'No visible series',
    // Text for the series type toolbar's chart type button
    toolbarSeriesTypeDropdown: 'Chart Type',
    // Text for the series type toolbar's OHLC chart type button
    toolbarSeriesTypeOHLC: 'OHLC',
    // Text for the series type toolbar's HLC chart type button
    toolbarSeriesTypeHLC: 'HLC',
    // Text for the series type toolbar's high low chart type button
    toolbarSeriesTypeHighLow: 'High Low',
    // Text for the series type toolbar's candles chart type button
    toolbarSeriesTypeCandles: 'Candles',
    // Text for the series type toolbar's hollow candles chart type button
    toolbarSeriesTypeHollowCandles: 'Hollow Candles',
    // Text for the series type toolbar's line chart type button
    toolbarSeriesTypeLine: 'Line',
    // Text for the series type toolbar's line with markers chart type button
    toolbarSeriesTypeLineWithMarkers: 'Line with Markers',
    // Text for the series type toolbar's line with step line chart type button
    toolbarSeriesTypeStepLine: 'Step Line',
    // Text for the annotation toolbar's trend line button
    toolbarAnnotationsTrendLine: 'Trend Line',
    // Text for the annotation toolbar's horizontal line button
    toolbarAnnotationsHorizontalLine: 'Horizontal Line',
    // Text for the annotation toolbar's vertical line button
    toolbarAnnotationsVerticalLine: 'Vertical Line',
    // Text for the annotation toolbar's parallel channel button
    toolbarAnnotationsParallelChannel: 'Parallel Channel',
    // Text for the annotation toolbar's disjoint channel button
    toolbarAnnotationsDisjointChannel: 'Disjoint Channel',
    // Text for the annotation toolbar's clear all button
    toolbarAnnotationsClearAll: 'Clear All',
    /**
     * Text for the annotation toolbar's color picker annotation button
     * @deprecated v10.1.0 use `toolbarAnnotationsLineColor` instead.
     */
    toolbarAnnotationsColor: 'Color',
    // Text for the annotation toolbar's fill color picker annotation button
    toolbarAnnotationsFillColor: 'Fill Color',
    // Text for the annotation toolbar's line color picker annotation button
    toolbarAnnotationsLineColor: 'Line Color',
    // Text for the annotation toolbar's text color picker annotation button
    toolbarAnnotationsTextColor: 'Text Color',
    // Text for the annotation toolbar's text size picker annotation button
    toolbarAnnotationsTextSize: 'Text Size',
    // Text for the annotation toolbar's lock annotation button
    toolbarAnnotationsLock: 'Lock',
    // Text for the annotation toolbar's unlock annotation button
    toolbarAnnotationsUnlock: 'Unlock',
    // Text for the annotation toolbar's delete annotation button
    toolbarAnnotationsDelete: 'Delete',
    // Text for the annotation toolbar's line annotations menu button
    toolbarAnnotationsLineAnnotations: 'Trend Lines',
    // Text for the annotation toolbar's text annotations menu button
    toolbarAnnotationsTextAnnotations: 'Text Annotations',
    // Text for the annotation toolbar's callout button
    toolbarAnnotationsCallout: 'Callout',
    // Text for the annotation toolbar's comment button
    toolbarAnnotationsComment: 'Comment',
    // Text for the annotation toolbar's note button
    toolbarAnnotationsNote: 'Note',
    // Text for the annotation toolbar's text button
    toolbarAnnotationsText: 'Text',
    // Text for the range toolbar's 1 month button
    toolbarRange1Month: '1M',
    // Aria label for the range toolbar's 1 month button
    toolbarRange1MonthAria: '1 month',
    // Text for the range toolbar's 3 month button
    toolbarRange3Months: '3M',
    // Aria label for the range toolbar's 3 month button
    toolbarRange3MonthsAria: '3 months',
    // Text for the range toolbar's 6 month button
    toolbarRange6Months: '6M',
    // Aria label for the range toolbar's 6 month button
    toolbarRange6MonthsAria: '6 months',
    // Text for the range toolbar's year to date button
    toolbarRangeYearToDate: 'YTD',
    // Aria label for the range toolbar's year to date month button
    toolbarRangeYearToDateAria: 'Year to date',
    // Text for the range toolbar's 1 year button
    toolbarRange1Year: '1Y',
    // Aria label for the range toolbar's 1 year button
    toolbarRange1YearAria: '1 year',
    // Text for the range toolbar's full range button
    toolbarRangeAll: 'All',
    // Aria label for the range toolbar's full range button
    toolbarRangeAllAria: 'All',
    // Text for the zoom toolbar's zoom out button
    toolbarZoomZoomOut: 'Zoom out',
    // Text for the zoom toolbar's zoom in button
    toolbarZoomZoomIn: 'Zoom in',
    // Text for the zoom toolbar's pan left button
    toolbarZoomPanLeft: 'Pan left',
    // Text for the zoom toolbar's pan right button
    toolbarZoomPanRight: 'Pan right',
    // Text for the zoom toolbar's pan to the start button
    toolbarZoomPanStart: 'Pan to the start',
    // Text for the zoom toolbar's pan to the end button
    toolbarZoomPanEnd: 'Pan to the end',
    // Text for the zoom toolbar's pan reset button
    toolbarZoomReset: 'Reset the zoom',
    // Text for the context menu's download button
    contextMenuDownload: 'Download',
    // Text for the context menu's toggle series visibility button
    contextMenuToggleSeriesVisibility: 'Toggle Visibility',
    // Text for the context menu's toggle other series visibility button
    contextMenuToggleOtherSeries: 'Toggle Other Series',
    // Text for the context menu's zoom to point button
    contextMenuZoomToCursor: 'Zoom to here',
    // Text for the context menu's pan to point button
    contextMenuPanToCursor: 'Pan to here',
};
