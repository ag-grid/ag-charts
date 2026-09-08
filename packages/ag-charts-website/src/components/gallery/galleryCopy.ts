/**
 * On-page copy for the gallery hub and its example pages, written out in full. Nothing here is
 * composed: an example's title, H1, meta description and intro are each edited directly.
 */

/** Copy for the `/gallery/` hub, shared with its `.md` twin. */
export const GALLERY_HUB_COPY = {
    title: 'AG Charts Gallery - 100+ JavaScript Chart Examples | AG Charts',
    h1: 'AG Charts Gallery',
    description:
        'Browse 100+ interactive chart examples built with AG Charts: bar, line, pie, area, financial, hierarchical and more. View the live demos and copy the code.',
    intro: 'The AG Charts gallery contains over 100 live, interactive chart examples - from bar, line, pie and area charts to financial, statistical, hierarchical and specialised types. Every example runs in the browser and comes with copy-ready code for JavaScript, React, Angular and Vue.',
} as const;

/** The copy one gallery example page serves. */
export interface GalleryExampleCopy {
    /** `<title>`, which `Layout.astro` also feeds to the OG and Twitter title tags. */
    title: string;
    /** The page's `<h1>`, which is also its anchor text on the hub and in the `.md` twin. */
    h1: string;
    /** Meta description, which `Layout.astro` also feeds to the OG and Twitter description tags. */
    description: string;
    /** Indexable body copy, rendered directly under the H1. */
    intro: string;
}

/**
 * One row per gallery example, keyed as in `content/gallery/data.json`. `resolveGallerySeo`
 * throws on a missing row, so a new example cannot ship without copy.
 */
export const GALLERY_EXAMPLE_COPY: Record<string, GalleryExampleCopy> = {
    'simple-bar': {
        title: 'Bar Chart Example - JavaScript Data Visualization | AG Charts',
        h1: 'Bar Chart Example',
        description:
            'An interactive bar chart built with AG Charts: compare categories with customisable axes, tooltips and labels. Explore the live JavaScript example and copy the code.',
        intro: 'This example shows a bar chart built with AG Charts, comparing values across categories. Customise the axes, series colours, [tooltips](/r/tooltips/) and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'grouped-stacked-bar': {
        title: 'Grouped Stacked Bar Chart Example | AG Charts',
        h1: 'Grouped Stacked Bar Chart Example',
        description:
            'An interactive grouped stacked bar chart built with AG Charts: compare categories with customisable axes, tooltips and labels. Live AG Charts example.',
        intro: 'This example shows a grouped stacked bar chart built with AG Charts, comparing values across categories. Configure the axes, series colours, tooltips and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'stacked-bar': {
        title: 'Stacked Bar Chart Example | AG Charts',
        h1: 'Stacked Bar Chart Example',
        description:
            'An interactive stacked bar chart built with AG Charts: compare categories with customisable axes, tooltips and labels. Explore the live AG Charts example.',
        intro: 'This example shows a stacked bar chart built with AG Charts, comparing values across categories. Configure the axes, series colours, tooltips and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'simple-horizontal-bar': {
        title: 'Horizontal Bar Chart Example | AG Charts',
        h1: 'Horizontal Bar Chart Example',
        description:
            'An interactive horizontal bar chart built with AG Charts: compare categories with customisable axes, tooltips and labels. Live AG Charts example.',
        intro: 'This example shows a horizontal bar chart built with AG Charts, comparing values across categories. Configure the axes, series colours, tooltips and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'stacked-horizontal-bar': {
        title: 'Stacked Horizontal Bar Chart Example | AG Charts',
        h1: 'Stacked Horizontal Bar Chart Example',
        description:
            'An interactive stacked horizontal bar chart built with AG Charts: compare categories with customisable axes, tooltips and labels. Live AG Charts example.',
        intro: 'This example shows a stacked horizontal bar chart built with AG Charts, comparing values across categories. Configure the axes, series colours, tooltips and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'grouped-horizontal-bar': {
        title: 'Grouped Horizontal Bar Chart Example | AG Charts',
        h1: 'Grouped Horizontal Bar Chart Example',
        description:
            'An interactive grouped horizontal bar chart built with AG Charts: compare categories with customisable axes, tooltips and labels. Live AG Charts example.',
        intro: 'This example shows a grouped horizontal bar chart built with AG Charts, comparing values across categories. Configure the axes, series colours, tooltips and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'simple-line': {
        title: 'Line Chart Example - JavaScript & React | AG Charts',
        h1: 'Line Chart Example',
        description:
            'An interactive line chart built with AG Charts: plot trends over time with custom axes, markers and tooltips. Explore the live example and copy the code.',
        intro: 'This example shows a line chart built with AG Charts, plotting a series over a category or time axis to reveal trends. Configure markers, gaps, time axes and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'line-with-gaps': {
        title: 'Line Chart With Gaps Example - JavaScript & React | AG Charts',
        h1: 'Line Chart With Gaps Example',
        description:
            'An interactive line chart with gaps built with AG Charts: plot trends over time with custom axes, markers and tooltips. Explore the live AG Charts example.',
        intro: 'This example shows a line chart with gaps built with AG Charts, plotting a series over a category or time axis to reveal trends. Configure markers, gaps, time axes and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'multiple-line-series': {
        title: 'Line Chart with Multiple Series Example | AG Charts',
        h1: 'Line Chart with Multiple Series Example',
        description:
            'An interactive line chart with multiple series built with AG Charts: plot trends over time with custom axes, markers and tooltips. Live AG Charts example.',
        intro: 'This example shows a line chart with multiple series built with AG Charts, plotting a series over a category or time axis to reveal trends. Configure markers, gaps, time axes and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'line-with-time-axis': {
        title: 'Line Chart With Time Axis Example | AG Charts',
        h1: 'Line Chart With Time Axis Example',
        description:
            'An interactive line chart with time axis built with AG Charts: plot trends over time with custom axes, markers and tooltips. Live AG Charts example.',
        intro: 'This example shows a line chart with time axis built with AG Charts, plotting a series over a category or time axis to reveal trends. Configure markers, gaps, time axes and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'multiple-line-series-large-data': {
        title: 'Line Chart With Large Data Example | AG Charts',
        h1: 'Line Chart With Large Data Example',
        description:
            'An interactive line chart with large data built with AG Charts: plot trends over time with custom axes, markers and tooltips. Live AG Charts example.',
        intro: 'This example shows a line chart with large data built with AG Charts, plotting a series over a category or time axis to reveal trends. Configure markers, gaps, time axes and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'line-with-labels': {
        title: 'Line Chart With Labels Example - JavaScript & React | AG Charts',
        h1: 'Line Chart With Labels Example',
        description:
            'An interactive line chart with labels built with AG Charts: plot trends over time with custom axes, markers and tooltips. Live AG Charts example.',
        intro: 'This example shows a line chart with labels built with AG Charts, plotting a series over a category or time axis to reveal trends. Configure markers, gaps, time axes and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'simple-area': {
        title: 'Area Chart Example - JavaScript Data Visualization | AG Charts',
        h1: 'Area Chart Example',
        description:
            'An interactive area chart built with AG Charts: show magnitude and trend over time with fills, markers and stacking. Explore the live example and copy the code.',
        intro: 'This example shows an area chart built with AG Charts, filling the space under a line to emphasise volume over time. Add markers, stacking or negative values, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'area-with-labels': {
        title: 'Area Chart With Labels Example | AG Charts',
        h1: 'Area Chart With Labels Example',
        description:
            'An interactive area chart with labels built with AG Charts: show magnitude and trend over time with fills, markers and stacking. Live AG Charts example.',
        intro: 'This example shows an area chart with labels built with AG Charts, filling the space under a line to emphasise volume over time. Configure markers, stacking and negative values, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'stacked-area': {
        title: 'Stacked Area Chart Example | AG Charts',
        h1: 'Stacked Area Chart Example',
        description:
            'An interactive stacked area chart built with AG Charts: show magnitude and trend over time with fills, markers and stacking. Live AG Charts example.',
        intro: 'This example shows a stacked area chart built with AG Charts, filling the space under a line to emphasise volume over time. Configure markers, stacking and negative values, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'area-with-markers': {
        title: 'Area Chart With Markers Example | AG Charts',
        h1: 'Area Chart With Markers Example',
        description:
            'An interactive area chart with markers built with AG Charts: show magnitude and trend over time with fills, markers and stacking. Live AG Charts example.',
        intro: 'This example shows an area chart with markers built with AG Charts, filling the space under a line to emphasise volume over time. Configure markers, stacking and negative values, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    '100--stacked-area': {
        title: '100% Stacked Area Chart Example | AG Charts',
        h1: '100% Stacked Area Chart Example',
        description:
            'An interactive 100% stacked area chart built with AG Charts: show magnitude and trend over time with fills, markers and stacking. Live AG Charts example.',
        intro: 'This example shows a 100% stacked area chart built with AG Charts, filling the space under a line to emphasise volume over time. Configure markers, stacking and negative values, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'area-with-negative-values': {
        title: 'Area Chart With Negative Values Example | AG Charts',
        h1: 'Area Chart With Negative Values Example',
        description:
            'Area chart with negative values built with AG Charts: show magnitude and trend over time with fills, markers and stacking. Live AG Charts example.',
        intro: 'This example shows an area chart with negative values built with AG Charts, filling the space under a line to emphasise volume over time. Configure markers, stacking and negative values, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'simple-scatter': {
        title: 'Scatter Chart Example | AG Charts',
        h1: 'Scatter Chart Example',
        description:
            'An interactive scatter chart built with AG Charts: reveal correlation between two variables with custom markers and axes. Live AG Charts example.',
        intro: 'This example shows a scatter chart built with AG Charts, plotting two numeric variables against each other to expose correlation. Configure the marker shapes, axes, labels and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'multiple-scatter-series': {
        title: 'Scatter Chart with Multiple Series Example | AG Charts',
        h1: 'Scatter Chart with Multiple Series Example',
        description:
            'Scatter chart with multiple series built with AG Charts: reveal correlation between two variables with custom markers and axes. Live AG Charts example.',
        intro: 'This example shows a scatter chart with multiple series built with AG Charts, plotting two numeric variables against each other to expose correlation. Configure the marker shapes, axes, labels and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'scatter-with-large-data': {
        title: 'Scatter Chart With Large Data Example | AG Charts',
        h1: 'Scatter Chart With Large Data Example',
        description:
            'Scatter chart with large data built with AG Charts: reveal correlation between two variables with custom markers and axes. Live AG Charts example.',
        intro: 'This example shows a scatter chart with large data built with AG Charts, plotting two numeric variables against each other to expose correlation. Configure the marker shapes, axes, labels and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'scatter-with-custom-markers': {
        title: 'Scatter Chart With Custom Markers Example | AG Charts',
        h1: 'Scatter Chart With Custom Markers Example',
        description:
            'Scatter chart with custom markers built with AG Charts: reveal correlation between two variables with custom markers and axes. Live AG Charts example.',
        intro: 'This example shows a scatter chart with custom markers built with AG Charts, plotting two numeric variables against each other to expose correlation. Configure the marker shapes, axes, labels and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'scatter-with-labels': {
        title: 'Scatter Chart With Labels Example | AG Charts',
        h1: 'Scatter Chart With Labels Example',
        description:
            'Scatter chart with labels built with AG Charts: reveal correlation between two variables with custom markers and axes. Explore the live AG Charts example.',
        intro: 'This example shows a scatter chart with labels built with AG Charts, plotting two numeric variables against each other to expose correlation. Configure the marker shapes, axes, labels and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'scatter-with-multiple-axes': {
        title: 'Scatter Chart With Multiple Axes Example | AG Charts',
        h1: 'Scatter Chart With Multiple Axes Example',
        description:
            'Scatter chart with multiple axes built with AG Charts: reveal correlation between two variables with custom markers and axes. Live AG Charts example.',
        intro: 'This example shows a scatter chart with multiple axes built with AG Charts, plotting two numeric variables against each other to expose correlation. Configure the marker shapes, axes, labels and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'bubble-with-negative-values': {
        title: 'Bubble Chart Example | AG Charts',
        h1: 'Bubble Chart Example',
        description:
            'An interactive bubble chart built with AG Charts: compare three variables at once with size-scaled markers and labels. Explore the live AG Charts example.',
        intro: 'This example shows a bubble chart built with AG Charts, sizing each marker by a third variable to compare three dimensions at once. Configure the size scale, marker shapes, labels and fills, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'multiple-bubble-series': {
        title: 'Multiple Bubble Series Chart Example | AG Charts',
        h1: 'Multiple Bubble Series Chart Example',
        description:
            'Multiple bubble series chart built with AG Charts: compare three variables at once with size-scaled markers and labels. Explore the live AG Charts example.',
        intro: 'This example shows a multiple bubble series chart built with AG Charts, sizing each marker by a third variable to compare three dimensions at once. Configure the size scale, marker shapes, labels and fills, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'bubble-with-categories': {
        title: 'Bubble Chart With Categories Example | AG Charts',
        h1: 'Bubble Chart With Categories Example',
        description:
            'Bubble chart with categories built with AG Charts: compare three variables at once with size-scaled markers and labels. Explore the live AG Charts example.',
        intro: 'This example shows a bubble chart with categories built with AG Charts, sizing each marker by a third variable to compare three dimensions at once. Configure the size scale, marker shapes, labels and fills, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'bubble-with-images': {
        title: 'Bubble Chart With Images Example | AG Charts',
        h1: 'Bubble Chart With Images Example',
        description:
            'An interactive bubble chart with images built with AG Charts: compare three variables at once with size-scaled markers and labels. Live AG Charts example.',
        intro: 'This example shows a bubble chart with images built with AG Charts, sizing each marker by a third variable to compare three dimensions at once. Configure the size scale, marker shapes, labels and fills, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'bubble-with-patterns': {
        title: 'Bubble Chart With Patterns Example | AG Charts',
        h1: 'Bubble Chart With Patterns Example',
        description:
            'Bubble chart with patterns built with AG Charts: compare three variables at once with size-scaled markers and labels. Explore the live AG Charts example.',
        intro: 'This example shows a bubble chart with patterns built with AG Charts, sizing each marker by a third variable to compare three dimensions at once. Configure the size scale, marker shapes, labels and fills, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'bubble-with-custom-svg-patterns': {
        title: 'Bubble Chart With Custom SVG Patterns Example | AG Charts',
        h1: 'Bubble Chart With Custom SVG Patterns Example',
        description:
            'Bubble chart with custom SVG patterns built with AG Charts: compare three variables at once with size-scaled markers and labels. Live AG Charts example.',
        intro: 'This example shows a bubble chart with custom SVG patterns built with AG Charts, sizing each marker by a third variable to compare three dimensions at once. Configure the size scale, marker shapes, labels and fills, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'simple-pie': {
        title: 'Pie Chart Example - JavaScript Data Visualization | AG Charts',
        h1: 'Pie Chart Example',
        description:
            'An interactive pie chart built with AG Charts: show proportions of a whole with labels, tooltips and a custom radius. Explore the live example and copy the code.',
        intro: 'This example shows a pie chart built with AG Charts, breaking a total into proportional slices. Configure labels, tooltips, colours and variable radius, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'pie-with-variable-radius': {
        title: 'Pie Chart With Variable Radius Example | AG Charts',
        h1: 'Pie Chart With Variable Radius Example',
        description:
            'Pie chart with variable radius built with AG Charts: show proportions of a whole with labels, tooltips and a custom radius. Live AG Charts example.',
        intro: 'This example shows a pie chart with variable radius built with AG Charts, breaking a total into proportional slices. Configure labels, tooltips, colours and variable radius, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'pie-in-a-donut': {
        title: 'Pie Chart In A Donut Example | AG Charts',
        h1: 'Pie Chart In A Donut Example',
        description:
            'An interactive pie chart in A donut built with AG Charts: show proportions of a whole with labels, tooltips and a custom radius. Live AG Charts example.',
        intro: 'This example shows a pie chart in A donut built with AG Charts, breaking a total into proportional slices. Configure labels, tooltips, colours and variable radius, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'simple-donut': {
        title: 'Donut Chart Example - JavaScript Data Visualization | AG Charts',
        h1: 'Donut Chart Example',
        description:
            'An interactive donut chart built with AG Charts: show proportions with a centre label, custom radius and tooltips. Explore the live example and copy the code.',
        intro: 'This example shows a donut chart built with AG Charts, a pie chart with a hollow centre ideal for a headline total. Configure inner radius, labels and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'donut-with-variable-radius': {
        title: 'Donut Chart With Variable Radius Example | AG Charts',
        h1: 'Donut Chart With Variable Radius Example',
        description:
            'Donut chart with variable radius built with AG Charts: show proportions with a centre label, custom radius and tooltips. Live AG Charts example.',
        intro: 'This example shows a donut chart with variable radius built with AG Charts, a pie chart with a hollow centre ideal for a headline total. Configure the inner radius, labels and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'multiple-donuts': {
        title: 'Multiple Donut Charts Example | AG Charts',
        h1: 'Multiple Donut Charts Example',
        description:
            'An interactive multiple donut charts built with AG Charts: show proportions with a centre label, custom radius and tooltips. Live AG Charts example.',
        intro: 'This example shows a multiple donut charts built with AG Charts, a pie chart with a hollow centre ideal for a headline total. Configure the inner radius, labels and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'multiple-map-shape-series': {
        title: 'Map Chart With Multiple Shape Series Example | AG Charts',
        h1: 'Map Chart With Multiple Shape Series Example',
        description:
            'Map chart with multiple shape series built with AG Charts: plot data onto geographic shapes, lines and markers with custom colours. Live AG Charts example.',
        intro: 'This example shows a map chart with multiple shape series built with AG Charts, plotting values onto geographic regions, lines and markers. Configure the topology, colour scales, markers and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'multiple-map-series': {
        title: 'Multiple Map Chart Series Example | AG Charts',
        h1: 'Multiple Map Chart Series Example',
        description:
            'Multiple map chart series built with AG Charts: plot data onto geographic shapes, lines and markers with custom colours. Live AG Charts example.',
        intro: 'This example shows a multiple map chart series built with AG Charts, plotting values onto geographic regions, lines and markers. Configure the topology, colour scales, markers and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'map-heatmap-series': {
        title: 'Map Chart with Heatmap Example | AG Charts',
        h1: 'Map Chart with Heatmap Example',
        description:
            'Map chart with heatmap built with AG Charts: plot data onto geographic shapes, lines and markers with custom colours. Explore the live AG Charts example.',
        intro: 'This example shows a map chart with heatmap built with AG Charts, plotting values onto geographic regions, lines and markers. Configure the topology, colour scales, markers and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'map-shapes-lines': {
        title: 'Map Chart With Shapes and Lines Example | AG Charts',
        h1: 'Map Chart With Shapes and Lines Example',
        description:
            'Map chart with shapes and lines built with AG Charts: plot data onto geographic shapes, lines and markers with custom colours. Live AG Charts example.',
        intro: 'This example shows a map chart with shapes and lines built with AG Charts, plotting values onto geographic regions, lines and markers. Configure the topology, colour scales, markers and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'map-lines-markers': {
        title: 'Map Chart with Lines and Markers Example | AG Charts',
        h1: 'Map Chart with Lines and Markers Example',
        description:
            'Map chart with lines and markers built with AG Charts: plot data onto geographic shapes, lines and markers with custom colours. Live AG Charts example.',
        intro: 'This example shows a map chart with lines and markers built with AG Charts, plotting values onto geographic regions, lines and markers. Configure the topology, colour scales, markers and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'map-kitchen-sink': {
        title: 'Map Chart Kitchen Sink Example | AG Charts',
        h1: 'Map Chart Kitchen Sink Example',
        description:
            'Map chart kitchen sink built with AG Charts: plot data onto geographic shapes, lines and markers with custom colours. Explore the live AG Charts example.',
        intro: 'This example shows a map chart kitchen sink built with AG Charts, plotting values onto geographic regions, lines and markers. Configure the topology, colour scales, markers and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'simple-org-chart-with-images': {
        title: 'Org Chart With Images Example | AG Charts',
        h1: 'Org Chart With Images Example',
        description:
            'An interactive org chart with images built with AG Charts: lay out a reporting hierarchy with custom nodes, labels and images. Live AG Charts example.',
        intro: 'This example shows an org chart with images built with AG Charts, laying out a reporting hierarchy as connected nodes. Configure the node contents, labels, images and layout, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'simple-org-chart-with-categories': {
        title: 'Org Chart With Categories Example | AG Charts',
        h1: 'Org Chart With Categories Example',
        description:
            'An interactive org chart with categories built with AG Charts: lay out a reporting hierarchy with custom nodes, labels and images. Live AG Charts example.',
        intro: 'This example shows an org chart with categories built with AG Charts, laying out a reporting hierarchy as connected nodes. Configure the node contents, labels, images and layout, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'org-chart-with-many-nodes': {
        title: 'Org Chart With Many Nodes Example | AG Charts',
        h1: 'Org Chart With Many Nodes Example',
        description:
            'An interactive org chart with many nodes built with AG Charts: lay out a reporting hierarchy with custom nodes, labels and images. Live AG Charts example.',
        intro: 'This example shows an org chart with many nodes built with AG Charts, laying out a reporting hierarchy as connected nodes. Configure the node contents, labels, images and layout, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'simple-histogram': {
        title: 'Histogram Chart Example | AG Charts',
        h1: 'Histogram Chart Example',
        description:
            'An interactive histogram chart built with AG Charts: show the distribution of continuous data with custom bins and tooltips. Live AG Charts example.',
        intro: 'This example shows a histogram chart built with AG Charts, grouping continuous values into bins to show their distribution. Configure the bin sizes, boundaries, axes and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'histogram-with-specified-bins': {
        title: 'Histogram Chart With Specified Bins Example | AG Charts',
        h1: 'Histogram Chart With Specified Bins Example',
        description:
            'Histogram chart with specified bins built with AG Charts: show the distribution of continuous data with custom bins and tooltips. Live AG Charts example.',
        intro: 'This example shows a histogram chart with specified bins built with AG Charts, grouping continuous values into bins to show their distribution. Configure the bin sizes, boundaries, axes and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'histogram-with-missing-bins': {
        title: 'Histogram Chart With Missing Bins Example | AG Charts',
        h1: 'Histogram Chart With Missing Bins Example',
        description:
            'Histogram chart with missing bins built with AG Charts: show the distribution of continuous data with custom bins and tooltips. Live AG Charts example.',
        intro: 'This example shows a histogram chart with missing bins built with AG Charts, grouping continuous values into bins to show their distribution. Configure the bin sizes, boundaries, axes and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'simple-range-bar': {
        title: 'Range Bar Chart Example | AG Charts',
        h1: 'Range Bar Chart Example',
        description:
            'An interactive range bar chart built with AG Charts: show a low-to-high span per category with labels and custom axes. Explore the live AG Charts example.',
        intro: 'This example shows a range bar chart built with AG Charts, drawing each category as a bar spanning a low and a high value. Configure the axes, labels, colours and orientation, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'range-bar-with-labels': {
        title: 'Range Bar Chart With Labels Example | AG Charts',
        h1: 'Range Bar Chart With Labels Example',
        description:
            'An interactive range bar chart with labels built with AG Charts: show a low-to-high span per category with labels and custom axes. Live AG Charts example.',
        intro: 'This example shows a range bar chart with labels built with AG Charts, drawing each category as a bar spanning a low and a high value. Configure the axes, labels, colours and orientation, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'multiple-range-bars': {
        title: 'Range Bar Chart with Multiple Series Example | AG Charts',
        h1: 'Range Bar Chart with Multiple Series Example',
        description:
            'Range bar chart with multiple series built with AG Charts: show a low-to-high span per category with labels and custom axes. Live AG Charts example.',
        intro: 'This example shows a range bar chart with multiple series built with AG Charts, drawing each category as a bar spanning a low and a high value. Configure the axes, labels, colours and orientation, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'horizontal-range-bar': {
        title: 'Horizontal Range Bar Chart Example | AG Charts',
        h1: 'Horizontal Range Bar Chart Example',
        description:
            'An interactive horizontal range bar chart built with AG Charts: show a low-to-high span per category with labels and custom axes. Live AG Charts example.',
        intro: 'This example shows a horizontal range bar chart built with AG Charts, drawing each category as a bar spanning a low and a high value. Configure the axes, labels, colours and orientation, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'horizontal-range-bar-with-labels': {
        title: 'Horizontal Range Bar Chart With Labels Example | AG Charts',
        h1: 'Horizontal Range Bar Chart With Labels Example',
        description:
            'Horizontal range bar chart with labels built with AG Charts: show a low-to-high span per category with labels and custom axes. Live AG Charts example.',
        intro: 'This example shows a horizontal range bar chart with labels built with AG Charts, drawing each category as a bar spanning a low and a high value. Configure the axes, labels, colours and orientation, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'multiple-horizontal-range-bars': {
        title: 'Horizontal Range Bar Charts with Multiple Series Example | AG Charts',
        h1: 'Horizontal Range Bar Charts with Multiple Series Example',
        description:
            'Horizontal range bar charts with multiple series: show a low-to-high span per category with labels and custom axes. Explore the live AG Charts example.',
        intro: 'This example shows a horizontal range bar charts with multiple series built with AG Charts, drawing each category as a bar spanning a low and a high value. Configure the axes, labels, colours and orientation, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'simple-range-area': {
        title: 'Range Area Chart Example | AG Charts',
        h1: 'Range Area Chart Example',
        description:
            'An interactive range area chart built with AG Charts: shade the band between two series with custom fills and labels. Explore the live AG Charts example.',
        intro: 'This example shows a range area chart built with AG Charts, shading the band between a low and a high series over time. Configure the fills, difference styling, labels and axes, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'range-area-difference-inverted-style': {
        title: 'Range Area Difference Chart With Inverted Style Example | AG Charts',
        h1: 'Range Area Difference Chart With Inverted Style Example',
        description:
            'Range area difference chart with inverted style: shade the band between two series with custom fills and labels. Explore the live AG Charts example.',
        intro: 'This example shows a range area difference chart with inverted style built with AG Charts, shading the band between a low and a high series over time. Configure the fills, difference styling, labels and axes, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'range-area-with-labels': {
        title: 'Range Area Chart With Labels Example | AG Charts',
        h1: 'Range Area Chart With Labels Example',
        description:
            'An interactive range area chart with labels built with AG Charts: shade the band between two series with custom fills and labels. Live AG Charts example.',
        intro: 'This example shows a range area chart with labels built with AG Charts, shading the band between a low and a high series over time. Configure the fills, difference styling, labels and axes, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'simple-waterfall': {
        title: 'Waterfall Chart Example - JavaScript Data Viz | AG Charts',
        h1: 'Waterfall Chart Example',
        description:
            'An interactive waterfall chart built with AG Charts: show how sequential positive and negative values build to a total. Explore the live example and copy the code.',
        intro: 'This example shows a waterfall chart built with AG Charts, breaking down how successive increases and decreases lead to a final total. Customise totals, colours and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'horizontal-waterfall': {
        title: 'Horizontal Waterfall Chart Example | AG Charts',
        h1: 'Horizontal Waterfall Chart Example',
        description:
            'An interactive horizontal waterfall chart built with AG Charts: show how sequential positive and negative values build to a total. Live AG Charts example.',
        intro: 'This example shows a horizontal waterfall chart built with AG Charts, breaking down how successive increases and decreases lead to a final total. Configure the totals, colours and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'customised-waterfall': {
        title: 'Customised Waterfall Chart Example | AG Charts',
        h1: 'Customised Waterfall Chart Example',
        description:
            'An interactive customised waterfall chart built with AG Charts: show how sequential positive and negative values build to a total. Live AG Charts example.',
        intro: 'This example shows a customised waterfall chart built with AG Charts, breaking down how successive increases and decreases lead to a final total. Configure the totals, colours and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'simple-box-plot': {
        title: 'Box Plot Chart Example | AG Charts',
        h1: 'Box Plot Chart Example',
        description:
            'An interactive box plot chart built with AG Charts: summarise distributions with quartiles, medians, whiskers and tooltips. Live AG Charts example.',
        intro: 'This example shows a box plot chart built with AG Charts, summarising a distribution through its quartiles, median and whiskers. Configure the whiskers, caps, colours and orientation, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'multiple-box-plots': {
        title: 'Box Plot Chart with Multiple Series Example | AG Charts',
        h1: 'Box Plot Chart with Multiple Series Example',
        description:
            'Box plot chart with multiple series built with AG Charts: summarise distributions with quartiles, medians, whiskers and tooltips. Live AG Charts example.',
        intro: 'This example shows a box plot chart with multiple series built with AG Charts, summarising a distribution through its quartiles, median and whiskers. Configure the whiskers, caps, colours and orientation, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'horizontal-box-plot': {
        title: 'Horizontal Box Plot Chart Example | AG Charts',
        h1: 'Horizontal Box Plot Chart Example',
        description:
            'Horizontal box plot chart built with AG Charts: summarise distributions with quartiles, medians, whiskers and tooltips. Explore the live AG Charts example.',
        intro: 'This example shows a horizontal box plot chart built with AG Charts, summarising a distribution through its quartiles, median and whiskers. Configure the whiskers, caps, colours and orientation, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    candlestick: {
        title: 'Candlestick Chart Example - JavaScript Finance | AG Charts',
        h1: 'Candlestick Chart Example',
        description:
            'An interactive candlestick chart built with AG Charts: plot open, high, low and close for financial data with zoom and tooltips. Explore the live example.',
        intro: 'This example shows a candlestick chart built with AG Charts, plotting open, high, low and close values to visualise price movement over time. Configure colours, zoom and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'candlestick-hollow': {
        title: 'Hollow Candlestick Chart Example | AG Charts',
        h1: 'Hollow Candlestick Chart Example',
        description:
            'Hollow candlestick chart built with AG Charts: plot open, high, low and close for financial data with zoom and tooltips. Live AG Charts example.',
        intro: 'This example shows a hollow candlestick chart built with AG Charts, plotting open, high, low and close values to visualise price movement over time. Configure the colours, zoom and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    ohlc: {
        title: 'OHLC Chart Example - JavaScript Finance | AG Charts',
        h1: 'OHLC Chart Example',
        description:
            'An interactive OHLC chart built with AG Charts: plot open, high, low and close price bars with zoom and tooltips. Explore the live AG Charts example.',
        intro: 'This example shows an OHLC chart built with AG Charts, plotting open, high, low and close as vertical bars with side ticks. Configure the colours, zoom and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'simple-radar-line': {
        title: 'Radar Line Chart Example - JavaScript Spider Chart | AG Charts',
        h1: 'Radar Line Chart Example',
        description:
            'An interactive radar line chart built with AG Charts: compare several measures on a circular axis with markers and labels. Live AG Charts example.',
        intro: 'This example shows a radar line chart built with AG Charts, plotting a series around a circular axis to compare several measures at once. Configure the markers, axis order, labels and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'radar-with-markers': {
        title: 'Radar Chart With Markers Example | AG Charts',
        h1: 'Radar Chart With Markers Example',
        description:
            'An interactive radar chart with markers built with AG Charts: compare several measures on a circular axis with markers and labels. Live AG Charts example.',
        intro: 'This example shows a radar chart with markers built with AG Charts, plotting a series around a circular axis to compare several measures at once. Configure the markers, axis order, labels and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'reversed-radar-with-markers': {
        title: 'Reversed Radar Chart With Markers Example | AG Charts',
        h1: 'Reversed Radar Chart With Markers Example',
        description:
            'Reversed radar chart with markers built with AG Charts: compare several measures on a circular axis with markers and labels. Live AG Charts example.',
        intro: 'This example shows a reversed radar chart with markers built with AG Charts, plotting a series around a circular axis to compare several measures at once. Configure the markers, axis order, labels and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'simple-radar-area': {
        title: 'Radar Area Chart Example - JavaScript Spider Chart | AG Charts',
        h1: 'Radar Area Chart Example',
        description:
            'An interactive radar area chart built with AG Charts: compare measures on a circular axis with filled areas and labels. Explore the live AG Charts example.',
        intro: 'This example shows a radar area chart built with AG Charts, filling the area inside a circular axis to compare several measures at once. Configure the fills, axis order, labels and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'radar-area-with-labels': {
        title: 'Radar Area Chart With Labels Example | AG Charts',
        h1: 'Radar Area Chart With Labels Example',
        description:
            'An interactive radar area chart with labels built with AG Charts: compare measures on a circular axis with filled areas and labels. Live AG Charts example.',
        intro: 'This example shows a radar area chart with labels built with AG Charts, filling the area inside a circular axis to compare several measures at once. Configure the fills, axis order, labels and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'reversed-radar-area': {
        title: 'Reversed Radar Area Chart Example | AG Charts',
        h1: 'Reversed Radar Area Chart Example',
        description:
            'An interactive reversed radar area chart built with AG Charts: compare measures on a circular axis with filled areas and labels. Live AG Charts example.',
        intro: 'This example shows a reversed radar area chart built with AG Charts, filling the area inside a circular axis to compare several measures at once. Configure the fills, axis order, labels and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'simple-nightingale': {
        title: 'Nightingale Chart Example - JavaScript Polar Chart | AG Charts',
        h1: 'Nightingale Chart Example',
        description:
            'An interactive nightingale chart built with AG Charts: compare categories as polar wedges with custom radius and labels. Live AG Charts example.',
        intro: 'This example shows a nightingale chart built with AG Charts, drawing each category as a wedge whose radius carries its value. Configure the radius scale, colours, labels and axis order, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'multiple-nightingale-series': {
        title: 'Nightingale Chart with Multiple Series Example | AG Charts',
        h1: 'Nightingale Chart with Multiple Series Example',
        description:
            'Nightingale chart with multiple series built with AG Charts: compare categories as polar wedges with custom radius and labels. Live AG Charts example.',
        intro: 'This example shows a nightingale chart with multiple series built with AG Charts, drawing each category as a wedge whose radius carries its value. Configure the radius scale, colours, labels and axis order, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'reversed-nightingale': {
        title: 'Reversed Nightingale Chart Example | AG Charts',
        h1: 'Reversed Nightingale Chart Example',
        description:
            'An interactive reversed nightingale chart built with AG Charts: compare categories as polar wedges with custom radius and labels. Live AG Charts example.',
        intro: 'This example shows a reversed nightingale chart built with AG Charts, drawing each category as a wedge whose radius carries its value. Configure the radius scale, colours, labels and axis order, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'simple-radial-column': {
        title: 'Radial Column Chart Example | AG Charts',
        h1: 'Radial Column Chart Example',
        description:
            'An interactive radial column chart built with AG Charts: compare categories as radial columns with custom axes and labels. Live AG Charts example.',
        intro: 'This example shows a radial column chart built with AG Charts, wrapping a column chart around a circular axis. Configure the inner radius, grouping, colours and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'grouped-radial-column': {
        title: 'Grouped Radial Column Chart Example | AG Charts',
        h1: 'Grouped Radial Column Chart Example',
        description:
            'An interactive grouped radial column chart built with AG Charts: compare categories as radial columns with custom axes and labels. Live AG Charts example.',
        intro: 'This example shows a grouped radial column chart built with AG Charts, wrapping a column chart around a circular axis. Configure the inner radius, grouping, colours and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'reversed-radial-column': {
        title: 'Reversed Radial Column Chart Example | AG Charts',
        h1: 'Reversed Radial Column Chart Example',
        description:
            'An interactive reversed radial column chart built with AG Charts: compare categories as radial columns with custom axes and labels. Live AG Charts example.',
        intro: 'This example shows a reversed radial column chart built with AG Charts, wrapping a column chart around a circular axis. Configure the inner radius, grouping, colours and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'simple-radial-bar': {
        title: 'Radial Bar Chart Example - JavaScript Polar Chart | AG Charts',
        h1: 'Radial Bar Chart Example',
        description:
            'An interactive radial bar chart built with AG Charts: compare categories as concentric arcs with stacking and labels. Explore the live AG Charts example.',
        intro: 'This example shows a radial bar chart built with AG Charts, drawing each category as an arc whose length carries its value. Configure the inner radius, stacking, colours and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'stacked-radial-bar': {
        title: 'Stacked Radial Bar Chart Example | AG Charts',
        h1: 'Stacked Radial Bar Chart Example',
        description:
            'An interactive stacked radial bar chart built with AG Charts: compare categories as concentric arcs with stacking and labels. Live AG Charts example.',
        intro: 'This example shows a stacked radial bar chart built with AG Charts, drawing each category as an arc whose length carries its value. Configure the inner radius, stacking, colours and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'reversed-radial-bar': {
        title: 'Reversed Radial Bar Chart Example | AG Charts',
        h1: 'Reversed Radial Bar Chart Example',
        description:
            'An interactive reversed radial bar chart built with AG Charts: compare categories as concentric arcs with stacking and labels. Live AG Charts example.',
        intro: 'This example shows a reversed radial bar chart built with AG Charts, drawing each category as an arc whose length carries its value. Configure the inner radius, stacking, colours and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'simple-sunburst': {
        title: 'Sunburst Chart Example - JavaScript Hierarchy Chart | AG Charts',
        h1: 'Sunburst Chart Example',
        description:
            'An interactive sunburst chart built with AG Charts: show a hierarchy as concentric rings with colour ranges and labels. Explore the live AG Charts example.',
        intro: 'This example shows a sunburst chart built with AG Charts, showing a hierarchy as concentric rings, one ring per level. Configure the nesting, colour ranges, labels and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'sunburst-with-nesting': {
        title: 'Sunburst Chart with Nesting Example | AG Charts',
        h1: 'Sunburst Chart with Nesting Example',
        description:
            'Sunburst chart with nesting built with AG Charts: show a hierarchy as concentric rings with colour ranges and labels. Explore the live AG Charts example.',
        intro: 'This example shows a sunburst chart with nesting built with AG Charts, showing a hierarchy as concentric rings, one ring per level. Configure the nesting, colour ranges, labels and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'sunburst-with-color-range': {
        title: 'Sunburst Chart with Colour Range Example | AG Charts',
        h1: 'Sunburst Chart with Colour Range Example',
        description:
            'Sunburst chart with colour range built with AG Charts: show a hierarchy as concentric rings with colour ranges and labels. Live AG Charts example.',
        intro: 'This example shows a sunburst chart with colour range built with AG Charts, showing a hierarchy as concentric rings, one ring per level. Configure the nesting, colour ranges, labels and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'simple-treemap': {
        title: 'Treemap Chart Example - JavaScript Hierarchy Chart | AG Charts',
        h1: 'Treemap Chart Example',
        description:
            'An interactive treemap chart built with AG Charts: show a hierarchy as nested rectangles with colour ranges and labels. Explore the live AG Charts example.',
        intro: 'This example shows a treemap chart built with AG Charts, showing a hierarchy as nested rectangles sized by value. Configure the nesting, colour ranges, labels and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'treemap-with-nesting': {
        title: 'Treemap Chart with Nesting Example | AG Charts',
        h1: 'Treemap Chart with Nesting Example',
        description:
            'Treemap chart with nesting built with AG Charts: show a hierarchy as nested rectangles with colour ranges and labels. Explore the live AG Charts example.',
        intro: 'This example shows a treemap chart with nesting built with AG Charts, showing a hierarchy as nested rectangles sized by value. Configure the nesting, colour ranges, labels and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'treemap-with-color-range': {
        title: 'Treemap Chart with Colour Range Example | AG Charts',
        h1: 'Treemap Chart with Colour Range Example',
        description:
            'Treemap chart with colour range built with AG Charts: show a hierarchy as nested rectangles with colour ranges and labels. Live AG Charts example.',
        intro: 'This example shows a treemap chart with colour range built with AG Charts, showing a hierarchy as nested rectangles sized by value. Configure the nesting, colour ranges, labels and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'simple-heatmap': {
        title: 'Heatmap Chart Example - JavaScript Matrix Chart | AG Charts',
        h1: 'Heatmap Chart Example',
        description:
            'An interactive heatmap chart built with AG Charts: expose patterns across two categories with colour scales and labels. Explore the live AG Charts example.',
        intro: 'This example shows a heatmap chart built with AG Charts, colouring a grid of cells by value to expose patterns across two categories. Configure the colour scale, axes, labels and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'heatmap-with-labels': {
        title: 'Heatmap Chart with Labels Example | AG Charts',
        h1: 'Heatmap Chart with Labels Example',
        description:
            'An interactive heatmap chart with labels built with AG Charts: expose patterns across two categories with colour scales and labels. Live AG Charts example.',
        intro: 'This example shows a heatmap chart with labels built with AG Charts, colouring a grid of cells by value to expose patterns across two categories. Configure the colour scale, axes, labels and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'grouped-category-heatmap': {
        title: 'Heatmap Chart with Grouped Category Axis Example | AG Charts',
        h1: 'Heatmap Chart with Grouped Category Axis Example',
        description:
            'Heatmap chart with grouped category axis built with AG Charts: expose patterns across two categories with colour scales and labels. Live AG Charts example.',
        intro: 'This example shows a heatmap chart with grouped category axis built with AG Charts, colouring a grid of cells by value to expose patterns across two categories. Configure the colour scale, axes, labels and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'calendar-heatmap': {
        title: 'Calendar Heatmap Chart Example | AG Charts',
        h1: 'Calendar Heatmap Chart Example',
        description:
            'An interactive calendar heatmap chart built with AG Charts: expose patterns across two categories with colour scales and labels. Live AG Charts example.',
        intro: 'This example shows a calendar heatmap chart built with AG Charts, colouring a grid of cells by value to expose patterns across two categories. Configure the colour scale, axes, labels and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    sankey: {
        title: 'Sankey Chart Example - JavaScript Flow Diagram | AG Charts',
        h1: 'Sankey Chart Example',
        description:
            'An interactive Sankey diagram built with AG Charts: visualise flows between nodes with proportionally sized links and labels. Explore the live example.',
        intro: 'This example shows a Sankey chart built with AG Charts, visualising the flow of values between nodes with proportionally sized links. Customise nodes, links and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'sankey-customisation': {
        title: 'Customised Sankey Chart Example | AG Charts',
        h1: 'Customised Sankey Chart Example',
        description:
            'Customised sankey chart built with AG Charts: visualise flows between nodes with proportionally sized links and labels. Explore the live AG Charts example.',
        intro: 'This example shows a customised sankey chart built with AG Charts, visualising the flow of values between nodes with proportionally sized links. Configure the nodes, links and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    chord: {
        title: 'Chord Chart Example - JavaScript Flow Diagram | AG Charts',
        h1: 'Chord Chart Example',
        description:
            'An interactive chord chart built with AG Charts: show flows between nodes around a circle with sized links and labels. Explore the live AG Charts example.',
        intro: 'This example shows a chord chart built with AG Charts, showing flows between nodes arranged around a circle. Configure the nodes, links and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'chord-customisation': {
        title: 'Customised Chord Chart Example | AG Charts',
        h1: 'Customised Chord Chart Example',
        description:
            'An interactive customised chord chart built with AG Charts: show flows between nodes around a circle with sized links and labels. Live AG Charts example.',
        intro: 'This example shows a customised chord chart built with AG Charts, showing flows between nodes arranged around a circle. Configure the nodes, links and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'simple-funnel': {
        title: 'Funnel Chart Example - JavaScript Conversion Chart | AG Charts',
        h1: 'Funnel Chart Example',
        description:
            'An interactive funnel chart built with AG Charts: show drop-off across the stages of a process with labels and tooltips. Live AG Charts example.',
        intro: 'This example shows a funnel chart built with AG Charts, showing how a total falls away across the stages of a process. Configure the stage colours, labels and drop-off styling, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'customised-funnel': {
        title: 'Customised Funnel Chart Example | AG Charts',
        h1: 'Customised Funnel Chart Example',
        description:
            'An interactive customised funnel chart built with AG Charts: show drop-off across the stages of a process with labels and tooltips. Live AG Charts example.',
        intro: 'This example shows a customised funnel chart built with AG Charts, showing how a total falls away across the stages of a process. Configure the stage colours, labels and drop-off styling, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'simple-cone-funnel': {
        title: 'Cone Funnel Chart Example | AG Charts',
        h1: 'Cone Funnel Chart Example',
        description:
            'An interactive cone funnel chart built with AG Charts: show drop-off across a process as a tapering cone with labels. Explore the live AG Charts example.',
        intro: 'This example shows a cone funnel chart built with AG Charts, tapering each stage of a process to show how a total falls away. Configure the stage colours, labels and drop-off styling, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'simple-pyramid': {
        title: 'Pyramid Chart Example - JavaScript Stage Chart | AG Charts',
        h1: 'Pyramid Chart Example',
        description:
            'An interactive pyramid chart built with AG Charts: stack the stages of a process into a pyramid with labels and tooltips. Live AG Charts example.',
        intro: 'This example shows a pyramid chart built with AG Charts, stacking the stages of a process into a pyramid sized by value. Configure the stage colours, labels and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'simple-radial-gauge': {
        title: 'Radial Gauge Chart Example - JavaScript KPI Gauge | AG Charts',
        h1: 'Radial Gauge Chart Example',
        description:
            'An interactive radial gauge chart built with AG Charts: show a single KPI against its range with segments, needles and labels. Live AG Charts example.',
        intro: 'This example shows a radial gauge chart built with AG Charts, showing a single value against its range on a circular scale. Configure the scale, segments, needle and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'customised-radial-gauge': {
        title: 'Customised Radial Gauge Chart Example | AG Charts',
        h1: 'Customised Radial Gauge Chart Example',
        description:
            'Customised radial gauge chart built with AG Charts: show a single KPI against its range with segments, needles and labels. Live AG Charts example.',
        intro: 'This example shows a customised radial gauge chart built with AG Charts, showing a single value against its range on a circular scale. Configure the scale, segments, needle and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'simple-linear-gauge': {
        title: 'Linear Gauge Chart Example - JavaScript KPI Gauge | AG Charts',
        h1: 'Linear Gauge Chart Example',
        description:
            'An interactive linear gauge chart built with AG Charts: show a single KPI against its range with segments, targets and labels. Live AG Charts example.',
        intro: 'This example shows a linear gauge chart built with AG Charts, showing a single value against its range on a straight scale. Configure the scale, segments, targets and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'horizontal-linear-gauge': {
        title: 'Horizontal Linear Gauge Chart Example | AG Charts',
        h1: 'Horizontal Linear Gauge Chart Example',
        description:
            'Horizontal linear gauge chart built with AG Charts: show a single KPI against its range with segments, targets and labels. Live AG Charts example.',
        intro: 'This example shows a horizontal linear gauge chart built with AG Charts, showing a single value against its range on a straight scale. Configure the scale, segments, targets and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'simple-bullet': {
        title: 'Bullet Chart Example - JavaScript KPI Gauge | AG Charts',
        h1: 'Bullet Chart Example',
        description:
            'An interactive bullet chart built with AG Charts: show a single KPI against its range with segments, targets and labels. Live AG Charts example.',
        intro: 'This example shows a bullet chart built with AG Charts, showing a single value against its range on a straight scale. Configure the scale, segments, targets and labels, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'bar-line-combination': {
        title: 'Bar And Line Combination Chart Example | AG Charts',
        h1: 'Bar And Line Combination Chart Example',
        description:
            'Bar and line combination chart built with AG Charts: combine several series types on shared axes with independent styling. Live AG Charts example.',
        intro: 'This example shows a bar and line combination chart built with AG Charts, drawing several series types together on shared axes. Configure the series types, axes, colours and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'histogram-scatter-combination': {
        title: 'Histogram And Scatter Combination Chart Example | AG Charts',
        h1: 'Histogram And Scatter Combination Chart Example',
        description:
            'Histogram and scatter combination chart built with AG Charts: combine several series types on shared axes with independent styling. Live AG Charts example.',
        intro: 'This example shows a histogram and scatter combination chart built with AG Charts, drawing several series types together on shared axes. Configure the series types, axes, colours and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'horizontal-range-bar-scatter-combination': {
        title: 'Horizontal Range Bar And Scatter Combination Chart Example | AG Charts',
        h1: 'Horizontal Range Bar And Scatter Combination Chart Example',
        description:
            'Horizontal range bar and scatter combination chart: combine several series types on shared axes with independent styling. Live AG Charts example.',
        intro: 'This example shows a horizontal range bar and scatter combination chart built with AG Charts, drawing several series types together on shared axes. Configure the series types, axes, colours and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'radar-line-radar-area-nightingale-combination': {
        title: 'Radar Line, Radar Area And Nightingale Combination Chart Example | AG Charts',
        h1: 'Radar Line, Radar Area And Nightingale Combination Chart Example',
        description:
            'Radar line, radar area and nightingale combination chart: combine several series types on shared axes with independent styling. Live AG Charts example.',
        intro: 'This example shows a radar line, radar area and nightingale combination chart built with AG Charts, drawing several series types together on shared axes. Configure the series types, axes, colours and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'grouped-bar-line-combination': {
        title: 'Grouped Category Axis Combination Chart Example | AG Charts',
        h1: 'Grouped Category Axis Combination Chart Example',
        description:
            'Grouped category axis combination chart built with AG Charts: combine several series types on shared axes with independent styling. Live AG Charts example.',
        intro: 'This example shows a grouped category axis combination chart built with AG Charts, drawing several series types together on shared axes. Configure the series types, axes, colours and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'step-interpolation-combination': {
        title: 'Step Interpolation Combination Chart Example | AG Charts',
        h1: 'Step Interpolation Combination Chart Example',
        description:
            'Step interpolation combination chart built with AG Charts: combine several series types on shared axes with independent styling. Live AG Charts example.',
        intro: 'This example shows a step interpolation combination chart built with AG Charts, drawing several series types together on shared axes. Configure the series types, axes, colours and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'grouped-category-combination': {
        title: 'Bar, Line And Area Combination Chart Example | AG Charts',
        h1: 'Bar, Line And Area Combination Chart Example',
        description:
            'Bar, line and area combination chart built with AG Charts: combine several series types on shared axes with independent styling. Live AG Charts example.',
        intro: 'This example shows a bar, line and area combination chart built with AG Charts, drawing several series types together on shared axes. Configure the series types, axes, colours and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    },
    'stacked-bar-area-combination': {
        title: 'Stacked Bar And Area Combination Chart Example | AG Charts',
        h1: 'Stacked Bar And Area Combination Chart Example',
        description:
            'Stacked bar and area combination chart built with AG Charts: combine several series types on shared axes with independent styling. Live AG Charts example.',
        intro: 'This example shows a stacked bar and area combination chart built with AG Charts, drawing several series types together on shared axes. Configure the series types, axes, colours and tooltips, then build the same chart in JavaScript, React, Angular or Vue.',
    },
};
