/**
 * On-page copy for the gallery example pages. `resolveGallerySeo` composes a title, H1, meta
 * description and intro from a chart family's row here; `GALLERY_PAGE_COPY` overrides it per page.
 */

/**
 * Copy shared by every example in a chart family, keyed by the family's `seriesName` in
 * `content/gallery/data.json`. Each field is a sentence fragment, composed by `resolveGallerySeo`.
 */
export interface GalleryFamilyCopy {
    /** Keyword phrase after the H1 in the title tag; dropped first when the title will not fit. */
    hook: string;
    /** Completes `This example shows a {name} built with AG Charts, {visualises}.` */
    visualises: string;
    /** Completes `An interactive {name} built with AG Charts: {configures}.` */
    configures: string;
    /** Completes `Configure {adjusts}, then build the same chart in ...` */
    adjusts: string;
}

/** Hand-written copy for a single example, overriding everything derived for that page. */
export interface GalleryPageCopy {
    seoTitle?: string;
    seoH1?: string;
    seoDescription?: string;
    intro?: string;
}

/**
 * One row per chart family, keyed as in `data.json`. `resolveGallerySeo` throws on a missing row, so
 * a new chart family cannot ship without copy.
 */
export const GALLERY_FAMILY_COPY: Record<string, GalleryFamilyCopy> = {
    bar: {
        hook: 'JavaScript Data Visualization',
        visualises: 'comparing values across categories',
        configures: 'compare categories with customisable axes, tooltips and labels',
        adjusts: 'the axes, series colours, tooltips and labels',
    },
    line: {
        hook: 'JavaScript & React',
        visualises: 'plotting a series over a category or time axis to reveal trends',
        configures: 'plot trends over time with custom axes, markers and tooltips',
        adjusts: 'markers, gaps, time axes and tooltips',
    },
    area: {
        hook: 'JavaScript Data Visualization',
        visualises: 'filling the space under a line to emphasise volume over time',
        configures: 'show magnitude and trend over time with fills, markers and stacking',
        adjusts: 'markers, stacking and negative values',
    },
    scatter: {
        hook: 'JavaScript Data Visualization',
        visualises: 'plotting two numeric variables against each other to expose correlation',
        configures: 'reveal correlation between two variables with custom markers and axes',
        adjusts: 'the marker shapes, axes, labels and tooltips',
    },
    bubble: {
        hook: 'JavaScript Data Visualization',
        visualises: 'sizing each marker by a third variable to compare three dimensions at once',
        configures: 'compare three variables at once with size-scaled markers and labels',
        adjusts: 'the size scale, marker shapes, labels and fills',
    },
    pie: {
        hook: 'JavaScript Data Visualization',
        visualises: 'breaking a total into proportional slices',
        configures: 'show proportions of a whole with labels, tooltips and a custom radius',
        adjusts: 'labels, tooltips, colours and variable radius',
    },
    donut: {
        hook: 'JavaScript Data Visualization',
        visualises: 'a pie chart with a hollow centre ideal for a headline total',
        configures: 'show proportions with a centre label, custom radius and tooltips',
        adjusts: 'the inner radius, labels and tooltips',
    },
    maps: {
        hook: 'JavaScript Geographic Data',
        visualises: 'plotting values onto geographic regions, lines and markers',
        configures: 'plot data onto geographic shapes, lines and markers with custom colours',
        adjusts: 'the topology, colour scales, markers and labels',
    },
    'org-chart': {
        hook: 'JavaScript Hierarchy Diagram',
        visualises: 'laying out a reporting hierarchy as connected nodes',
        configures: 'lay out a reporting hierarchy with custom nodes, labels and images',
        adjusts: 'the node contents, labels, images and layout',
    },
    histogram: {
        hook: 'JavaScript Distribution Chart',
        visualises: 'grouping continuous values into bins to show their distribution',
        configures: 'show the distribution of continuous data with custom bins and tooltips',
        adjusts: 'the bin sizes, boundaries, axes and tooltips',
    },
    'range-bar': {
        hook: 'JavaScript Data Visualization',
        visualises: 'drawing each category as a bar spanning a low and a high value',
        configures: 'show a low-to-high span per category with labels and custom axes',
        adjusts: 'the axes, labels, colours and orientation',
    },
    'range-area': {
        hook: 'JavaScript Data Visualization',
        visualises: 'shading the band between a low and a high series over time',
        configures: 'shade the band between two series with custom fills and labels',
        adjusts: 'the fills, difference styling, labels and axes',
    },
    waterfall: {
        hook: 'JavaScript Data Viz',
        visualises: 'breaking down how successive increases and decreases lead to a final total',
        configures: 'show how sequential positive and negative values build to a total',
        adjusts: 'the totals, colours and labels',
    },
    'box-plot': {
        hook: 'JavaScript Statistical Chart',
        visualises: 'summarising a distribution through its quartiles, median and whiskers',
        configures: 'summarise distributions with quartiles, medians, whiskers and tooltips',
        adjusts: 'the whiskers, caps, colours and orientation',
    },
    candlestick: {
        hook: 'JavaScript Finance',
        visualises: 'plotting open, high, low and close values to visualise price movement over time',
        configures: 'plot open, high, low and close for financial data with zoom and tooltips',
        adjusts: 'the colours, zoom and tooltips',
    },
    ohlc: {
        hook: 'JavaScript Finance',
        visualises: 'plotting open, high, low and close as vertical bars with side ticks',
        configures: 'plot open, high, low and close price bars with zoom and tooltips',
        adjusts: 'the colours, zoom and tooltips',
    },
    'radar-line': {
        hook: 'JavaScript Spider Chart',
        visualises: 'plotting a series around a circular axis to compare several measures at once',
        configures: 'compare several measures on a circular axis with markers and labels',
        adjusts: 'the markers, axis order, labels and tooltips',
    },
    'radar-area': {
        hook: 'JavaScript Spider Chart',
        visualises: 'filling the area inside a circular axis to compare several measures at once',
        configures: 'compare measures on a circular axis with filled areas and labels',
        adjusts: 'the fills, axis order, labels and tooltips',
    },
    nightingale: {
        hook: 'JavaScript Polar Chart',
        visualises: 'drawing each category as a wedge whose radius carries its value',
        configures: 'compare categories as polar wedges with custom radius and labels',
        adjusts: 'the radius scale, colours, labels and axis order',
    },
    'radial-column': {
        hook: 'JavaScript Polar Chart',
        visualises: 'wrapping a column chart around a circular axis',
        configures: 'compare categories as radial columns with custom axes and labels',
        adjusts: 'the inner radius, grouping, colours and labels',
    },
    'radial-bar': {
        hook: 'JavaScript Polar Chart',
        visualises: 'drawing each category as an arc whose length carries its value',
        configures: 'compare categories as concentric arcs with stacking and labels',
        adjusts: 'the inner radius, stacking, colours and labels',
    },
    sunburst: {
        hook: 'JavaScript Hierarchy Chart',
        visualises: 'showing a hierarchy as concentric rings, one ring per level',
        configures: 'show a hierarchy as concentric rings with colour ranges and labels',
        adjusts: 'the nesting, colour ranges, labels and tooltips',
    },
    treemap: {
        hook: 'JavaScript Hierarchy Chart',
        visualises: 'showing a hierarchy as nested rectangles sized by value',
        configures: 'show a hierarchy as nested rectangles with colour ranges and labels',
        adjusts: 'the nesting, colour ranges, labels and tooltips',
    },
    heatmap: {
        hook: 'JavaScript Matrix Chart',
        visualises: 'colouring a grid of cells by value to expose patterns across two categories',
        configures: 'expose patterns across two categories with colour scales and labels',
        adjusts: 'the colour scale, axes, labels and tooltips',
    },
    sankey: {
        hook: 'JavaScript Flow Diagram',
        visualises: 'visualising the flow of values between nodes with proportionally sized links',
        configures: 'visualise flows between nodes with proportionally sized links and labels',
        adjusts: 'the nodes, links and labels',
    },
    chord: {
        hook: 'JavaScript Flow Diagram',
        visualises: 'showing flows between nodes arranged around a circle',
        configures: 'show flows between nodes around a circle with sized links and labels',
        adjusts: 'the nodes, links and labels',
    },
    funnel: {
        hook: 'JavaScript Conversion Chart',
        visualises: 'showing how a total falls away across the stages of a process',
        configures: 'show drop-off across the stages of a process with labels and tooltips',
        adjusts: 'the stage colours, labels and drop-off styling',
    },
    'cone-funnel': {
        hook: 'JavaScript Conversion Chart',
        visualises: 'tapering each stage of a process to show how a total falls away',
        configures: 'show drop-off across a process as a tapering cone with labels',
        adjusts: 'the stage colours, labels and drop-off styling',
    },
    pyramid: {
        hook: 'JavaScript Stage Chart',
        visualises: 'stacking the stages of a process into a pyramid sized by value',
        configures: 'stack the stages of a process into a pyramid with labels and tooltips',
        adjusts: 'the stage colours, labels and tooltips',
    },
    'radial-gauge': {
        hook: 'JavaScript KPI Gauge',
        visualises: 'showing a single value against its range on a circular scale',
        configures: 'show a single KPI against its range with segments, needles and labels',
        adjusts: 'the scale, segments, needle and labels',
    },
    'linear-gauge': {
        hook: 'JavaScript KPI Gauge',
        visualises: 'showing a single value against its range on a straight scale',
        configures: 'show a single KPI against its range with segments, targets and labels',
        adjusts: 'the scale, segments, targets and labels',
    },
    combination: {
        hook: 'JavaScript Multi-Series Chart',
        visualises: 'drawing several series types together on shared axes',
        configures: 'combine several series types on shared axes with independent styling',
        adjusts: 'the series types, axes, colours and tooltips',
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
        intro: 'This example shows a bar chart built with AG Charts, comparing values across categories. Customise the axes, series colours, tooltips and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'simple-line': {
        seoTitle: 'Line Chart Example - JavaScript & React | AG Charts',
        seoH1: 'Line Chart Example',
        seoDescription:
            'An interactive line chart built with AG Charts: plot trends over time with custom axes, markers and tooltips. Explore the live example and copy the code.',
        intro: 'This example shows a line chart built with AG Charts, plotting a series over a category or time axis to reveal trends. Configure markers, gaps, time axes and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'simple-area': {
        seoTitle: 'Area Chart Example - JavaScript Data Visualization | AG Charts',
        seoH1: 'Area Chart Example',
        seoDescription:
            'An interactive area chart built with AG Charts: show magnitude and trend over time with fills, markers and stacking. Explore the live example and copy the code.',
        intro: 'This example shows an area chart built with AG Charts, filling the space under a line to emphasise volume over time. Add markers, stacking or negative values, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'simple-pie': {
        seoTitle: 'Pie Chart Example - JavaScript Data Visualization | AG Charts',
        seoH1: 'Pie Chart Example',
        seoDescription:
            'An interactive pie chart built with AG Charts: show proportions of a whole with labels, tooltips and a custom radius. Explore the live example and copy the code.',
        intro: 'This example shows a pie chart built with AG Charts, breaking a total into proportional slices. Configure labels, tooltips, colours and variable radius, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'simple-donut': {
        seoTitle: 'Donut Chart Example - JavaScript Data Visualization | AG Charts',
        seoH1: 'Donut Chart Example',
        seoDescription:
            'An interactive donut chart built with AG Charts: show proportions with a centre label, custom radius and tooltips. Explore the live example and copy the code.',
        intro: 'This example shows a donut chart built with AG Charts, a pie chart with a hollow centre ideal for a headline total. Configure inner radius, labels and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    candlestick: {
        seoTitle: 'Candlestick Chart Example - JavaScript Finance | AG Charts',
        seoH1: 'Candlestick Chart Example',
        seoDescription:
            'An interactive candlestick chart built with AG Charts: plot open, high, low and close for financial data with zoom and tooltips. Explore the live example.',
        intro: 'This example shows a candlestick chart built with AG Charts, plotting open, high, low and close values to visualise price movement over time. Configure colours, zoom and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    sankey: {
        seoTitle: 'Sankey Chart Example - JavaScript Flow Diagram | AG Charts',
        seoH1: 'Sankey Chart Example',
        seoDescription:
            'An interactive Sankey diagram built with AG Charts: visualise flows between nodes with proportionally sized links and labels. Explore the live example.',
        intro: 'This example shows a Sankey chart built with AG Charts, visualising the flow of values between nodes with proportionally sized links. Customise nodes, links and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'simple-waterfall': {
        seoTitle: 'Waterfall Chart Example - JavaScript Data Viz | AG Charts',
        seoH1: 'Waterfall Chart Example',
        seoDescription:
            'An interactive waterfall chart built with AG Charts: show how sequential positive and negative values build to a total. Explore the live example and copy the code.',
        intro: 'This example shows a waterfall chart built with AG Charts, breaking down how successive increases and decreases lead to a final total. Customise totals, colours and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    },
};
