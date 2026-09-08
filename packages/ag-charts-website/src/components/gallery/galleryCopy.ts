/**
 * On-page copy for the gallery hub and its example pages. `resolveGallerySeo` composes an example
 * page's title, H1, meta description and intro from a chart family's row here; `GALLERY_PAGE_COPY`
 * overrides it per page. The hub is a single page, so its copy is written out in full.
 */

/** Copy for the `/gallery/` hub, shared with its `.md` twin. */
export const GALLERY_HUB_COPY = {
    title: 'AG Charts Gallery - 100+ JavaScript Chart Examples | AG Charts',
    h1: 'AG Charts Gallery',
    description:
        'Browse 100+ interactive chart examples built with AG Charts: bar, line, pie, area, financial, hierarchical and more. View the live demos and copy the code.',
    intro: 'The AG Charts gallery contains over 100 live, interactive chart examples - from bar, line, pie and area charts to financial, statistical, hierarchical and specialised types. Every example runs in the browser and comes with copy-ready code for JavaScript, React, Angular and Vue.',
} as const;

/**
 * Copy shared by every example in a chart family, keyed by the family's `seriesName` in
 * `content/gallery/data.json`. Each field is a sentence fragment, composed by `resolveGallerySeo`.
 */
export interface GalleryFamilyCopy {
    /** Keyword phrase after the H1 in the title tag; dropped first when the title will not fit. */
    hook: string;
    /** Completes `An interactive {name} built with AG Charts: {configures}.` */
    configures: string;
}

/** Hand-written copy for a single example, overriding everything derived for that page. */
export interface GalleryPageCopy {
    seoTitle?: string;
    seoH1?: string;
    seoDescription?: string;
}

/**
 * One row per chart family, keyed as in `data.json`. `resolveGallerySeo` throws on a missing row, so
 * a new chart family cannot ship without copy.
 */
export const GALLERY_FAMILY_COPY: Record<string, GalleryFamilyCopy> = {
    bar: {
        hook: 'JavaScript Data Visualization',
        configures: 'compare categories with customisable axes, tooltips and labels',
    },
    line: {
        hook: 'JavaScript & React',
        configures: 'plot trends over time with custom axes, markers and tooltips',
    },
    area: {
        hook: 'JavaScript Data Visualization',
        configures: 'show magnitude and trend over time with fills, markers and stacking',
    },
    scatter: {
        hook: 'JavaScript Data Visualization',
        configures: 'reveal correlation between two variables with custom markers and axes',
    },
    bubble: {
        hook: 'JavaScript Data Visualization',
        configures: 'compare three variables at once with size-scaled markers and labels',
    },
    pie: {
        hook: 'JavaScript Data Visualization',
        configures: 'show proportions of a whole with labels, tooltips and a custom radius',
    },
    donut: {
        hook: 'JavaScript Data Visualization',
        configures: 'show proportions with a centre label, custom radius and tooltips',
    },
    maps: {
        hook: 'JavaScript Geographic Data',
        configures: 'plot data onto geographic shapes, lines and markers with custom colours',
    },
    'org-chart': {
        hook: 'JavaScript Hierarchy Diagram',
        configures: 'lay out a reporting hierarchy with custom nodes, labels and images',
    },
    histogram: {
        hook: 'JavaScript Distribution Chart',
        configures: 'show the distribution of continuous data with custom bins and tooltips',
    },
    'range-bar': {
        hook: 'JavaScript Data Visualization',
        configures: 'show a low-to-high span per category with labels and custom axes',
    },
    'range-area': {
        hook: 'JavaScript Data Visualization',
        configures: 'shade the band between two series with custom fills and labels',
    },
    waterfall: {
        hook: 'JavaScript Data Viz',
        configures: 'show how sequential positive and negative values build to a total',
    },
    'box-plot': {
        hook: 'JavaScript Statistical Chart',
        configures: 'summarise distributions with quartiles, medians, whiskers and tooltips',
    },
    candlestick: {
        hook: 'JavaScript Finance',
        configures: 'plot open, high, low and close for financial data with zoom and tooltips',
    },
    ohlc: {
        hook: 'JavaScript Finance',
        configures: 'plot open, high, low and close price bars with zoom and tooltips',
    },
    'radar-line': {
        hook: 'JavaScript Spider Chart',
        configures: 'compare several measures on a circular axis with markers and labels',
    },
    'radar-area': {
        hook: 'JavaScript Spider Chart',
        configures: 'compare measures on a circular axis with filled areas and labels',
    },
    nightingale: {
        hook: 'JavaScript Polar Chart',
        configures: 'compare categories as polar wedges with custom radius and labels',
    },
    'radial-column': {
        hook: 'JavaScript Polar Chart',
        configures: 'compare categories as radial columns with custom axes and labels',
    },
    'radial-bar': {
        hook: 'JavaScript Polar Chart',
        configures: 'compare categories as concentric arcs with stacking and labels',
    },
    sunburst: {
        hook: 'JavaScript Hierarchy Chart',
        configures: 'show a hierarchy as concentric rings with colour ranges and labels',
    },
    treemap: {
        hook: 'JavaScript Hierarchy Chart',
        configures: 'show a hierarchy as nested rectangles with colour ranges and labels',
    },
    heatmap: {
        hook: 'JavaScript Matrix Chart',
        configures: 'expose patterns across two categories with colour scales and labels',
    },
    sankey: {
        hook: 'JavaScript Flow Diagram',
        configures: 'visualise flows between nodes with proportionally sized links and labels',
    },
    chord: {
        hook: 'JavaScript Flow Diagram',
        configures: 'show flows between nodes around a circle with sized links and labels',
    },
    funnel: {
        hook: 'JavaScript Conversion Chart',
        configures: 'show drop-off across the stages of a process with labels and tooltips',
    },
    'cone-funnel': {
        hook: 'JavaScript Conversion Chart',
        configures: 'show drop-off across a process as a tapering cone with labels',
    },
    pyramid: {
        hook: 'JavaScript Stage Chart',
        configures: 'stack the stages of a process into a pyramid with labels and tooltips',
    },
    'radial-gauge': {
        hook: 'JavaScript KPI Gauge',
        configures: 'show a single KPI against its range with segments, needles and labels',
    },
    'linear-gauge': {
        hook: 'JavaScript KPI Gauge',
        configures: 'show a single KPI against its range with segments, targets and labels',
    },
    combination: {
        hook: 'JavaScript Multi-Series Chart',
        configures: 'combine several series types on shared axes with independent styling',
    },
};

/**
 * Hand-written copy for the highest-demand pages, overriding the derived copy field by field.
 *
 * The intros promise a chart built in each framework, not framework code on the page: the example
 * runner only ever renders vanilla JavaScript (`GALLERY_INTERNAL_FRAMEWORK`).
 */
export const GALLERY_PAGE_COPY: Record<string, GalleryPageCopy> = {
    'simple-bar': {
        seoTitle: 'Bar Chart Example - JavaScript Data Visualization | AG Charts',
        seoH1: 'Bar Chart Example',
        seoDescription:
            'An interactive bar chart built with AG Charts: compare categories with customisable axes, tooltips and labels. Explore the live JavaScript example and copy the code.',
    },
    'simple-line': {
        seoTitle: 'Line Chart Example - JavaScript & React | AG Charts',
        seoH1: 'Line Chart Example',
        seoDescription:
            'An interactive line chart built with AG Charts: plot trends over time with custom axes, markers and tooltips. Explore the live example and copy the code.',
    },
    'simple-area': {
        seoTitle: 'Area Chart Example - JavaScript Data Visualization | AG Charts',
        seoH1: 'Area Chart Example',
        seoDescription:
            'An interactive area chart built with AG Charts: show magnitude and trend over time with fills, markers and stacking. Explore the live example and copy the code.',
    },
    'simple-pie': {
        seoTitle: 'Pie Chart Example - JavaScript Data Visualization | AG Charts',
        seoH1: 'Pie Chart Example',
        seoDescription:
            'An interactive pie chart built with AG Charts: show proportions of a whole with labels, tooltips and a custom radius. Explore the live example and copy the code.',
    },
    'simple-donut': {
        seoTitle: 'Donut Chart Example - JavaScript Data Visualization | AG Charts',
        seoH1: 'Donut Chart Example',
        seoDescription:
            'An interactive donut chart built with AG Charts: show proportions with a centre label, custom radius and tooltips. Explore the live example and copy the code.',
    },
    candlestick: {
        seoTitle: 'Candlestick Chart Example - JavaScript Finance | AG Charts',
        seoH1: 'Candlestick Chart Example',
        seoDescription:
            'An interactive candlestick chart built with AG Charts: plot open, high, low and close for financial data with zoom and tooltips. Explore the live example.',
    },
    sankey: {
        seoTitle: 'Sankey Chart Example - JavaScript Flow Diagram | AG Charts',
        seoH1: 'Sankey Chart Example',
        seoDescription:
            'An interactive Sankey diagram built with AG Charts: visualise flows between nodes with proportionally sized links and labels. Explore the live example.',
    },
    'simple-waterfall': {
        seoTitle: 'Waterfall Chart Example - JavaScript Data Viz | AG Charts',
        seoH1: 'Waterfall Chart Example',
        seoDescription:
            'An interactive waterfall chart built with AG Charts: show how sequential positive and negative values build to a total. Explore the live example and copy the code.',
    },
};

/**
 * The intro paragraph each example page serves, keyed as in `content/gallery/data.json`.
 *
 * Written out per example rather than composed from a sentence template: these are edited as
 * copy, so what ships has to be readable and changeable here. `resolveGallerySeo` throws on a
 * missing entry, so a new gallery example cannot ship without one.
 */
export const GALLERY_EXAMPLE_INTROS: Record<string, string> = {
    'simple-bar':
        'This example shows a bar chart built with AG Charts, comparing values across categories. Customise the axes, series colours, tooltips and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    'grouped-stacked-bar':
        'This example shows a grouped stacked bar chart built with AG Charts, comparing values across categories. Configure the axes, series colours, tooltips and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    'stacked-bar':
        'This example shows a stacked bar chart built with AG Charts, comparing values across categories. Configure the axes, series colours, tooltips and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    'simple-horizontal-bar':
        'This example shows a horizontal bar chart built with AG Charts, comparing values across categories. Configure the axes, series colours, tooltips and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    'stacked-horizontal-bar':
        'This example shows a stacked horizontal bar chart built with AG Charts, comparing values across categories. Configure the axes, series colours, tooltips and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    'grouped-horizontal-bar':
        'This example shows a grouped horizontal bar chart built with AG Charts, comparing values across categories. Configure the axes, series colours, tooltips and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    'simple-line':
        'This example shows a line chart built with AG Charts, plotting a series over a category or time axis to reveal trends. Configure markers, gaps, time axes and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    'line-with-gaps':
        'This example shows a line chart with gaps built with AG Charts, plotting a series over a category or time axis to reveal trends. Configure markers, gaps, time axes and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    'multiple-line-series':
        'This example shows a line chart with multiple series built with AG Charts, plotting a series over a category or time axis to reveal trends. Configure markers, gaps, time axes and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    'line-with-time-axis':
        'This example shows a line chart with time axis built with AG Charts, plotting a series over a category or time axis to reveal trends. Configure markers, gaps, time axes and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    'multiple-line-series-large-data':
        'This example shows a line chart with large data built with AG Charts, plotting a series over a category or time axis to reveal trends. Configure markers, gaps, time axes and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    'line-with-labels':
        'This example shows a line chart with labels built with AG Charts, plotting a series over a category or time axis to reveal trends. Configure markers, gaps, time axes and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    'simple-area':
        'This example shows an area chart built with AG Charts, filling the space under a line to emphasise volume over time. Add markers, stacking or negative values, then build the same chart in JavaScript, React, Angular or Vue.',
    'area-with-labels':
        'This example shows an area chart with labels built with AG Charts, filling the space under a line to emphasise volume over time. Configure markers, stacking and negative values, then build the same chart in JavaScript, React, Angular or Vue.',
    'stacked-area':
        'This example shows a stacked area chart built with AG Charts, filling the space under a line to emphasise volume over time. Configure markers, stacking and negative values, then build the same chart in JavaScript, React, Angular or Vue.',
    'area-with-markers':
        'This example shows an area chart with markers built with AG Charts, filling the space under a line to emphasise volume over time. Configure markers, stacking and negative values, then build the same chart in JavaScript, React, Angular or Vue.',
    '100--stacked-area':
        'This example shows a 100% stacked area chart built with AG Charts, filling the space under a line to emphasise volume over time. Configure markers, stacking and negative values, then build the same chart in JavaScript, React, Angular or Vue.',
    'area-with-negative-values':
        'This example shows an area chart with negative values built with AG Charts, filling the space under a line to emphasise volume over time. Configure markers, stacking and negative values, then build the same chart in JavaScript, React, Angular or Vue.',
    'simple-scatter':
        'This example shows a scatter chart built with AG Charts, plotting two numeric variables against each other to expose correlation. Configure the marker shapes, axes, labels and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    'multiple-scatter-series':
        'This example shows a scatter chart with multiple series built with AG Charts, plotting two numeric variables against each other to expose correlation. Configure the marker shapes, axes, labels and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    'scatter-with-large-data':
        'This example shows a scatter chart with large data built with AG Charts, plotting two numeric variables against each other to expose correlation. Configure the marker shapes, axes, labels and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    'scatter-with-custom-markers':
        'This example shows a scatter chart with custom markers built with AG Charts, plotting two numeric variables against each other to expose correlation. Configure the marker shapes, axes, labels and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    'scatter-with-labels':
        'This example shows a scatter chart with labels built with AG Charts, plotting two numeric variables against each other to expose correlation. Configure the marker shapes, axes, labels and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    'scatter-with-multiple-axes':
        'This example shows a scatter chart with multiple axes built with AG Charts, plotting two numeric variables against each other to expose correlation. Configure the marker shapes, axes, labels and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    'bubble-with-negative-values':
        'This example shows a bubble chart built with AG Charts, sizing each marker by a third variable to compare three dimensions at once. Configure the size scale, marker shapes, labels and fills, then build the same chart in JavaScript, React, Angular or Vue.',
    'multiple-bubble-series':
        'This example shows a multiple bubble series chart built with AG Charts, sizing each marker by a third variable to compare three dimensions at once. Configure the size scale, marker shapes, labels and fills, then build the same chart in JavaScript, React, Angular or Vue.',
    'bubble-with-categories':
        'This example shows a bubble chart with categories built with AG Charts, sizing each marker by a third variable to compare three dimensions at once. Configure the size scale, marker shapes, labels and fills, then build the same chart in JavaScript, React, Angular or Vue.',
    'bubble-with-images':
        'This example shows a bubble chart with images built with AG Charts, sizing each marker by a third variable to compare three dimensions at once. Configure the size scale, marker shapes, labels and fills, then build the same chart in JavaScript, React, Angular or Vue.',
    'bubble-with-patterns':
        'This example shows a bubble chart with patterns built with AG Charts, sizing each marker by a third variable to compare three dimensions at once. Configure the size scale, marker shapes, labels and fills, then build the same chart in JavaScript, React, Angular or Vue.',
    'bubble-with-custom-svg-patterns':
        'This example shows a bubble chart with custom SVG patterns built with AG Charts, sizing each marker by a third variable to compare three dimensions at once. Configure the size scale, marker shapes, labels and fills, then build the same chart in JavaScript, React, Angular or Vue.',
    'simple-pie':
        'This example shows a pie chart built with AG Charts, breaking a total into proportional slices. Configure labels, tooltips, colours and variable radius, then build the same chart in JavaScript, React, Angular or Vue.',
    'pie-with-variable-radius':
        'This example shows a pie chart with variable radius built with AG Charts, breaking a total into proportional slices. Configure labels, tooltips, colours and variable radius, then build the same chart in JavaScript, React, Angular or Vue.',
    'pie-in-a-donut':
        'This example shows a pie chart in A donut built with AG Charts, breaking a total into proportional slices. Configure labels, tooltips, colours and variable radius, then build the same chart in JavaScript, React, Angular or Vue.',
    'simple-donut':
        'This example shows a donut chart built with AG Charts, a pie chart with a hollow centre ideal for a headline total. Configure inner radius, labels and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    'donut-with-variable-radius':
        'This example shows a donut chart with variable radius built with AG Charts, a pie chart with a hollow centre ideal for a headline total. Configure the inner radius, labels and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    'multiple-donuts':
        'This example shows a multiple donut charts built with AG Charts, a pie chart with a hollow centre ideal for a headline total. Configure the inner radius, labels and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    'multiple-map-shape-series':
        'This example shows a map chart with multiple shape series built with AG Charts, plotting values onto geographic regions, lines and markers. Configure the topology, colour scales, markers and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    'multiple-map-series':
        'This example shows a multiple map chart series built with AG Charts, plotting values onto geographic regions, lines and markers. Configure the topology, colour scales, markers and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    'map-heatmap-series':
        'This example shows a map chart with heatmap built with AG Charts, plotting values onto geographic regions, lines and markers. Configure the topology, colour scales, markers and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    'map-shapes-lines':
        'This example shows a map chart with shapes and lines built with AG Charts, plotting values onto geographic regions, lines and markers. Configure the topology, colour scales, markers and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    'map-lines-markers':
        'This example shows a map chart with lines and markers built with AG Charts, plotting values onto geographic regions, lines and markers. Configure the topology, colour scales, markers and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    'map-kitchen-sink':
        'This example shows a map chart kitchen sink built with AG Charts, plotting values onto geographic regions, lines and markers. Configure the topology, colour scales, markers and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    'simple-org-chart-with-images':
        'This example shows an org chart with images built with AG Charts, laying out a reporting hierarchy as connected nodes. Configure the node contents, labels, images and layout, then build the same chart in JavaScript, React, Angular or Vue.',
    'simple-org-chart-with-categories':
        'This example shows an org chart with categories built with AG Charts, laying out a reporting hierarchy as connected nodes. Configure the node contents, labels, images and layout, then build the same chart in JavaScript, React, Angular or Vue.',
    'org-chart-with-many-nodes':
        'This example shows an org chart with many nodes built with AG Charts, laying out a reporting hierarchy as connected nodes. Configure the node contents, labels, images and layout, then build the same chart in JavaScript, React, Angular or Vue.',
    'simple-histogram':
        'This example shows a histogram chart built with AG Charts, grouping continuous values into bins to show their distribution. Configure the bin sizes, boundaries, axes and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    'histogram-with-specified-bins':
        'This example shows a histogram chart with specified bins built with AG Charts, grouping continuous values into bins to show their distribution. Configure the bin sizes, boundaries, axes and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    'histogram-with-missing-bins':
        'This example shows a histogram chart with missing bins built with AG Charts, grouping continuous values into bins to show their distribution. Configure the bin sizes, boundaries, axes and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    'simple-range-bar':
        'This example shows a range bar chart built with AG Charts, drawing each category as a bar spanning a low and a high value. Configure the axes, labels, colours and orientation, then build the same chart in JavaScript, React, Angular or Vue.',
    'range-bar-with-labels':
        'This example shows a range bar chart with labels built with AG Charts, drawing each category as a bar spanning a low and a high value. Configure the axes, labels, colours and orientation, then build the same chart in JavaScript, React, Angular or Vue.',
    'multiple-range-bars':
        'This example shows a range bar chart with multiple series built with AG Charts, drawing each category as a bar spanning a low and a high value. Configure the axes, labels, colours and orientation, then build the same chart in JavaScript, React, Angular or Vue.',
    'horizontal-range-bar':
        'This example shows a horizontal range bar chart built with AG Charts, drawing each category as a bar spanning a low and a high value. Configure the axes, labels, colours and orientation, then build the same chart in JavaScript, React, Angular or Vue.',
    'horizontal-range-bar-with-labels':
        'This example shows a horizontal range bar chart with labels built with AG Charts, drawing each category as a bar spanning a low and a high value. Configure the axes, labels, colours and orientation, then build the same chart in JavaScript, React, Angular or Vue.',
    'multiple-horizontal-range-bars':
        'This example shows a horizontal range bar charts with multiple series built with AG Charts, drawing each category as a bar spanning a low and a high value. Configure the axes, labels, colours and orientation, then build the same chart in JavaScript, React, Angular or Vue.',
    'simple-range-area':
        'This example shows a range area chart built with AG Charts, shading the band between a low and a high series over time. Configure the fills, difference styling, labels and axes, then build the same chart in JavaScript, React, Angular or Vue.',
    'range-area-difference-inverted-style':
        'This example shows a range area difference chart with inverted style built with AG Charts, shading the band between a low and a high series over time. Configure the fills, difference styling, labels and axes, then build the same chart in JavaScript, React, Angular or Vue.',
    'range-area-with-labels':
        'This example shows a range area chart with labels built with AG Charts, shading the band between a low and a high series over time. Configure the fills, difference styling, labels and axes, then build the same chart in JavaScript, React, Angular or Vue.',
    'simple-waterfall':
        'This example shows a waterfall chart built with AG Charts, breaking down how successive increases and decreases lead to a final total. Customise totals, colours and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    'horizontal-waterfall':
        'This example shows a horizontal waterfall chart built with AG Charts, breaking down how successive increases and decreases lead to a final total. Configure the totals, colours and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    'customised-waterfall':
        'This example shows a customised waterfall chart built with AG Charts, breaking down how successive increases and decreases lead to a final total. Configure the totals, colours and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    'simple-box-plot':
        'This example shows a box plot chart built with AG Charts, summarising a distribution through its quartiles, median and whiskers. Configure the whiskers, caps, colours and orientation, then build the same chart in JavaScript, React, Angular or Vue.',
    'multiple-box-plots':
        'This example shows a box plot chart with multiple series built with AG Charts, summarising a distribution through its quartiles, median and whiskers. Configure the whiskers, caps, colours and orientation, then build the same chart in JavaScript, React, Angular or Vue.',
    'horizontal-box-plot':
        'This example shows a horizontal box plot chart built with AG Charts, summarising a distribution through its quartiles, median and whiskers. Configure the whiskers, caps, colours and orientation, then build the same chart in JavaScript, React, Angular or Vue.',
    candlestick:
        'This example shows a candlestick chart built with AG Charts, plotting open, high, low and close values to visualise price movement over time. Configure colours, zoom and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    'candlestick-hollow':
        'This example shows a hollow candlestick chart built with AG Charts, plotting open, high, low and close values to visualise price movement over time. Configure the colours, zoom and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    ohlc: 'This example shows an OHLC chart built with AG Charts, plotting open, high, low and close as vertical bars with side ticks. Configure the colours, zoom and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    'simple-radar-line':
        'This example shows a radar line chart built with AG Charts, plotting a series around a circular axis to compare several measures at once. Configure the markers, axis order, labels and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    'radar-with-markers':
        'This example shows a radar chart with markers built with AG Charts, plotting a series around a circular axis to compare several measures at once. Configure the markers, axis order, labels and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    'reversed-radar-with-markers':
        'This example shows a reversed radar chart with markers built with AG Charts, plotting a series around a circular axis to compare several measures at once. Configure the markers, axis order, labels and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    'simple-radar-area':
        'This example shows a radar area chart built with AG Charts, filling the area inside a circular axis to compare several measures at once. Configure the fills, axis order, labels and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    'radar-area-with-labels':
        'This example shows a radar area chart with labels built with AG Charts, filling the area inside a circular axis to compare several measures at once. Configure the fills, axis order, labels and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    'reversed-radar-area':
        'This example shows a reversed radar area chart built with AG Charts, filling the area inside a circular axis to compare several measures at once. Configure the fills, axis order, labels and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    'simple-nightingale':
        'This example shows a nightingale chart built with AG Charts, drawing each category as a wedge whose radius carries its value. Configure the radius scale, colours, labels and axis order, then build the same chart in JavaScript, React, Angular or Vue.',
    'multiple-nightingale-series':
        'This example shows a nightingale chart with multiple series built with AG Charts, drawing each category as a wedge whose radius carries its value. Configure the radius scale, colours, labels and axis order, then build the same chart in JavaScript, React, Angular or Vue.',
    'reversed-nightingale':
        'This example shows a reversed nightingale chart built with AG Charts, drawing each category as a wedge whose radius carries its value. Configure the radius scale, colours, labels and axis order, then build the same chart in JavaScript, React, Angular or Vue.',
    'simple-radial-column':
        'This example shows a radial column chart built with AG Charts, wrapping a column chart around a circular axis. Configure the inner radius, grouping, colours and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    'grouped-radial-column':
        'This example shows a grouped radial column chart built with AG Charts, wrapping a column chart around a circular axis. Configure the inner radius, grouping, colours and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    'reversed-radial-column':
        'This example shows a reversed radial column chart built with AG Charts, wrapping a column chart around a circular axis. Configure the inner radius, grouping, colours and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    'simple-radial-bar':
        'This example shows a radial bar chart built with AG Charts, drawing each category as an arc whose length carries its value. Configure the inner radius, stacking, colours and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    'stacked-radial-bar':
        'This example shows a stacked radial bar chart built with AG Charts, drawing each category as an arc whose length carries its value. Configure the inner radius, stacking, colours and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    'reversed-radial-bar':
        'This example shows a reversed radial bar chart built with AG Charts, drawing each category as an arc whose length carries its value. Configure the inner radius, stacking, colours and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    'simple-sunburst':
        'This example shows a sunburst chart built with AG Charts, showing a hierarchy as concentric rings, one ring per level. Configure the nesting, colour ranges, labels and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    'sunburst-with-nesting':
        'This example shows a sunburst chart with nesting built with AG Charts, showing a hierarchy as concentric rings, one ring per level. Configure the nesting, colour ranges, labels and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    'sunburst-with-color-range':
        'This example shows a sunburst chart with colour range built with AG Charts, showing a hierarchy as concentric rings, one ring per level. Configure the nesting, colour ranges, labels and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    'simple-treemap':
        'This example shows a treemap chart built with AG Charts, showing a hierarchy as nested rectangles sized by value. Configure the nesting, colour ranges, labels and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    'treemap-with-nesting':
        'This example shows a treemap chart with nesting built with AG Charts, showing a hierarchy as nested rectangles sized by value. Configure the nesting, colour ranges, labels and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    'treemap-with-color-range':
        'This example shows a treemap chart with colour range built with AG Charts, showing a hierarchy as nested rectangles sized by value. Configure the nesting, colour ranges, labels and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    'simple-heatmap':
        'This example shows a heatmap chart built with AG Charts, colouring a grid of cells by value to expose patterns across two categories. Configure the colour scale, axes, labels and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    'heatmap-with-labels':
        'This example shows a heatmap chart with labels built with AG Charts, colouring a grid of cells by value to expose patterns across two categories. Configure the colour scale, axes, labels and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    'grouped-category-heatmap':
        'This example shows a heatmap chart with grouped category axis built with AG Charts, colouring a grid of cells by value to expose patterns across two categories. Configure the colour scale, axes, labels and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    'calendar-heatmap':
        'This example shows a calendar heatmap chart built with AG Charts, colouring a grid of cells by value to expose patterns across two categories. Configure the colour scale, axes, labels and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    sankey: 'This example shows a Sankey chart built with AG Charts, visualising the flow of values between nodes with proportionally sized links. Customise nodes, links and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    'sankey-customisation':
        'This example shows a customised sankey chart built with AG Charts, visualising the flow of values between nodes with proportionally sized links. Configure the nodes, links and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    chord: 'This example shows a chord chart built with AG Charts, showing flows between nodes arranged around a circle. Configure the nodes, links and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    'chord-customisation':
        'This example shows a customised chord chart built with AG Charts, showing flows between nodes arranged around a circle. Configure the nodes, links and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    'simple-funnel':
        'This example shows a funnel chart built with AG Charts, showing how a total falls away across the stages of a process. Configure the stage colours, labels and drop-off styling, then build the same chart in JavaScript, React, Angular or Vue.',
    'customised-funnel':
        'This example shows a customised funnel chart built with AG Charts, showing how a total falls away across the stages of a process. Configure the stage colours, labels and drop-off styling, then build the same chart in JavaScript, React, Angular or Vue.',
    'simple-cone-funnel':
        'This example shows a cone funnel chart built with AG Charts, tapering each stage of a process to show how a total falls away. Configure the stage colours, labels and drop-off styling, then build the same chart in JavaScript, React, Angular or Vue.',
    'simple-pyramid':
        'This example shows a pyramid chart built with AG Charts, stacking the stages of a process into a pyramid sized by value. Configure the stage colours, labels and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    'simple-radial-gauge':
        'This example shows a radial gauge chart built with AG Charts, showing a single value against its range on a circular scale. Configure the scale, segments, needle and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    'customised-radial-gauge':
        'This example shows a customised radial gauge chart built with AG Charts, showing a single value against its range on a circular scale. Configure the scale, segments, needle and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    'simple-linear-gauge':
        'This example shows a linear gauge chart built with AG Charts, showing a single value against its range on a straight scale. Configure the scale, segments, targets and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    'horizontal-linear-gauge':
        'This example shows a horizontal linear gauge chart built with AG Charts, showing a single value against its range on a straight scale. Configure the scale, segments, targets and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    'simple-bullet':
        'This example shows a bullet chart built with AG Charts, showing a single value against its range on a straight scale. Configure the scale, segments, targets and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    'bar-line-combination':
        'This example shows a bar and line combination chart built with AG Charts, drawing several series types together on shared axes. Configure the series types, axes, colours and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    'histogram-scatter-combination':
        'This example shows a histogram and scatter combination chart built with AG Charts, drawing several series types together on shared axes. Configure the series types, axes, colours and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    'horizontal-range-bar-scatter-combination':
        'This example shows a horizontal range bar and scatter combination chart built with AG Charts, drawing several series types together on shared axes. Configure the series types, axes, colours and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    'radar-line-radar-area-nightingale-combination':
        'This example shows a radar line, radar area and nightingale combination chart built with AG Charts, drawing several series types together on shared axes. Configure the series types, axes, colours and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    'grouped-bar-line-combination':
        'This example shows a grouped category axis combination chart built with AG Charts, drawing several series types together on shared axes. Configure the series types, axes, colours and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    'step-interpolation-combination':
        'This example shows a step interpolation combination chart built with AG Charts, drawing several series types together on shared axes. Configure the series types, axes, colours and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    'grouped-category-combination':
        'This example shows a bar, line and area combination chart built with AG Charts, drawing several series types together on shared axes. Configure the series types, axes, colours and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    'stacked-bar-area-combination':
        'This example shows a stacked bar and area combination chart built with AG Charts, drawing several series types together on shared axes. Configure the series types, axes, colours and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
};
