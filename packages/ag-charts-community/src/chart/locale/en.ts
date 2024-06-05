export const en: Record<string, string> = {
    // Screen reader announcement when the focused item becomes visible
    'aria-announce.visible': 'visible',
    // Screen reader announcement when the focused item becomes hidden
    'aria-announce.hidden': 'hidden',
    // Screen reader announcement when focusing an item in the chart
    'aria-announce.hover-datum': '${datum}',
    // Screen reader announcement when focusing a chart
    'aria-announce.chart': 'chart, ${seriesCount}[number] series, ${caption}',
    // Screen reader announcement when an item in a treemap or sunburst chart
    'aria-announce.hierarchy-datum': 'level ${level}[number], ${count}[number] children, ${description}',
    // Screen reader text for the legend button
    'aria-label.legend': 'Legend',
    // Screen reader text for the legend pagination button
    'aria-label.legend-pagination': 'Legend Pagination',
    // Screen reader text for the previous legend page button
    'aria-label.legend-page-previous': 'Previous Legend Page',
    // Screen reader text for the next legend page button
    'aria-label.legend-page-next': 'Next Legend Page',
    // Screen reader text for the an item in the legend
    'aria-label.legend-item': 'Legend item ${count}[number] of ${length}[number], ${label}, ${visibility}',
    // Screen reader text for the an unknown item in the legend
    'aria-label.legend-item-unknown': 'Unknown legend item',
    // Screen reader text for the navigator element
    'aria-label.navigator': 'Navigator',
    // Screen reader text for an accessibility control that changes the position of the navigator's range
    'aria-label.navigator-range': 'Range',
    // Screen reader text for an accessibility control that changes the start of the navigator's range
    'aria-label.navigator-minimum': 'Minimum',
    // Screen reader text for an accessibility control that changes the end of the navigator's range
    'aria-label.navigator-maximum': 'Maximum',
    // Screen reader text for the value of the navigator's range
    'aria-value.pan-range': '${min}[percent] to ${max}[percent]',
    // Default text for the 'loading data' overlay
    'overlay.loading-data': 'Loading data...',
    // Default text for the 'no data' overlay
    'overlay.no-data': 'No data to display',
    // Default text for the 'no visible series' overlay
    'overlay.no-visible-series': 'No visible series',
    // Text for the annotation toolbar's trend line button
    'toolbar-annotations.trend-line': 'Trend Line',
    // Text for the annotation toolbar's parallel channel button
    'toolbar-annotations.parallel-channel': 'Parallel Channel',
    // Text for the annotation toolbar's disjoint channel button
    'toolbar-annotations.disjoint-channel': 'Disjoint Channel',
    // Text for the annotation toolbar's lock annotation button
    'toolbar-annotations.lock': 'Lock Annotation',
    // Text for the annotation toolbar's unlock annotation button
    'toolbar-annotations.unlock': 'Unlock Annotation',
    // Text for the annotation toolbar's delete annotation button
    'toolbar-annotations.delete': 'Delete Annotation',
    // Text for the range toolbar's 1 month button
    'toolbar-range.1-month': '1m',
    // Text for the range toolbar's 3 month button
    'toolbar-range.3-months': '3m',
    // Text for the range toolbar's 6 month button
    'toolbar-range.6-months': '6m',
    // Text for the range toolbar's year to date button
    'toolbar-range.year-to-date': 'YTD',
    // Text for the range toolbar's 1 year button
    'toolbar-range.1-year': '1y',
    // Text for the range toolbar's full range button
    'toolbar-range.all': 'All',
    // Text for the zoom toolbar's zoom out button
    'toolbar-zoom.zoom-out': 'Zoom out',
    // Text for the zoom toolbar's zoom in button
    'toolbar-zoom.zoom-in': 'Zoom in',
    // Text for the zoom toolbar's pan left button
    'toolbar-zoom.pan-left': 'Pan left',
    // Text for the zoom toolbar's pan right button
    'toolbar-zoom.pan-right': 'Pan right',
    // Text for the zoom toolbar's pan to the start button
    'toolbar-zoom.pan-start': 'Pan to the start',
    // Text for the zoom toolbar's pan to the end button
    'toolbar-zoom.pan-end': 'Pan to the end',
    // Text for the zoom toolbar's pan reset button
    'toolbar-zoom.zoom': 'Reset the zoom',
    // Text for the context menu's download button
    'context-menu.download': 'Download',
    // Text for the context menu's toggle series visibility button
    'context-menu.toggle-series-visibility': 'Toggle Visibility',
    // Text for the context menu's toggle other series visibility button
    'context-menu.toggle-other-series': 'Toggle Other Series',
    // Text for the context menu's zoom to point button
    'context-menu.zoom-to-cursor': 'Zoom to here',
    // Text for the context menu's pan to point button
    'context-menu.pan-to-cursor': 'Pan to here',
};
