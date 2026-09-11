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
    // ── Bar ──────────────────────────────────────────────────────────────
    'simple-bar': {
        title: 'Bar Chart Example - JavaScript Data Visualization | AG Charts',
        h1: 'Bar Chart Example',
        description:
            'An interactive bar chart built with AG Charts, comparing values across categories with a corner radius on each bar, labels inside the bars and band highlight on hover. Explore the live example.',
        intro: 'This example shows a [bar chart](/r/bar-series/) built with AG Charts, comparing values across categories with a [corner radius](/r/bar-series/#corner-radius) on each bar, a [data label](/r/series-labels/#placement) inside each bar and [band highlight](/r/axes-crosshairs/#band-highlight) shading the category under the pointer.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'grouped-stacked-bar': {
        title: 'Grouped Stacked Bar Chart Example - JavaScript | AG Charts',
        h1: 'Grouped Stacked Bar Chart Example',
        description:
            'An interactive grouped stacked bar chart built with AG Charts, comparing two measures side by side as separate stacks, with error bars and a secondary axis. Explore the live example.',
        intro: 'This example shows a [grouped stacked bar chart](/r/bar-series/#grouped-stacks) built with AG Charts, comparing two measures across categories by splitting them into two side-by-side stacks. [Error bars](/r/error-bars/#single-error-bars) mark the upper and lower bounds of each series in one group, a [secondary axis](/r/axes-secondary/#creating-a-secondary-axis) scales the other, and a [shared tooltip](/r/tooltips/#tooltip-modes) reads every value at once.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'stacked-bar': {
        title: 'Stacked Bar Chart Example - JavaScript Data Visualization | AG Charts',
        h1: 'Stacked Bar Chart Example',
        description:
            'An interactive stacked bar chart built with AG Charts, showing each category as a share of 100% of its total, with labels on the bars and a floating legend. Explore the live example.',
        intro: 'This example shows a [stacked bar chart](/r/bar-series/#stacked-bar) built with AG Charts, showing a part-to-whole breakdown of each category by [normalising every stack to 100%](/r/bar-series/#normalised-bar). [Data labels](/r/series-labels/#styling) sit on the bars, a [floating legend](/r/legend/#floating) overlays the series area, and an [axis label formatter](/r/axes-labels/#formatter) renders the shares as percentages.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'simple-horizontal-bar': {
        title: 'Horizontal Bar Chart Example - JavaScript Data Visualization | AG Charts',
        h1: 'Horizontal Bar Chart Example',
        description:
            'An interactive horizontal bar chart built with AG Charts, ranking values across categories with error bars, rounded bar corners and an item styler varying bar opacity. Explore the live example.',
        intro: "This example shows a [horizontal bar chart](/r/bar-series/#horizontal-bar) built with AG Charts, ranking values across categories so long category names stay readable. [Error bars](/r/error-bars/#single-error-bars) show the confidence interval around each value, an [item styler](/r/stylers/#item-stylers) scales each bar's opacity to its value, and an [axis label formatter](/r/axes-labels/#formatter) adds units to the value axis.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).",
    },
    'stacked-horizontal-bar': {
        title: 'Stacked Horizontal Bar Chart Example - JavaScript | AG Charts',
        h1: 'Stacked Horizontal Bar Chart Example',
        description:
            'An interactive stacked horizontal bar chart built with AG Charts, diverging positive and negative values either side of a zero baseline, with labelled cross lines. Explore the live example.',
        intro: 'This example shows a [stacked horizontal bar chart](/r/bar-series/#horizontal-bar) built with AG Charts, comparing two opposing measures per category by [stacking](/r/bar-series/#stacked-bar) them either side of a zero baseline. [Cross lines](/r/axes-cross-lines/#adding-cross-lines) label the positive and negative zones, an [item styler](/r/stylers/#item-stylers) scales bar opacity to magnitude, and a [custom tooltip](/r/tooltips/#modifying-content) names the measure behind each bar.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'grouped-horizontal-bar': {
        title: 'Grouped Horizontal Bar Chart Example - JavaScript | AG Charts',
        h1: 'Grouped Horizontal Bar Chart Example',
        description:
            'An interactive grouped horizontal bar chart built with AG Charts, comparing two series side by side per category, with cross lines replacing the axis labels. Explore the live example.',
        intro: 'This example shows a [grouped horizontal bar chart](/r/bar-series/#horizontal-bar) built with AG Charts, placing two series side by side within each category for direct comparison. The category axis labels are switched off and [cross lines](/r/axes-cross-lines/#adding-cross-lines) label the groups instead, with a large [corner radius](/r/bar-series/#corner-radius) on each bar and a [floating legend](/r/legend/#floating).  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },

    // ── Line ─────────────────────────────────────────────────────────────
    'simple-line': {
        title: 'Line Chart Example - JavaScript Data Visualization | AG Charts',
        h1: 'Line Chart Example',
        description:
            'An interactive line chart built with AG Charts, tracking two trends over time with error bars around each point, a unit time axis and a floating legend. Explore the live example.',
        intro: 'This example shows a [line chart](/r/line-series/) built with AG Charts, tracking how two values change over time on a [unit time axis](/r/axes-time/#unit-time). [Error bars](/r/error-bars/#single-error-bars) mark the range around each point, a [custom tooltip](/r/tooltips/#modifying-content) reports the value with its bounds, and a [floating legend](/r/legend/#floating) with a [border](/r/fills-borders/#borders) sits inside the series area.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'line-with-gaps': {
        title: 'Line Chart With Gaps Example - JavaScript Data Visualization | AG Charts',
        h1: 'Line Chart With Gaps Example',
        description:
            'A line chart built with AG Charts showing how incomplete series are drawn, breaking each line at the points where no value was recorded. Explore the live example and copy the code.',
        intro: 'This example shows a [line chart](/r/line-series/) built with AG Charts, comparing ten series whose readings are incomplete. Where a series has no value at a point, the [line breaks rather than joining across the gap](/r/line-series/#missing-data), so absent data is not mistaken for a trend. A [shared tooltip](/r/tooltips/#tooltip-modes) reads every series at once and [label spacing](/r/axes-labels/#skipping) thins the axis labels.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'multiple-line-series': {
        title: 'Line Chart with Multiple Series Example - JavaScript | AG Charts',
        h1: 'Line Chart with Multiple Series Example',
        description:
            'A line chart built with AG Charts comparing six series over time, using smooth interpolation, fixed axis tick values and a custom tooltip. Explore the live example and copy the code.',
        intro: 'This example shows a [line chart](/r/line-series/) built with AG Charts, comparing six series over time. [Smooth interpolation](/r/line-series/#interpolation) curves each line between its points, [markers are turned off](/r/line-series/#markers) to keep the lines clean at this density, [fixed tick values](/r/axes-intervals/#values) replace the automatic axis interval, and a [custom tooltip](/r/tooltips/#modifying-content) restates each value in readable units.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'line-with-time-axis': {
        title: 'Line Chart With Time Axis Example - JavaScript | AG Charts',
        h1: 'Line Chart With Time Axis Example',
        description:
            'An interactive line chart built with AG Charts plotted on a time axis, with stepped dashed lines, a cross line marking a point in time, and zoom by axis dragging. Explore the live example.',
        intro: 'This example shows a [line chart](/r/line-series/) built with AG Charts, tracking five series against dates on a [unit time axis](/r/axes-time/#unit-time) with a [fixed tick interval](/r/axes-intervals/#time-axes). The lines use [step interpolation](/r/line-series/#interpolation) and a dash pattern, a [cross line](/r/axes-cross-lines/#adding-cross-lines) marks a point in time, and [axis zoom controls](/r/zoom/#axis-zoom-controls) let you drag an axis to narrow the range.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'multiple-line-series-large-data': {
        title: 'Line Chart With Large Data Example - JavaScript | AG Charts',
        h1: 'Line Chart With Large Data Example',
        description:
            'A line chart built with AG Charts rendering 6,000 points across six series, with cross lines marking the origin and gaps where series are undefined. Explore the live example.',
        intro: 'This example shows a [line chart](/r/line-series/) built with AG Charts, rendering six series of 1,000 points each: 6,000 points in total, drawn as continuous curves without markers. [Cross lines](/r/axes-cross-lines/#adding-cross-lines) mark the origin on both axes, [gaps appear where a series is undefined](/r/line-series/#missing-data) rather than joining across it, and a [property formatter](/r/formatters/#property-formatters) labels the x-axis in its own notation.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'line-with-labels': {
        title: 'Line Chart With Labels Example - JavaScript | AG Charts',
        h1: 'Line Chart With Labels Example',
        description:
            'A line chart built with AG Charts comparing several series over time, labelling only the first and last point of each line so the endpoints read without a tooltip. Explore the live example.',
        intro: 'This example shows a [line chart](/r/line-series/) built with AG Charts, comparing several series over time with [smooth interpolation](/r/line-series/#interpolation). [Series labels](/r/series-labels/#styling) are enabled but a formatter [hides all but the first and last point of each line](/r/series-labels/#hiding-labels), so start and end values read directly off the chart, and a [cross line](/r/axes-cross-lines/#adding-cross-lines) marks a reference value.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },

    // ── Area ─────────────────────────────────────────────────────────────
    'simple-area': {
        title: 'Area Chart Example - JavaScript Data Visualization | AG Charts',
        h1: 'Area Chart Example',
        description:
            'An area chart built with AG Charts tracking a value over time, using style segments to recolour the fill and stroke wherever the value turns negative. Explore the live example.',
        intro: 'This example shows an [area chart](/r/area-series/) built with AG Charts, tracking a single value over time on a [unit time axis](/r/axes-time/#unit-time), with the area under the line filled to emphasise magnitude as well as direction. [Smooth interpolation](/r/area-series/#interpolation) curves the line, and a [style segment](/r/style-segments/#segmentation) recolours the fill and stroke wherever the value falls below zero.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'area-with-labels': {
        title: 'Area Chart With Labels Example - JavaScript | AG Charts',
        h1: 'Area Chart With Labels Example',
        description:
            'An area chart built with AG Charts showing a cumulative total over time, with a three-stop gradient fill and series labels shown only at chosen milestone points. Explore the live example.',
        intro: 'This example shows an [area chart](/r/area-series/) built with AG Charts, tracking a growing total over time. A [three-stop gradient fill](/r/fills/#gradients) fades the area from the axis upwards, and [series labels](/r/series-labels/#styling) are enabled with a formatter that [prints a value only at chosen milestone points](/r/series-labels/#hiding-labels) rather than at every one.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'stacked-area': {
        title: 'Stacked Area Chart Example - JavaScript Data Visualization | AG Charts',
        h1: 'Stacked Area Chart Example',
        description:
            'A stacked area chart built with AG Charts, accumulating several categories into a running total over time, with a cross line marking a range on the time axis. Explore the live example.',
        intro: 'This example shows a [stacked area chart](/r/area-series/#stacked-area-series) built with AG Charts, accumulating several categories so both each part and the overall total read off the same chart. A [range cross line](/r/axes-cross-lines/#adding-cross-lines) shades a period on the time axis, [smooth interpolation](/r/area-series/#interpolation) curves the boundaries, and the legend [drops the series stroke](/r/legend/#series-stroke) because the fills alone identify each series.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'area-with-markers': {
        title: 'Area Chart With Markers Example - JavaScript | AG Charts',
        h1: 'Area Chart With Markers Example',
        description:
            'An area chart built with AG Charts comparing two overlaid series across categories, with an item styler enlarging the markers on three chosen categories. Explore the live example.',
        intro: 'This example shows an [area chart](/r/area-series/) built with AG Charts, comparing two overlaid series across categories with [markers](/r/markers/) on each point. An [item styler](/r/stylers/#item-stylers) enlarges the markers for three chosen categories to draw the eye to them, [cross lines](/r/axes-cross-lines/#adding-cross-lines) annotate those categories with their change, and [band highlight](/r/axes-crosshairs/#band-highlight) shades the category under the pointer.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    '100--stacked-area': {
        title: '100% Stacked Area Chart Example - JavaScript | AG Charts',
        h1: '100% Stacked Area Chart Example',
        description:
            "A 100% stacked area chart built with AG Charts, showing how each category's share of the total shifts over time, with pattern fills separating two series. Explore the live example.",
        intro: 'This example shows a [100% stacked area chart](/r/area-series/#normalized-area-series) built with AG Charts, showing how the composition of a total shifts over time by normalising all seven series to 100% at every date. [Pattern fills](/r/fills/#patterns) set two series apart from the solid ones, [percentage axis labels](/r/axes-labels/#format) read as shares, and a [dashed crosshair](/r/axes-crosshairs/#styles) tracks the pointer along the time axis.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'area-with-negative-values': {
        title: 'Area Chart With Negative Values Example - JavaScript | AG Charts',
        h1: 'Area Chart With Negative Values Example',
        description:
            'An area chart built with AG Charts overlaying four series either side of zero, so positive and negative contributions are compared against a break-even line. Explore the live example.',
        intro: 'This example shows an [area chart](/r/area-series/) built with AG Charts, [overlaying four series](/r/area-series/#multiple-area-series) on a [grouped category axis](/r/axes-types/#grouped-category): two drawn upwards from zero and two downwards, so positive and negative contributions can be read against each other. [Cross lines](/r/axes-cross-lines/#adding-cross-lines) label each phase and mark the break-even point, and a [shared tooltip](/r/tooltips/#tooltip-modes) reads all four series at once.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },

    // ── Scatter ──────────────────────────────────────────────────────────
    'simple-scatter': {
        title: 'Scatter Chart Example - JavaScript Data Visualization | AG Charts',
        h1: 'Scatter Chart Example',
        description:
            'An interactive scatter chart built with AG Charts, revealing the correlation between two continuous variables, with mean reference cross lines on both axes. Explore the live example.',
        intro: 'This example shows a [scatter chart](/r/scatter-series/) built with AG Charts, plotting one point per record to reveal the correlation between two continuous variables. Mean-value [cross lines](/r/axes-cross-lines/#adding-cross-lines) divide each axis at its average, [property formatters](/r/formatters/#property-formatters) add units to the axis labels, and a [custom tooltip](/r/tooltips/#modifying-content) restates both values for the hovered point.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'multiple-scatter-series': {
        title: 'Scatter Chart with Multiple Series Example - JavaScript | AG Charts',
        h1: 'Scatter Chart with Multiple Series Example',
        description:
            'An interactive scatter chart built with AG Charts, comparing two variables across several groups, with star markers, selective labels and shaded cross line bands. Explore the live example.',
        intro: 'This example shows a [scatter chart](/r/scatter-series/) built with AG Charts, using one series per group so clusters can be compared within a single correlation. Star-shaped [markers](/r/scatter-series/#markers) and selective [labels](/r/scatter-series/#labels) call out individual points, shaded [cross lines](/r/axes-cross-lines/#adding-cross-lines) band the x-axis into low, middle and high ranges, and a [custom tooltip](/r/tooltips/#modifying-content) compares each point against its group average.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'scatter-with-large-data': {
        title: 'Scatter Chart With Large Data Example - JavaScript | AG Charts',
        h1: 'Scatter Chart With Large Data Example',
        description:
            'An interactive scatter chart built with AG Charts, spreading a large dataset across 24 series on a category axis, with labelled cross line bands. Explore the live example.',
        intro: 'This example shows a [scatter chart](/r/scatter-series/) built with AG Charts, spreading a [large dataset](/r/scatter-series/#large-datasets) across 24 series on a [category axis](/r/axes-types/#category), so a dense distribution stays readable column by column. Labelled [cross lines](/r/axes-cross-lines/#adding-cross-lines) mark a reference point and band the value axis into two named regions, and [fixed tick values](/r/axes-intervals/#values) keep the axis labels sparse.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'scatter-with-custom-markers': {
        title: 'Scatter Chart With Custom Markers Example - JavaScript | AG Charts',
        h1: 'Scatter Chart With Custom Markers Example',
        description:
            'An interactive scatter chart built with AG Charts, comparing two metrics recorded at different frequencies, with logo-shaped custom markers and a secondary axis. Explore the live example.',
        intro: 'This example shows a [scatter chart](/r/scatter-series/) built with AG Charts, comparing two metrics recorded at different frequencies and on different scales. [Custom marker shapes](/r/markers/#custom-marker-shapes) drawn from SVG paths identify each series without a legend lookup, one metric is scaled by a [secondary axis](/r/axes-secondary/#creating-a-secondary-axis), and points are placed against a [unit time axis](/r/axes-time/#unit-time) with [band highlight](/r/axes-crosshairs/#band-highlight) on hover.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'scatter-with-labels': {
        title: 'Scatter Chart With Labels Example - JavaScript | AG Charts',
        h1: 'Scatter Chart With Labels Example',
        description:
            'An interactive scatter chart built with AG Charts, comparing two series point by point with a label above every marker and crosshairs on both axes. Explore the live example.',
        intro: 'This example shows a [scatter chart](/r/scatter-series/) built with AG Charts, comparing two series where every point is worth naming, so each carries a [label](/r/series-labels/#placement) above its marker and one series is set apart by a square [marker shape](/r/scatter-series/#markers). [Crosshairs](/r/axes-crosshairs/#enabling-crosshairs) track both axes, [axis label formatters](/r/axes-labels/#formatter) name the extremes of each scale, and a [floating legend](/r/legend/#floating) sits inside the series area.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'scatter-with-multiple-axes': {
        title: 'Scatter Chart With Multiple Axes Example - JavaScript | AG Charts',
        h1: 'Scatter Chart With Multiple Axes Example',
        description:
            'An interactive scatter chart built with AG Charts, comparing two measures on separate value axes, with crosshairs on all three axes and a fixed axis range. Explore the live example.',
        intro: 'This example shows a [scatter chart](/r/scatter-series/) built with AG Charts, comparing two measures whose scales are too far apart to share one axis by scaling the second with a [secondary axis](/r/axes-secondary/#creating-a-secondary-axis). [Crosshairs](/r/axes-crosshairs/#enabling-crosshairs) on all three axes read values off each scale, [axis label formatters](/r/axes-labels/#formatter) give each its own units, and a [fixed axis domain](/r/axes-domain/) pins the x-axis to an exact range.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },

    // ── Bubble ───────────────────────────────────────────────────────────
    'bubble-with-negative-values': {
        title: 'Bubble Chart Example - JavaScript Data Visualization | AG Charts',
        h1: 'Bubble Chart Example',
        description:
            'An interactive bubble chart built with AG Charts, positioning points by two variables and sizing them by a third, with cross lines marking zero on both axes. Explore the live example.',
        intro: 'This example shows a [bubble chart](/r/bubble-series/) built with AG Charts, adding a third dimension to a scatter plot by [sizing each marker](/r/bubble-series/#size). Points sit either side of zero on both axes, with [cross lines](/r/axes-cross-lines/#adding-cross-lines) marking the origin and [property formatters](/r/formatters/#property-formatters) labelling the axes and the bubble size in their own units.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'multiple-bubble-series': {
        title: 'Multiple Bubble Series Chart Example - JavaScript | AG Charts',
        h1: 'Multiple Bubble Series Chart Example',
        description:
            'An interactive bubble chart built with AG Charts, comparing two groups across three variables at once, with a shared tooltip, selective labels and reference cross lines. Explore the live example.',
        intro: 'This example shows a [bubble chart](/r/bubble-series/) built with AG Charts, comparing two groups across three variables at once: two axis positions and a [bubble size](/r/bubble-series/#size). A [shared tooltip](/r/tooltips/#tooltip-modes) merges both series at a given x-value, [labels](/r/bubble-series/#labels) are formatted onto the notable bubbles only, and [cross lines](/r/axes-cross-lines/#adding-cross-lines) mark an average and a threshold.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'bubble-with-categories': {
        title: 'Bubble Chart With Categories Example - JavaScript | AG Charts',
        h1: 'Bubble Chart With Categories Example',
        description:
            'An interactive bubble chart built with AG Charts, using category axes on both x and y so bubble size alone encodes the value at each intersection. Explore the live example.',
        intro: 'This example shows a [bubble chart](/r/bubble-series/) built with AG Charts, using a [category axis](/r/axes-types/#category) on both x and y so position is entirely categorical and [bubble size](/r/bubble-series/#size) alone encodes the value at each intersection: a grid of magnitudes rather than a correlation. Both [axis lines are hidden](/r/axes-configuration/) to leave the grid uncluttered.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'bubble-with-images': {
        title: 'Bubble Chart With Images Example - JavaScript | AG Charts',
        h1: 'Bubble Chart With Images Example',
        description:
            'An interactive bubble chart built with AG Charts, filling each bubble with its own image through an item styler, with labels and custom axis notation. Explore the live example.',
        intro: 'This example shows a [bubble chart](/r/bubble-series/) built with AG Charts, where each bubble is filled with its own picture: an [item styler](/r/stylers/#item-stylers) returns a per-datum [image fill](/r/fills/#images), so the mark itself identifies the record. [Labels](/r/bubble-series/#labels) name each bubble, [bubble size](/r/bubble-series/#size) carries a third variable, and [property formatters](/r/formatters/#property-formatters) print the axes in custom notation.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'bubble-with-patterns': {
        title: 'Bubble Chart With Patterns Example - JavaScript | AG Charts',
        h1: 'Bubble Chart With Patterns Example',
        description:
            'An interactive bubble chart built with AG Charts, giving each of five series a distinct stock pattern fill so they stay distinguishable without a legend lookup. Explore the live example.',
        intro: 'This example shows a [bubble chart](/r/bubble-series/) built with AG Charts, distinguishing five series by texture rather than colour alone: each takes a different [pattern fill](/r/fills/#patterns) from the stock set, which keeps the series separable in print and for colour-blind readers. Position carries two variables and [bubble size](/r/bubble-series/#size) a third.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'bubble-with-custom-svg-patterns': {
        title: 'Bubble Chart With Custom SVG Patterns Example | AG Charts',
        h1: 'Bubble Chart With Custom SVG Patterns Example',
        description:
            'An interactive bubble chart built with AG Charts, filling bubbles with a pattern built from a custom SVG path rather than one of the predefined shapes. Explore the live example.',
        intro: 'This example shows a [bubble chart](/r/bubble-series/) built with AG Charts, filling its bubbles with a [pattern fill](/r/fills/#patterns) built from a [custom SVG path](/r/fills/#path) rather than one of the predefined shapes, so the texture itself carries meaning. Position maps two variables, [bubble size](/r/bubble-series/#size) a third, and a [fixed tick step](/r/axes-intervals/#step) keeps both axes evenly divided.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'bubble-with-custom-markers': {
        title: 'Bubble Chart With Custom Markers Example - JavaScript | AG Charts',
        h1: 'Bubble Chart With Custom Markers Example',
        description:
            'An interactive bubble chart built with AG Charts, drawing every bubble as a custom marker shape, with shaded cross line bands and a custom crosshair label. Explore the live example.',
        intro: 'This example shows a [bubble chart](/r/bubble-series/) built with AG Charts, drawing every bubble as a [custom marker shape](/r/markers/#custom-marker-shapes) defined by a path function, so the mark suits the quantity it represents, with [bubble size](/r/bubble-series/#size) carrying a third variable. Shaded [cross lines](/r/axes-cross-lines/#adding-cross-lines) band the x-axis, an [axis label formatter](/r/axes-labels/#formatter) names each band, and a [custom crosshair label](/r/axes-crosshairs/#custom-label-renderer) renders the y-value.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'bubble-with-labels': {
        title: 'Bubble Chart With Labels Example - JavaScript | AG Charts',
        h1: 'Bubble Chart With Labels Example',
        description:
            'An interactive bubble chart built with AG Charts, sharing one size domain across every series so bubbles stay comparable between groups, with a label on each. Explore the live example.',
        intro: 'This example shows a [bubble chart](/r/bubble-series/) built with AG Charts, comparing groups where the [bubble size](/r/bubble-series/#size) must mean the same thing in each: a shared size domain fixes one scale across every series, so areas are comparable between groups rather than only within one. Each bubble carries a formatted [label](/r/bubble-series/#labels) and the [legend](/r/legend/#placement) sits above the chart.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },

    // ── Pie ──────────────────────────────────────────────────────────────
    'simple-pie': {
        title: 'Pie Chart Example - JavaScript Data Visualization | AG Charts',
        h1: 'Pie Chart Example',
        description:
            'An interactive pie chart built with AG Charts, breaking a total into proportional slices, with callout labels, sector labels and spacing between the slices. Explore the live example.',
        intro: 'This example shows a [pie chart](/r/pie-series/) built with AG Charts, breaking a single total into proportional slices so each part reads as a share of the whole. [Callout and sector labels](/r/pie-series/#labels) name and quantify the slices, with formatters hiding both on slices too small to label, sector spacing separating the slices, and a [tooltip renderer](/r/tooltips/#modifying-content) reporting each value with its share.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'pie-with-variable-radius': {
        title: 'Pie Chart With Variable Radius Example - JavaScript | AG Charts',
        h1: 'Pie Chart With Variable Radius Example',
        description:
            'A pie chart built with AG Charts encoding two measures per sector, one as the slice angle and a second as a variable sector radius. Explore the live example and copy the code.',
        intro: 'This example shows a [pie chart](/r/pie-series/) built with AG Charts, encoding two measures per sector instead of one: the slice angle carries a part-to-whole share while a [variable sector radius](/r/pie-series/#variable-sector-radius) carries a second, independent measure. [Sector labels](/r/pie-series/#labels) and a [custom tooltip](/r/tooltips/#modifying-content) report both.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'pie-in-a-donut': {
        title: 'Pie Chart In A Donut Example - JavaScript | AG Charts',
        h1: 'Pie Chart In A Donut Example',
        description:
            'A pie chart nested inside a donut chart with AG Charts, comparing two part-to-whole breakdowns as concentric rings with one shared legend. Explore the live example.',
        intro: 'This example shows a [pie chart](/r/pie-series/) nested inside a [donut chart](/r/donut-series/) with AG Charts, comparing two part-to-whole breakdowns of the same categories as concentric rings, so a shift in composition reads as a change between rings. It uses the [nested-series technique](/r/donut-series/#multiple-donuts) with [sector labels](/r/donut-series/#labels) and a [comparison tooltip](/r/tooltips/#modifying-content).  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },

    // ── Donut ────────────────────────────────────────────────────────────
    'simple-donut': {
        title: 'Donut Chart Example - JavaScript Data Visualization | AG Charts',
        h1: 'Donut Chart Example',
        description:
            'An interactive donut chart built with AG Charts, breaking a total into slices around an open centre that carries the overall total as an inner label. Explore the live example.',
        intro: "This example shows a [donut chart](/r/donut-series/) built with AG Charts, breaking a total into proportional slices around an open centre, which is used to state the overall total with [inner labels](/r/donut-series/#inner-labels) so the parts and the whole read together. [Callout and sector labels](/r/donut-series/#labels) name the slices, a [theme override](/r/themes/) sets the ring's thickness and spacing, and a [custom tooltip](/r/tooltips/#modifying-content) adds each slice's rank.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).",
    },
    'donut-with-variable-radius': {
        title: 'Donut Chart With Variable Radius Example - JavaScript | AG Charts',
        h1: 'Donut Chart With Variable Radius Example',
        description:
            'A donut chart built with AG Charts encoding two measures per sector, one as the slice angle and a second as a variable sector radius, with rounded corners. Explore the live example.',
        intro: 'This example shows a [donut chart](/r/donut-series/) built with AG Charts, encoding two measures per sector: the slice angle carries a part-to-whole share while a [variable sector radius](/r/pie-series/#variable-sector-radius) carries a second measure, so an outlier on either reads at a glance. An [inner label](/r/donut-series/#inner-labels) states the total, a corner radius rounds each sector, and a [detailed tooltip](/r/tooltips/#modifying-content) reports both values.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'multiple-donuts': {
        title: 'Multiple Donut Charts Example - JavaScript | AG Charts',
        h1: 'Multiple Donut Charts Example',
        description:
            "Two donut series nested as concentric rings with AG Charts, comparing a hierarchy's parts against its totals in a single part-to-whole chart. Explore the live example.",
        intro: "This example shows a [donut chart](/r/donut-series/) built with AG Charts, nesting [multiple donut series](/r/donut-series/#multiple-donuts) as concentric rings so each part sits inside the total it belongs to. An outer radius ratio and inner radius ratio size the two rings, corner radius rounds the sectors, a [global formatter](/r/formatters/#global-formatter) adds units to every value, and [tooltips](/r/tooltips/#modifying-content) report each slice's share.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).",
    },

    // ── Map ──────────────────────────────────────────────────────────────
    'multiple-map-shape-series': {
        title: 'Map Chart With Multiple Shape Series Example | AG Charts',
        h1: 'Map Chart With Multiple Shape Series Example',
        description:
            'An interactive world map chart built with AG Charts, drawing one map shape series per region over a shape background, with labels, a legend and zoom. Explore the live example.',
        intro: 'This example shows a [map chart](/r/maps/) built with AG Charts, grouping geographic areas by drawing a separate [map shape series](/r/map-shapes/) per region over a [map shape background](/r/map-shapes/#background-shapes), so each group takes its own colour and legend entry. [Shape labels](/r/map-shapes/#labels) mark each area, [zoom](/r/zoom/) explores the detail, and a [tooltip renderer](/r/tooltips/#modifying-content) reports two measures per area.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'multiple-map-series': {
        title: 'Multiple Map Chart Series Example - JavaScript | AG Charts',
        h1: 'Multiple Map Chart Series Example',
        description:
            'An interactive map chart built with AG Charts, combining map marker and map line series to show a value at each place and the routes connecting them. Explore the live example.',
        intro: 'This example shows a [map chart](/r/maps/) built with AG Charts, combining points and connections on one map: a [map marker series](/r/map-markers/#proportional-marker-size) sized by a value at each place, and two [map line series](/r/map-lines/#proportional-line-width) whose stroke width scales with a second measure over a shared size domain, one dashed to separate the two route types. [Tooltips anchor to the pointer](/r/tooltips/#anchor-point) with fallback [placement](/r/tooltips/#placement).  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'map-heatmap-series': {
        title: 'Map Chart with Heatmap Example - JavaScript | AG Charts',
        h1: 'Map Chart with Heatmap Example',
        description:
            'A map chart built with AG Charts shading each region by value on a colour scale, with a gradient legend and source-aware value formatting. Explore the live example.',
        intro: 'This example shows a [map chart](/r/maps/) built with AG Charts, comparing a measure across regions by shading each area rather than placing marks on it: a color key drives the [colour scale](/r/map-shapes/#colour-scale) so magnitude reads straight off the fill. A [gradient legend](/r/colour-scale/#gradient-legend) gives the scale, [shape labels](/r/map-shapes/#labels) identify the regions, and a [property formatter](/r/formatters/#property-formatters) abbreviates the values differently in the tooltip and the legend.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'map-shapes-lines': {
        title: 'Map Chart With Shapes and Lines Example - JavaScript | AG Charts',
        h1: 'Map Chart With Shapes and Lines Example',
        description:
            'A map chart built with AG Charts layering shape series for area boundaries under one map line series per route, sized by volume, with a floating legend. Explore the live example.',
        intro: 'This example shows a [map chart](/r/maps/) built with AG Charts, tracing a network over its geography: two [map shape series](/r/map-shapes/) supply the area boundaries beneath one [map line series](/r/map-lines/#proportional-line-width) per route, each varying stroke width with volume along the route. A [floating legend](/r/legend/#floating) lists the routes and a [legend event](/r/legend/#legend-events) listener stops a double-click from isolating one.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'map-lines-markers': {
        title: 'Map Chart with Lines and Markers Example - JavaScript | AG Charts',
        h1: 'Map Chart with Lines and Markers Example',
        description:
            'A map chart built with AG Charts layering background shapes and lines beneath a foreground route series and pin markers, with a floating legend. Explore the live example.',
        intro: 'This example shows a [map chart](/r/maps/) built with AG Charts, separating context from subject in layers: [background map shapes](/r/map-shapes/#background-shapes) and [background map lines](/r/map-lines/#background-lines) sit beneath a foreground [map line series](/r/map-lines/) for the routes of interest and a [map marker series](/r/map-markers/#customisation) of pins for points on them, with a [floating legend](/r/legend/#floating) naming both.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'map-kitchen-sink': {
        title: 'Map Chart Kitchen Sink Example - JavaScript | AG Charts',
        h1: 'Map Chart Kitchen Sink Example',
        description:
            'A world map chart built with AG Charts combining shape, line and marker series so regions, routes and points of interest share one map, with zoom and a legend. Explore the live example.',
        intro: 'This example shows a [map chart](/r/maps/) built with AG Charts, putting every map series type on one map: [map shape series](/r/map-shapes/) colour regions by category and share a single legend entry, a dashed [map line series](/r/map-lines/) traces routes, and two [map marker series](/r/map-markers/) mark points of interest, one placed from the topology and one from [latitude and longitude](/r/map-markers/#map-marker-position-from-data) in the data. [Zoom](/r/zoom/) explores the detail.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },

    // ── Org Chart ────────────────────────────────────────────────────────
    'simple-org-chart-with-images': {
        title: 'Org Chart With Images Example - JavaScript | AG Charts',
        h1: 'Org Chart With Images Example',
        description:
            'An interactive org chart built with AG Charts, showing a reporting hierarchy as cards carrying an avatar image and a status pill, with branches collapsed by default. Explore the live example.',
        intro: "This example shows an [org chart](/r/org-chart/) built with AG Charts, laying out a reporting hierarchy as connected cards. Each card carries an [avatar image](/r/org-chart/#image) and a status [label](/r/org-chart/#text) styled as a coloured pill by an [item styler](/r/stylers/#item-stylers), branches start [collapsed](/r/org-chart/#collapse-and-expand) from the chart's initial state, and each [expander](/r/org-chart/#expander) reports its direct and total child counts.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).",
    },
    'simple-org-chart-with-categories': {
        title: 'Org Chart With Categories Example - JavaScript | AG Charts',
        h1: 'Org Chart With Categories Example',
        description:
            'An org chart built with AG Charts, laid out horizontally with nodes, connectors and expanders all coloured by category, and dashed styling marking a subset. Explore the live example.',
        intro: 'This example shows an [org chart](/r/org-chart/) built with AG Charts, laid out [horizontally](/r/org-chart/#direction) so a wide hierarchy reads left to right. [Item stylers](/r/stylers/#item-stylers) colour the [node fills](/r/org-chart/#node-styling), [connectors](/r/org-chart/#connectors) and [expanders](/r/org-chart/#customisation) by category, fade the fill by depth, and switch to a dashed line for a marked subset, while click-to-expand and highlighting are both turned off.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'org-chart-with-many-nodes': {
        title: 'Org Chart With Many Nodes Example - JavaScript | AG Charts',
        h1: 'Org Chart With Many Nodes Example',
        description:
            'A large org chart built with AG Charts that switches to a stacked layout below a set depth, keeping a deep hierarchy readable, with zoom buttons and child counts. Explore the live example.',
        intro: 'This example shows an [org chart](/r/org-chart/) built with AG Charts, keeping a hierarchy readable once it grows too large for a single row of cards: below a set depth the chart switches to a [stacked layout](/r/org-chart/#stacked-layout) instead of spreading wider. Each [expander](/r/org-chart/#expander) reports its direct and total child counts, [zoom buttons](/r/zoom/#buttons) appear once zoomed, and a [context menu](/r/context-menu/) is available on right-click.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },

    // ── Quadrant ─────────────────────────────────────────────────────────
    'quadrant-chart': {
        title: 'Quadrant Chart Example - JavaScript Data Visualization | AG Charts',
        h1: 'Quadrant Chart Example',
        description:
            'An interactive quadrant chart built with AG Charts, sorting points into four labelled regions around an off-centre pivot, with a tooltip tailored to each region. Explore the live example.',
        intro: "This example shows a [quadrant chart](/r/quadrant-chart/) built with AG Charts, scoring items on two dimensions and sorting them into four regions, so the region a point lands in is the finding. An off-centre [pivot](/r/quadrant-chart/#pivot) sets the dividing lines where the thresholds actually fall, the [axes stay at the edge](/r/quadrant-chart/#axes) rather than crossing at the pivot, each [region carries its own label](/r/quadrant-chart/#labels), and a [tooltip renderer](/r/quadrant-chart/#customisation) reports a point's region.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).",
    },
    'quadrant-chart-with-size': {
        title: 'Quadrant Chart With Varying Size Example | AG Charts',
        h1: 'Quadrant Chart With Varying Size Example',
        description:
            'A quadrant chart built with AG Charts adding a third measure as marker size, with per-region fills and labels and the axis labels moved to the pivot. Explore the live example.',
        intro: 'This example shows a [quadrant chart](/r/quadrant-chart/) built with AG Charts, adding a third measure to the two that place each point by scaling [marker size](/r/quadrant-chart/#marker-size) between a minimum and maximum, so weight is read alongside position. Square markers and per-region [fills and labels](/r/quadrant-chart/#customisation) separate the four regions, and the [axis labels move to the pivot](/r/quadrant-chart/#axes) rather than staying at the edge.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'quadrant-chart-with-large-data': {
        title: 'Quadrant Chart With Large Data Example | AG Charts',
        h1: 'Quadrant Chart With Large Data Example',
        description:
            'A quadrant chart built with AG Charts sorting 1,000 points into four regions, using translucent fixed-size markers and highlighting to keep a dense chart readable. Explore the live example.',
        intro: 'This example shows a [quadrant chart](/r/quadrant-chart/) built with AG Charts, sorting 1,000 points into four regions, where the density of each region carries the finding rather than any individual point. Translucent fixed-size markers are styled per [region](/r/quadrant-chart/#customisation) with the labels placed [inside each one](/r/quadrant-chart/#labels), and [series highlighting](/r/series-highlighting/#customisation) fades every marker but the one under the pointer.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },

    // ── Histogram ────────────────────────────────────────────────────────
    'simple-histogram': {
        title: 'Histogram Chart Example - JavaScript Data Visualization | AG Charts',
        h1: 'Histogram Chart Example',
        description:
            'An interactive histogram chart built with AG Charts, grouping continuous values into automatic bins to show a distribution, with a mean cross line. Explore the live example.',
        intro: "This example shows a [histogram chart](/r/histogram-series/) built with AG Charts, revealing the shape of a distribution by grouping continuous values into automatically sized bins and plotting how many fall in each. A mean [cross line](/r/axes-cross-lines/#adding-cross-lines) marks the average against that shape, and a [tooltip](/r/tooltips/#modifying-content) reports each bin's range and count.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).",
    },
    'histogram-with-specified-bins': {
        title: 'Histogram Chart With Specified Bins Example | AG Charts',
        h1: 'Histogram Chart With Specified Bins Example',
        description:
            'A histogram chart built with AG Charts replacing automatic binning with explicit boundaries, giving one series per band so each can be named and styled. Explore the live example.',
        intro: 'This example shows a [histogram chart](/r/histogram-series/) built with AG Charts, replacing automatic binning with [explicit bin boundaries](/r/histogram-series/#bin-customisation) so each band matches a meaningful cut-off rather than an even division. One series covers each band, which lets every band be named in the legend and styled in its own right, with [area plot](/r/histogram-series/#reference-AgHistogramSeriesOptions-areaPlot) showing frequency density across unevenly sized bands, [pattern fills](/r/fills/#patterns) on some series and a [floating legend](/r/legend/#floating).  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'histogram-with-missing-bins': {
        title: 'Histogram Chart With Missing Bins Example | AG Charts',
        h1: 'Histogram Chart With Missing Bins Example',
        description:
            'A histogram chart built with AG Charts averaging a second measure within each bin, leaving bins with no data empty, with a reversed axis and labelled bars. Explore the live example.',
        intro: "This example shows a [histogram chart](/r/histogram-series/) built with AG Charts, asking not how many records fall in each bin but what a second measure averages within it, using [mean aggregation](/r/histogram-series/#aggregation) so bins with no data are simply left empty. The value axis is [reversed](/r/axes-domain/#reversed-domain) so a lower average reads as better, [labels](/r/series-labels/#styling) print each bar's value, and [cross lines](/r/axes-cross-lines/#adding-cross-lines) mark a threshold and a typical range.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).",
    },

    // ── Range Bar ────────────────────────────────────────────────────────
    'simple-range-bar': {
        title: 'Range Bar Chart Example - JavaScript Data Visualization | AG Charts',
        h1: 'Range Bar Chart Example',
        description:
            'An interactive range bar chart built with AG Charts, drawing a low-to-high span per category so spread is read directly, with an average cross line. Explore the live example.',
        intro: 'This example shows a [range bar chart](/r/range-bar-series/) built with AG Charts, drawing each category as a bar from its low to its high value, so spread is read directly instead of being inferred from a single point. Bars take a [corner radius](/r/range-bar-series/#corner-radius), an [ordinal time axis](/r/axes-time/#ordinal-time) leaves no gaps for absent dates, a [cross line](/r/axes-cross-lines/#adding-cross-lines) marks the average, and [band highlight](/r/axes-crosshairs/#band-highlight) shades the hovered category.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'range-bar-with-labels': {
        title: 'Range Bar Chart With Labels Example - JavaScript | AG Charts',
        h1: 'Range Bar Chart With Labels Example',
        description:
            'An interactive range bar chart built with AG Charts, printing both bounds outside each bar and scaling bar opacity to how wide the range is. Explore the live example.',
        intro: "This example shows a [range bar chart](/r/range-bar-series/) built with AG Charts, printing both bounds as [labels](/r/range-bar-series/#labels) [outside](/r/series-labels/#placement) each bar so the span reads without a tooltip. An [item styler](/r/stylers/#item-stylers) scales each bar's opacity to how wide its range is against the average, a [crosshair](/r/axes-crosshairs/#enabling-crosshairs) tracks the value axis, and a [cross line](/r/axes-cross-lines/#adding-cross-lines) marks the average in matching format.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).",
    },
    'multiple-range-bars': {
        title: 'Range Bar Chart with Multiple Series Example | AG Charts',
        h1: 'Range Bar Chart with Multiple Series Example',
        description:
            'An interactive range bar chart built with AG Charts, comparing low-to-high spans across several groups, with a shared tooltip and labelled threshold cross lines. Explore the live example.',
        intro: 'This example shows a [range bar chart](/r/range-bar-series/) built with AG Charts, using [multiple range bar series](/r/range-bar-series/#multiple-range-bar-series) so a low-to-high span can be compared group by group within each category. [Series highlighting](/r/series-highlighting/#customisation) fades the other groups on hover, a [shared tooltip](/r/tooltips/#tooltip-modes) reads every group at one category, and labelled [cross lines](/r/axes-cross-lines/#adding-cross-lines) mark two thresholds and a target band.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'horizontal-range-bar': {
        title: 'Horizontal Range Bar Chart Example - JavaScript | AG Charts',
        h1: 'Horizontal Range Bar Chart Example',
        description:
            'An interactive horizontal range bar chart built with AG Charts, pairing two bars per category and grouping each pair with a labelled range cross line. Explore the live example.',
        intro: 'This example shows a [horizontal range bar chart](/r/range-bar-series/#horizontal-range-bar) built with AG Charts, comparing two low-to-high spans per category so a shift between them reads as a change in both position and width. An [item styler](/r/stylers/#item-stylers) separates the pair by opacity, the category [axis labels are switched off](/r/axes-labels/#customisation) in favour of [range cross lines](/r/axes-cross-lines/#adding-cross-lines) that group and name each pair, and the value axis sits along the top.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'horizontal-range-bar-with-labels': {
        title: 'Horizontal Range Bar Chart With Labels Example | AG Charts',
        h1: 'Horizontal Range Bar Chart With Labels Example',
        description:
            'An interactive horizontal range bar chart built with AG Charts, colouring each bar by the direction of change and labelling only the significant swings. Explore the live example.',
        intro: 'This example shows a [horizontal range bar chart](/r/range-bar-series/#horizontal-range-bar) built with AG Charts, reading each bar as a change between two values rather than a static range. An [item styler](/r/stylers/#item-stylers) colours a bar by the direction of that change, a [label formatter](/r/series-labels/#styling) prints an arrow only where the swing is large enough to matter, and the value axis uses a fixed [step interval](/r/axes-intervals/#step) with a [cross line](/r/axes-cross-lines/#adding-cross-lines) marking the prior average.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'multiple-horizontal-range-bars': {
        title: 'Horizontal Range Bar Charts with Multiple Series Example | AG Charts',
        h1: 'Horizontal Range Bar Charts with Multiple Series Example',
        description:
            'An interactive horizontal range bar chart built with AG Charts, comparing low-to-high spans across several groups per category, with fixed axis tick values. Explore the live example.',
        intro: 'This example shows a [horizontal range bar chart](/r/range-bar-series/#horizontal-range-bar) built with AG Charts, using [multiple range bar series](/r/range-bar-series/#multiple-range-bar-series) so each category carries one span per group, laid out horizontally for long category names. The category axis sits on the right with [band highlight](/r/axes-crosshairs/#band-highlight) on hover, and the value axis marks ticks at two fixed [values](/r/axes-intervals/#values) rather than an even step.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },

    // ── Range Area ───────────────────────────────────────────────────────
    'simple-range-area': {
        title: 'Range Area Chart Example - JavaScript Data Visualization | AG Charts',
        h1: 'Range Area Chart Example',
        description:
            'An interactive range area chart built with AG Charts, shading the band between a low and a high value over time so the range itself is the shape read. Explore the live example.',
        intro: 'This example shows a [range area chart](/r/range-area-series/) built with AG Charts, shading the band between a low and a high value at each date so the width of the range, not a single line, is what the reader follows. Smooth [interpolation and markers](/r/range-area-series/#customisation) shape the band, the value axis is [pinned to a fixed domain](/r/axes-domain/#domain-min--max) for a stable scale, a [compact tooltip](/r/tooltips/#tooltip-modes) reads both bounds, and [cross lines](/r/axes-cross-lines/#adding-cross-lines) mark two notable dates.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'range-area-difference-inverted-style': {
        title: 'Range Area Difference Chart With Inverted Style Example | AG Charts',
        h1: 'Range Area Difference Chart With Inverted Style Example',
        description:
            'An interactive range area chart built with AG Charts used as a difference chart, flipping the fill style at the point where one series overtakes the other. Explore the live example.',
        intro: 'This example shows a [range area chart](/r/range-area-series/) built with AG Charts used as a difference chart: the band is the gap between two series, and an [inverted style](/r/range-area-series/#inverted-style) changes the fill at the crossover point, so which series leads is visible without reading the legend. [High and low styling](/r/range-area-series/#high-and-low-styling) dashes the upper bound and enlarges the lower markers, and a [custom tooltip](/r/tooltips/#modifying-content) reports the gap and which side is ahead.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'range-area-with-labels': {
        title: 'Range Area Chart With Labels Example - JavaScript | AG Charts',
        h1: 'Range Area Chart With Labels Example',
        description:
            'An interactive range area chart built with AG Charts, overlaying two bands over time with labels printed only at selected points. Explore the live example and copy the code.',
        intro: "This example shows a [range area chart](/r/range-area-series/) built with AG Charts, [overlaying two bands](/r/range-area-series/#multiple-range-area-series) over time so two gaps can be compared against each other rather than one in isolation. A [label formatter](/r/series-labels/#styling) prints a value only at selected points to keep the bands legible, a [theme override](/r/themes/) enables those labels for every range area series, and a [custom tooltip](/r/tooltips/#modifying-content) reports each band's spread.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).",
    },

    // ── Waterfall ────────────────────────────────────────────────────────
    'simple-waterfall': {
        title: 'Waterfall Chart Example - JavaScript Data Visualization | AG Charts',
        h1: 'Waterfall Chart Example',
        description:
            'An interactive waterfall chart built with AG Charts, showing how a sequence of gains and losses accumulates into a running total, with connector lines. Explore the live example.',
        intro: 'This example shows a [waterfall chart](/r/waterfall-series/) built with AG Charts, breaking a net change into the steps that produced it so each gain and loss is attributed rather than summarised. Positive and negative [series items](/r/waterfall-series/#series-items) are named and styled separately, an [item styler](/r/stylers/#item-stylers) scales opacity to the size of each step, [connector lines](/r/waterfall-series/#connector-lines) link the bars, and a [floating legend](/r/legend/#floating) sits inside the series area.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'horizontal-waterfall': {
        title: 'Horizontal Waterfall Chart Example - JavaScript | AG Charts',
        h1: 'Horizontal Waterfall Chart Example',
        description:
            'An interactive horizontal waterfall chart built with AG Charts, accumulating steps into a total and a subtotal bar, with the connector lines switched off. Explore the live example.',
        intro: 'This example shows a [horizontal waterfall chart](/r/waterfall-series/#horizontal-waterfall) built with AG Charts, running the sequence down the chart so long step names stay readable. [Total and subtotal values](/r/waterfall-series/#total--subtotal-values) interrupt the run with a bar measured from zero, their labels sit [inside the bar](/r/series-labels/#placement), the [connector lines](/r/waterfall-series/#connector-lines) are switched off, and a [tooltip renderer](/r/tooltips/#modifying-content) distinguishes a step from a total.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'customised-waterfall': {
        title: 'Customised Waterfall Chart Example - JavaScript | AG Charts',
        h1: 'Customised Waterfall Chart Example',
        description:
            'An interactive waterfall chart built with AG Charts accumulating signed percentage changes into a closing total, with cross lines banding the value axis. Explore the live example.',
        intro: 'This example shows a [waterfall chart](/r/waterfall-series/) built with AG Charts, accumulating a run of signed percentage changes into a closing [total value](/r/waterfall-series/#total--subtotal-values). Gain, loss and total [series items](/r/waterfall-series/#series-items) are each named and styled in their own right, [cross lines](/r/axes-cross-lines/#adding-cross-lines) mark break-even and shade an acceptable band either side of it, and [format strings](/r/formatters/#format-strings) render every value as a signed percentage.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },

    // ── Box Plot ─────────────────────────────────────────────────────────
    'simple-box-plot': {
        title: 'Box Plot Chart Example - JavaScript Data Visualization | AG Charts',
        h1: 'Box Plot Chart Example',
        description:
            "An interactive box plot chart built with AG Charts, summarising each category's distribution as a median, quartiles and whiskers rather than one average. Explore the live example.",
        intro: "This example shows a [box plot chart](/r/box-plot-series/) built with AG Charts, summarising each category's whole distribution as a median, two quartiles and whiskers to the extremes, so spread and skew survive where an average would hide them. [Whisker and cap](/r/box-plot-series/#customisation) styling and a corner radius shape the boxes, a [custom tooltip](/r/tooltips/#modifying-content) adds the interquartile range, and [band highlight](/r/axes-crosshairs/#band-highlight) shades the hovered category.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).",
    },
    'multiple-box-plots': {
        title: 'Box Plot Chart with Multiple Series Example | AG Charts',
        h1: 'Box Plot Chart with Multiple Series Example',
        description:
            'An interactive box plot chart built with AG Charts, placing two distributions side by side per category so their medians and spreads compare directly. Explore the live example.',
        intro: "This example shows a [box plot chart](/r/box-plot-series/) built with AG Charts, pairing two series per category so two distributions are compared on the same scale: medians, quartiles and whiskers line up side by side. Both series share the same [cap](/r/box-plot-series/#customisation) styling and a [custom tooltip](/r/tooltips/#modifying-content), the category axis is padded to separate the pairs, and the tooltip's [placement](/r/tooltips/#placement) falls back through several positions to stay on screen.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).",
    },
    'horizontal-box-plot': {
        title: 'Horizontal Box Plot Chart Example - JavaScript | AG Charts',
        h1: 'Horizontal Box Plot Chart Example',
        description:
            'An interactive horizontal box plot chart built with AG Charts, comparing distributions by category against a computed median line and shaded value bands. Explore the live example.',
        intro: "This example shows a [horizontal box plot chart](/r/box-plot-series/#horizontal-box-plot) built with AG Charts, running the boxes across the chart so each category's median, quartiles and whiskers sit beside a readable name. [Whisker and cap](/r/box-plot-series/#customisation) styling shapes the boxes, [cross lines](/r/axes-cross-lines/#adding-cross-lines) mark the median computed across every category and shade a low and a high band, and the category axis takes a fixed thickness.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).",
    },

    // ── Candlestick ──────────────────────────────────────────────────────
    candlestick: {
        title: 'Candlestick Chart Example - JavaScript Data Visualization | AG Charts',
        h1: 'Candlestick Chart Example',
        description:
            'An interactive candlestick chart built with AG Charts, showing open, high, low and close per period with two moving-average lines overlaid. Explore the live example.',
        intro: 'This example shows a [candlestick chart](/r/candlestick-series/) built with AG Charts, encoding four values per period as one mark, so direction and trading range read together. Rising and falling [series items](/r/candlestick-series/#customisation) are styled separately, two [line series](/r/line-series/) overlay moving averages, the [tooltip range](/r/tooltips/#tooltip-range) snaps to the nearest bar behind a [custom tooltip](/r/tooltips/#modifying-content), and an [ordinal time axis](/r/axes-time/#ordinal-time) leaves no gap for non-trading days.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'candlestick-hollow': {
        title: 'Hollow Candlestick Chart Example - JavaScript | AG Charts',
        h1: 'Hollow Candlestick Chart Example',
        description:
            'An interactive hollow candlestick chart built with AG Charts, outlining rising periods instead of filling them, with zoom across a long price history. Explore the live example.',
        intro: 'This example shows a [candlestick chart](/r/candlestick-series/) built with AG Charts in its hollow form: [series items](/r/candlestick-series/#customisation) for rising periods are outlined rather than filled, which keeps a long run of dense marks legible while still showing direction. [Zoom](/r/zoom/) scrolls and pans the full history, [crosshairs](/r/axes-crosshairs/#enabling-crosshairs) read both axes, an [ordinal time axis](/r/axes-time/#ordinal-time) skips non-trading days, and [cross lines](/r/axes-cross-lines/#adding-cross-lines) mark two price levels.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },

    // ── OHLC ─────────────────────────────────────────────────────────────
    ohlc: {
        title: 'OHLC Chart Example - JavaScript Data Visualization | AG Charts',
        h1: 'OHLC Chart Example',
        description:
            'An interactive OHLC chart built with AG Charts, showing open, high, low and close as a bar with side ticks, with grouped date labels and an average cross line. Explore the live example.',
        intro: "This example shows an [OHLC chart](/r/ohlc-series/) built with AG Charts, encoding four values per period as a vertical bar with an opening and closing tick: the same information a candlestick carries, drawn more thinly for dense series. An [ordinal time axis](/r/axes-time/#ordinal-time) with [parent levels](/r/axes-time/#parent-levels) groups the date labels, a [custom tooltip](/r/tooltips/#modifying-content) reports the period's change, and a [cross line](/r/axes-cross-lines/#adding-cross-lines) marks the average close.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).",
    },

    // ── Radar Line ───────────────────────────────────────────────────────
    'simple-radar-line': {
        title: 'Radar Line Chart Example - JavaScript Data Visualization | AG Charts',
        h1: 'Radar Line Chart Example',
        description:
            'An interactive radar line chart built with AG Charts, comparing several profiles across shared metrics as closed outlines on one angle axis. Explore the live example.',
        intro: 'This example shows a [radar line chart](/r/radar-line-series/) built with AG Charts, comparing profiles across a shared set of metrics: each series closes into an outline whose shape, not its height, is what the reader compares. One series is drawn solid and the others dashed, the radius axis labels are hidden so the outlines dominate, a [property formatter](/r/formatters/#property-formatters) renders every value as a percentage, and a [floating legend](/r/legend/#floating) sits inside the series area.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'radar-with-markers': {
        title: 'Radar Chart With Markers Example - JavaScript | AG Charts',
        h1: 'Radar Chart With Markers Example',
        description:
            'A radar chart built with AG Charts drawing markers only, with no connecting outline, so each series reads as a scatter of points around a circular axis. Explore the live example.',
        intro: 'This example shows a [radar line chart](/r/radar-line-series/) built with AG Charts with its connecting line removed, so each series reads as a scatter of [markers](/r/markers/#marker-shape-size-and-colour) around a circular axis rather than a closed shape. The radius axis takes the [circle axis shape](/r/radar-line-series/#axis-shape) with its gridlines and labels hidden, and [polar cross lines](/r/axes-cross-lines/#polar-axes-cross-lines) name the bands the points fall into.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'reversed-radar-with-markers': {
        title: 'Reversed Radar Chart With Markers Example | AG Charts',
        h1: 'Reversed Radar Chart With Markers Example',
        description:
            'A radar chart built with AG Charts reversing the radius axis, so the largest values sit at the centre and the smallest at the outer edge. Explore the live example and copy the code.',
        intro: "This example shows a [radar line chart](/r/radar-line-series/) built with AG Charts with a [reversed domain](/r/axes-domain/#reversed-domain) on the radius axis, so the largest values sit at the centre and the smallest at the outer edge: the right way round when a low number is the good result. The radius axis uses the [circle axis shape](/r/radar-line-series/#axis-shape) with a fixed [interval step](/r/axes-intervals/#step), points are drawn as [markers](/r/markers/#marker-shape-size-and-colour) with no connecting line, and the tooltip's [single mode](/r/tooltips/#tooltip-modes) reads one series at a time.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).",
    },

    // ── Radar Area ───────────────────────────────────────────────────────
    'simple-radar-area': {
        title: 'Radar Area Chart Example - JavaScript Data Visualization | AG Charts',
        h1: 'Radar Area Chart Example',
        description:
            'An interactive radar area chart built with AG Charts, filling each profile with partial opacity so three overlapping shapes stay separable. Explore the live example.',
        intro: "This example shows a [radar area chart](/r/radar-area-series/) built with AG Charts, filling the shape each series traces so its overall coverage reads as an area rather than an outline, with partial opacity keeping three overlapping profiles separable. A [property formatter](/r/formatters/#property-formatters) renders every value as a percentage, [gridlines](/r/axes-grid-lines/#enabling-grid-lines) on the angle axis give the shapes a frame, and the tooltip's [placement](/r/tooltips/#placement) falls back between top and bottom.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).",
    },
    'radar-area-with-labels': {
        title: 'Radar Area Chart With Labels Example - JavaScript | AG Charts',
        h1: 'Radar Area Chart With Labels Example',
        description:
            'An interactive radar area chart built with AG Charts, comparing two filled profiles with labels on one of them and a shared tooltip reading both. Explore the live example.',
        intro: 'This example shows a [radar area chart](/r/radar-area-series/) built with AG Charts, comparing two filled profiles where the difference between them at each metric is the point. [Data labels](/r/series-labels/#styling) are enabled on one series so its values read directly, [markers](/r/markers/#marker-shape-size-and-colour) mark every point on both, the radius axis takes the [circle axis shape](/r/radar-area-series/#axis-shape) with a fixed [interval step](/r/axes-intervals/#step), and a [shared tooltip](/r/tooltips/#tooltip-modes) reads both series at once.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'reversed-radar-area': {
        title: 'Reversed Radar Area Chart Example - JavaScript | AG Charts',
        h1: 'Reversed Radar Area Chart Example',
        description:
            'An interactive radar area chart built with AG Charts reversing the radius axis, so higher values sit at the centre, with a repositioned and rotated axis label. Explore the live example.',
        intro: 'This example shows a [radar area chart](/r/radar-area-series/) built with AG Charts with a [reversed domain](/r/axes-domain/#reversed-domain) on the radius axis, so higher values sit at the centre and lower ones are drawn further out. The axis line is moved and its [label rotated to match](/r/radar-area-series/#radius-axis-position) and [formatted](/r/axes-labels/#formatter) as a percentage, a [tooltip renderer](/r/tooltips/#modifying-content) adds a rating per entry, and [highlight styling](/r/series-highlighting/#customisation) is customised for both the hovered item and its series.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },

    // ── Nightingale ──────────────────────────────────────────────────────
    'simple-nightingale': {
        title: 'Nightingale Chart Example - JavaScript Data Visualization | AG Charts',
        h1: 'Nightingale Chart Example',
        description:
            'An interactive Nightingale chart built with AG Charts, wrapping a cyclical sequence into sectors whose radius carries the value, with an average cross line. Explore the live example.',
        intro: "This example shows a [Nightingale chart](/r/nightingale-series/) built with AG Charts, wrapping a cyclical sequence into a circle so the cycle closes rather than running off the end of an axis, with each sector's radius carrying its value. An [item styler](/r/stylers/#item-stylers) fades the below-average sectors and emphasises the rest, a [polar cross line](/r/axes-cross-lines/#polar-axes-cross-lines) marks the average on the radius axis, and a [tooltip renderer](/r/tooltips/#modifying-content) reports each share and its variance from that average.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).",
    },
    'multiple-nightingale-series': {
        title: 'Nightingale Chart with Multiple Series Example | AG Charts',
        h1: 'Nightingale Chart with Multiple Series Example',
        description:
            'An interactive Nightingale chart built with AG Charts, grouping three series per sector against a fixed radius domain, with shaded target bands. Explore the live example.',
        intro: 'This example shows a [Nightingale chart](/r/nightingale-series/) built with AG Charts, grouping three series within each sector so parts are compared cycle position by cycle position. The radius axis is [pinned to a fixed domain](/r/axes-domain/#domain-min--max) so groups stay comparable and uses an [inner radius](/r/nightingale-series/#inner-radius), the angle axis adds [category padding](/r/nightingale-series/#category-padding), [polar cross lines](/r/axes-cross-lines/#polar-axes-cross-lines) shade target bands, and a [theme override](/r/themes/#overrides) styles every series at once.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'reversed-nightingale': {
        title: 'Reversed Nightingale Chart Example - JavaScript | AG Charts',
        h1: 'Reversed Nightingale Chart Example',
        description:
            'An interactive Nightingale chart built with AG Charts reversing the radius axis, so the smallest values reach furthest from the centre. Explore the live example and copy the code.',
        intro: 'This example shows a [Nightingale chart](/r/nightingale-series/) built with AG Charts with a [reversed domain](/r/axes-domain/#reversed-domain) on the radius axis, so the smallest values reach furthest from the centre and a shortfall, rather than a total, is what stands out. A fixed set of [interval values](/r/axes-intervals/#values) replaces the automatic ticks, the axis line is [repositioned with its label rotated to match](/r/nightingale-series/#radius-axis-position) and [formatted](/r/axes-labels/#formatter) as a currency, and the angle axis adds [category padding](/r/nightingale-series/#category-padding).  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },

    // ── Radial Column ────────────────────────────────────────────────────
    'simple-radial-column': {
        title: 'Radial Column Chart Example - JavaScript Data Visualization | AG Charts',
        h1: 'Radial Column Chart Example',
        description:
            'An interactive radial column chart built with AG Charts, wrapping a column chart around a circle so a long cyclical sequence closes on itself. Explore the live example.',
        intro: "This example shows a [radial column chart](/r/radial-column-series/) built with AG Charts, wrapping a column chart around a circle so a long cyclical sequence closes on itself instead of running off a straight axis, with each column's length carrying its value. An [inner radius](/r/radial-column-series/#inner-radius) opens the centre, [category padding](/r/radial-column-series/#category-padding) separates the columns, and an [axis label formatter](/r/axes-labels/#formatter) thins the angle axis to one label per group.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).",
    },
    'grouped-radial-column': {
        title: 'Grouped Radial Column Chart Example - JavaScript | AG Charts',
        h1: 'Grouped Radial Column Chart Example',
        description:
            'An interactive grouped radial column chart built with AG Charts, placing three series side by side within each angular category. Explore the live example and copy the code.',
        intro: 'This example shows a [grouped radial column chart](/r/radial-column-series/) built with AG Charts, placing three series side by side within each angular category so parts are compared inside the cycle as well as around it. [Category padding](/r/radial-column-series/#category-padding) separates both the groups and the columns within them, an [inner radius](/r/radial-column-series/#inner-radius) opens the centre, a [global formatter](/r/formatters/#global-formatter) renders every value as a currency, and the [legend markers](/r/legend/#markers) are enlarged.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'reversed-radial-column': {
        title: 'Reversed Radial Column Chart Example - JavaScript | AG Charts',
        h1: 'Reversed Radial Column Chart Example',
        description:
            'An interactive stacked radial column chart built with AG Charts reversing the radius axis, so a stack builds inwards towards the centre. Explore the live example.',
        intro: 'This example shows a [stacked radial column chart](/r/radial-column-series/#stacked-radial-column) built with AG Charts, stacking three series into one column per angular category and then applying a [reversed domain](/r/axes-domain/#reversed-domain) to the radius axis, so the stack builds inwards towards the centre. An [inner radius](/r/radial-column-series/#inner-radius) keeps the centre open, a [global formatter](/r/formatters/#global-formatter) renders every value as a currency, and the [legend markers](/r/legend/#markers) are enlarged.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },

    // ── Radial Bar ───────────────────────────────────────────────────────
    'simple-radial-bar': {
        title: 'Radial Bar Chart Example - JavaScript Data Visualization | AG Charts',
        h1: 'Radial Bar Chart Example',
        description:
            "An interactive radial bar chart built with AG Charts, curving each category's bar around a partial sweep so long bars fit a compact square. Explore the live example.",
        intro: "This example shows a [radial bar chart](/r/radial-bar-series/) built with AG Charts, curving one bar per category around the centre so a set of long bars fits a compact, square space. A partial [axis angle](/r/radial-bar-series/#axis-angles) stops the sweep short of a full circle to keep the bars comparable, a [gradient fill](/r/fills/#gradients) runs along each bar's length, a [global formatter](/r/formatters/#global-formatter) renders values as a currency, and a [custom tooltip](/r/tooltips/#modifying-content) reads each bar.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).",
    },
    'stacked-radial-bar': {
        title: 'Stacked Radial Bar Chart Example - JavaScript | AG Charts',
        h1: 'Stacked Radial Bar Chart Example',
        description:
            'An interactive stacked radial bar chart built with AG Charts, stacking three series into one curved bar per category around an open centre. Explore the live example.',
        intro: "This example shows a [stacked radial bar chart](/r/radial-bar-series/#stacked-radial-bar) built with AG Charts, stacking three series into a single curved bar per category, so each bar's total sweep is the whole and its segments are the parts. An [inner radius](/r/radial-bar-series/#inner-radius) opens the centre, [dashed gridlines](/r/axes-grid-lines/#customising-grid-lines) frame the angle axis with its numeric labels hidden, and a [global formatter](/r/formatters/#global-formatter) renders every value as a currency.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).",
    },
    'reversed-radial-bar': {
        title: 'Reversed Radial Bar Chart Example - JavaScript | AG Charts',
        h1: 'Reversed Radial Bar Chart Example',
        description:
            'An interactive radial bar chart built with AG Charts reversing both polar axes at once, inverting the stacking direction and the order of the categories. Explore the live example.',
        intro: 'This example shows a [radial bar chart](/r/radial-bar-series/) built with AG Charts with a [reversed domain](/r/axes-domain/#reversed-domain) applied to both polar axes at once: the angle axis reverses the direction the bars sweep and the radius axis reverses the order the categories are stacked in. Category labels are styled as filled chips over the bars, [dashed gridlines](/r/axes-grid-lines/#customising-grid-lines) frame the angle axis, and a [shared tooltip](/r/tooltips/#tooltip-modes) reads every series at one category.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },

    // ── Sunburst ─────────────────────────────────────────────────────────
    'simple-sunburst': {
        title: 'Sunburst Chart Example - JavaScript Data Visualization | AG Charts',
        h1: 'Sunburst Chart Example',
        description:
            'An interactive sunburst chart built with AG Charts, showing a hierarchy as concentric rings sized by value, with the total in an open centre. Explore the live example.',
        intro: "This example shows a [sunburst chart](/r/sunburst-series/) built with AG Charts, laying a hierarchy out as concentric rings so each level's parts sit inside the parent they belong to, with every segment [sized](/r/sunburst-series/#sizing) by value. An [inner circle](/r/sunburst-series/#inner-circle) states the overall total, [labels](/r/sunburst-series/#labels) shrink to fit their segment rather than dropping out, and a [tooltip renderer](/r/tooltips/#modifying-content) gives each segment's share of its parent.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).",
    },
    'sunburst-with-nesting': {
        title: 'Sunburst Chart with Nesting Example - JavaScript | AG Charts',
        h1: 'Sunburst Chart with Nesting Example',
        description:
            'An interactive sunburst chart built with AG Charts, resolving a hierarchy several levels deep, one ring per level, with segments sized by value. Explore the live example.',
        intro: 'This example shows a [sunburst chart](/r/sunburst-series/) built with AG Charts, resolving a [nested hierarchy](/r/sunburst-series/) several levels deep: each level adds a ring, so depth reads outwards while proportion reads around. Segments are [sized](/r/sunburst-series/#sizing) by value, [secondary labels](/r/sunburst-series/#labels) print that value beneath each name, and a [tooltip renderer](/r/tooltips/#modifying-content) reports each segment in the context of its branch.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'sunburst-with-color-range': {
        title: 'Sunburst Chart with Colour Range Example | AG Charts',
        h1: 'Sunburst Chart with Colour Range Example',
        description:
            'An interactive sunburst chart built with AG Charts, sizing segments by one measure and colouring them by a second on a continuous colour scale. Explore the live example.',
        intro: 'This example shows a [sunburst chart](/r/sunburst-series/) built with AG Charts, carrying two measures at once across a nested hierarchy: segment [size](/r/sunburst-series/#sizing) gives one and a continuous [colour scale](/r/colour-scale/) gives the second, so a small segment can still stand out by colour. A [gradient legend](/r/colour-scale/#gradient-legend) maps colour to value and a [property formatter](/r/formatters/#property-formatters) abbreviates it.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },

    // ── Treemap ──────────────────────────────────────────────────────────
    'simple-treemap': {
        title: 'Treemap Chart Example - JavaScript Data Visualization | AG Charts',
        h1: 'Treemap Chart Example',
        description:
            'An interactive treemap chart built with AG Charts, filling the space with nested rectangles whose area carries the value, grouped by parent. Explore the live example.',
        intro: "This example shows a [treemap chart](/r/treemap-series/) built with AG Charts, filling the available space with nested rectangles so every part of the chart carries data: each tile's area is its [size](/r/treemap-series/#sizing) and tiles are packed inside the group they belong to. A [secondary label](/r/treemap-series/#labels) prints the value on each tile, and a [tooltip renderer](/r/tooltips/#modifying-content) switches between a tile's own value and a group's total and count.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).",
    },
    'treemap-with-nesting': {
        title: 'Treemap Chart with Nesting Example - JavaScript | AG Charts',
        h1: 'Treemap Chart with Nesting Example',
        description:
            'An interactive treemap chart built with AG Charts, subdividing each group tile into its own children so several levels of a hierarchy share one area. Explore the live example.',
        intro: 'This example shows a [treemap chart](/r/treemap-series/) built with AG Charts, reading a hierarchy several levels deep: treemap series support multiple [hierarchy levels](/r/treemap-series/#hierarchy-levels), so each group tile subdivides into its own children and the whole tree occupies one area. [Group styling](/r/treemap-series/#labels) sets the stroke width and fill opacity of the containing tiles, which keeps the level boundaries legible as the nesting deepens.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'treemap-with-color-range': {
        title: 'Treemap Chart with Colour Range Example | AG Charts',
        h1: 'Treemap Chart with Colour Range Example',
        description:
            'An interactive treemap chart built with AG Charts, sizing tiles by one measure and colouring them by a second on a diverging seven-stop colour scale. Explore the live example.',
        intro: 'This example shows a [treemap chart](/r/treemap-series/) built with AG Charts, carrying two measures at once: tile area gives magnitude while a diverging seven-stop [colour scale](/r/colour-scale/#custom-colours) gives a signed second measure, so size and direction are read together. A [gradient legend](/r/colour-scale/#gradient-legend) maps colour to value, [secondary labels](/r/treemap-series/#labels) print the signed change, and tile gaps and corner radius separate the groups.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },

    // ── Heatmap ──────────────────────────────────────────────────────────
    'simple-heatmap': {
        title: 'Heatmap Chart Example - JavaScript Data Visualization | AG Charts',
        h1: 'Heatmap Chart Example',
        description:
            'An interactive heatmap chart built with AG Charts, encoding a value as cell colour across two categorical axes so patterns read as a whole. Explore the live example.',
        intro: 'This example shows a [heatmap chart](/r/heatmap-series/) built with AG Charts, encoding a value as cell colour across two categorical axes, so a grid too dense for bars reads as a pattern. A nine-stop diverging [colour scale](/r/colour-scale/#custom-colours) maps the value from one extreme to the other, a [gradient legend](/r/colour-scale/#gradient-legend) gives the scale, and a [tooltip renderer](/r/tooltips/#modifying-content) classifies each cell against it.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'heatmap-with-labels': {
        title: 'Heatmap Chart with Labels Example - JavaScript | AG Charts',
        h1: 'Heatmap Chart with Labels Example',
        description:
            'An interactive heatmap chart built with AG Charts, printing a formatted value in every cell so the grid is read exactly as well as at a glance. Explore the live example.',
        intro: 'This example shows a [heatmap chart](/r/heatmap-series/) built with AG Charts, printing a formatted value inside every cell so the grid can be read exactly as well as at a glance, which suits a heatmap small enough for the numbers to fit. [Cell labels](/r/heatmap-series/#labels) carry a formatter, the y-axis is [moved to the right](/r/axes-position/#axis-placement), and the [gradient legend](/r/colour-scale/#gradient-legend) labels are formatted to match the cells.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'grouped-category-heatmap': {
        title: 'Heatmap Chart with Grouped Category Axis Example | AG Charts',
        h1: 'Heatmap Chart with Grouped Category Axis Example',
        description:
            'An interactive heatmap chart built with AG Charts, nesting one category inside another on a grouped category axis so two levels share one grid. Explore the live example.',
        intro: 'This example shows a [heatmap chart](/r/heatmap-series/) built with AG Charts, nesting one category inside another on a [grouped category axis](/r/axes-types/#grouped-category), so the grid carries two levels on a single axis and comparisons can be made within a group or across them. A four-stop [colour scale](/r/colour-scale/#custom-colours) maps the value, the axis emboldens its second level, and a [tooltip renderer](/r/tooltips/#modifying-content) reports both category values for the hovered cell.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'calendar-heatmap': {
        title: 'Calendar Heatmap Chart Example - JavaScript | AG Charts',
        h1: 'Calendar Heatmap Chart Example',
        description:
            'An interactive heatmap chart built with AG Charts arranged as a calendar grid, so a long daily series reads as a seasonal pattern. Explore the live example.',
        intro: 'This example shows a [heatmap chart](/r/heatmap-series/) built with AG Charts arranged as a calendar grid, mapping one axis to the period within a cycle and the other to the cycle itself, so a long run of readings reads as a seasonal pattern instead of a line. The cells take a corner radius and a wide stroke to separate them, the date axis is [moved above the chart](/r/axes-position/#axis-placement), the other axis is stripped of labels, and the [gradient legend](/r/colour-scale/#legends) is switched off.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },

    // ── Sankey ───────────────────────────────────────────────────────────
    sankey: {
        title: 'Sankey Chart Example - JavaScript Data Visualization | AG Charts',
        h1: 'Sankey Chart Example',
        description:
            'An interactive sankey chart built with AG Charts, tracing how a quantity divides and recombines between stages, with the link width as the value. Explore the live example.',
        intro: 'This example shows a [sankey chart](/r/sankey-series/) built with AG Charts, tracing how a quantity divides and recombines as it passes between stages: `fromKey`, `toKey` and `sizeKey` define each flow and the width of each link is its value, so conservation between stages is visible. Nodes use [centre alignment](/r/sankey-series/#horizontal-alignment) and their labels sit [inside the node](/r/sankey-series/#label-placement).  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'sankey-customisation': {
        title: 'Customised Sankey Chart Example - JavaScript | AG Charts',
        h1: 'Customised Sankey Chart Example',
        description:
            'An interactive sankey chart built with AG Charts, styled so the nodes carry the emphasis and the flows recede, with bordered labels. Explore the live example.',
        intro: "This example shows a [sankey chart](/r/sankey-series/) built with AG Charts, styled so the nodes carry the emphasis and the flows between them recede. [Node style](/r/sankey-series/#node-style) options widen the nodes, round their corners and set their opacity, left [alignment](/r/sankey-series/#horizontal-alignment) pins them to one side, [link style](/r/sankey-series/#link-style) options lighten the flows behind bordered labels, and a [tooltip renderer](/r/tooltips/#modifying-content) reports each link's value, share and stage.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).",
    },

    // ── Chord ────────────────────────────────────────────────────────────
    chord: {
        title: 'Chord Chart Example - JavaScript Data Visualization | AG Charts',
        h1: 'Chord Chart Example',
        description:
            'An interactive chord chart built with AG Charts, showing which categories connect and how strongly as ribbons around a circle. Explore the live example and copy the code.',
        intro: 'This example shows a [chord chart](/r/chord-series/) built with AG Charts, showing which categories connect and how strongly as ribbons drawn across a circle, the shape to reach for when every category can relate to every other. [Node width and spacing](/r/chord-series/#node-style) and [link opacity](/r/chord-series/#link-style) are tuned so overlapping ribbons stay readable, with a [tooltip renderer](/r/tooltips/#modifying-content) and a [global formatter](/r/formatters/#global-formatter) abbreviating large values.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'chord-customisation': {
        title: 'Customised Chord Chart Example - JavaScript | AG Charts',
        h1: 'Customised Chord Chart Example',
        description:
            "An interactive chord chart built with AG Charts using an item styler to scale each ribbon's opacity by volume, so the strongest connections dominate. Explore the live example.",
        intro: "This example shows a [chord chart](/r/chord-series/) built with AG Charts, weighting a dense set of connections so the strongest dominate: an [item styler](/r/stylers/#item-stylers) scales each ribbon's opacity by its volume, over and above the width it already carries. [Node width](/r/chord-series/#node-style) is widened with rounded corners, the [link stroke and opacity](/r/chord-series/#link-style) are styled, and the tooltip takes a custom [position](/r/tooltips/#tooltip-position).  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).",
    },

    // ── Funnel ───────────────────────────────────────────────────────────
    'simple-funnel': {
        title: 'Funnel Chart Example - JavaScript Data Visualization | AG Charts',
        h1: 'Funnel Chart Example',
        description:
            'An interactive funnel chart built with AG Charts, showing how much of a total survives each stage of an ordered sequence. Explore the live example and copy the code.',
        intro: "This example shows a [funnel chart](/r/funnel-series/) built with AG Charts, showing how much of a total survives each stage of an ordered sequence: every bar is narrower than the one before it, so the loss between stages is the thing being read. `spacingRatio` sets the gap between stages, a [format string](/r/formatters/#format-strings) renders the values as whole numbers, and a [tooltip renderer](/r/tooltips/#modifying-content) reports each stage's conversion.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).",
    },
    'customised-funnel': {
        title: 'Customised Funnel Chart Example - JavaScript | AG Charts',
        h1: 'Customised Funnel Chart Example',
        description:
            'A customised horizontal funnel chart built with AG Charts, reading each stage against a target so the bars show both progression and attainment. Explore the live example.',
        intro: 'This example shows a [horizontal funnel chart](/r/funnel-series/#horizontal-funnel) built with AG Charts, reading each stage against a target as well as against the stage before it. An [item styler](/r/stylers/#item-stylers) raises the fill opacity of the stages that hit their target, the [drop-off areas](/r/funnel-series/#customisation) are faded, [stage labels](/r/funnel-series/#labels) sit before each bar, and a tooltip with a custom [position](/r/tooltips/#tooltip-position) reports attainment and overall conversion.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },

    // ── Cone Funnel ──────────────────────────────────────────────────────
    'simple-cone-funnel': {
        title: 'Cone Funnel Chart Example - JavaScript Data Visualization | AG Charts',
        h1: 'Cone Funnel Chart Example',
        description:
            'An interactive cone funnel chart built with AG Charts, drawing a divider at each stage whose width is its value and shading the change in between. Explore the live example.',
        intro: "This example shows a [cone funnel chart](/r/cone-funnel-series/) built with AG Charts, drawing a divider at each stage whose width is that stage's value, with the area between two dividers shaded for the change from one to the next. A reduced [fill opacity](/r/cone-funnel-series/#customisation) fades those areas so the thin dashed dividers carry the reading, [stage labels](/r/cone-funnel-series/#labels) sit after each divider, and a [tooltip renderer](/r/tooltips/#modifying-content) reports the conversion at each stage.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).",
    },

    // ── Pyramid ──────────────────────────────────────────────────────────
    'simple-pyramid': {
        title: 'Pyramid Chart Example - JavaScript Data Visualization | AG Charts',
        h1: 'Pyramid Chart Example',
        description:
            "An interactive pyramid chart built with AG Charts, showing how a population thins across ordered tiers, each tier's area carrying its share. Explore the live example.",
        intro: "This example shows a [pyramid chart](/r/pyramid-series/) built with AG Charts, showing how a population thins as it moves up a set of ordered tiers, with each tier's area carrying its share of the whole. The [aspect ratio](/r/pyramid-series/#shape) widens the triangle, [labels](/r/pyramid-series/#labels) print a share and value on the tiers with room for them, and a [tooltip renderer](/r/tooltips/#modifying-content) names the open-ended top tier in full.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).",
    },

    // ── Radial Gauge ─────────────────────────────────────────────────────
    'simple-radial-gauge': {
        title: 'Radial Gauge Chart Example - JavaScript Data Visualization | AG Charts',
        h1: 'Radial Gauge Chart Example',
        description:
            'An interactive radial gauge built with AG Charts, reading a single value against its range on a banded circular scale with named thresholds. Explore the live example.',
        intro: 'This example shows a [radial gauge chart](/r/radial-gauge/) built with AG Charts, reading a single value against the range it could occupy, which is what a gauge does that a bar cannot. The scale is split into [segments](/r/radial-gauge/#segmentation) with spacing between them, the bar uses [multiple colours](/r/radial-gauge/#multiple-colours) in discrete blocks to band performance, and the [labels](/r/radial-gauge/#labels) name each threshold and print the value as a percentage.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'customised-radial-gauge': {
        title: 'Customised Radial Gauge Chart Example - JavaScript | AG Charts',
        h1: 'Customised Radial Gauge Chart Example',
        description:
            'A customised radial gauge built with AG Charts, sweeping past a full half-circle with segments cut at the thresholds and a triangular target marker. Explore the live example.',
        intro: 'This example shows a [radial gauge chart](/r/radial-gauge/) built with AG Charts, shaped to the reading it carries: the [start and end angles](/r/radial-gauge/#start-and-end-angles) open the sweep out well past a half-circle, and the scale is cut into [segments](/r/radial-gauge/#segmentation) exactly at the thresholds that matter rather than at even intervals. A triangular [target](/r/radial-gauge/#targets) marks the limit, a [corner radius](/r/radial-gauge/#corner-radius) rounds the bar, and a [tooltip renderer](/r/tooltips/#modifying-content) reports the current band.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },

    // ── Linear Gauge ─────────────────────────────────────────────────────
    'simple-linear-gauge': {
        title: 'Linear Gauge Chart Example - JavaScript Data Visualization | AG Charts',
        h1: 'Linear Gauge Chart Example',
        description:
            'An interactive linear gauge built with AG Charts, reading a value against several named ranges marked along a segmented bar. Explore the live example and copy the code.',
        intro: 'This example shows a [linear gauge chart](/r/linear-gauge/) built with AG Charts, reading a value against its range on a straight bar, which fits where a dial would not. The bar is divided into [segments](/r/linear-gauge/#segmentation) and rounded with a [corner radius](/r/linear-gauge/#corner-radius), its own scale labels are switched off in favour of a series of [targets](/r/linear-gauge/#targets) naming each range, and a [theme override](/r/themes/#overrides) styles those targets consistently.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'horizontal-linear-gauge': {
        title: 'Horizontal Linear Gauge Chart Example - JavaScript | AG Charts',
        h1: 'Horizontal Linear Gauge Chart Example',
        description:
            'An interactive horizontal linear gauge built with AG Charts, measuring a value against a target with the scale labelled by named stages. Explore the live example.',
        intro: 'This example shows a [horizontal linear gauge chart](/r/linear-gauge/#horizontal-linear-gauge) built with AG Charts, laying the bar across the chart so it reads like a progress measure against a target. The bar is split into [segments](/r/linear-gauge/#segmentation), its [scale labels](/r/linear-gauge/#labels) are formatted as named stages rather than numbers, a translucent circular [target](/r/linear-gauge/#targets) marks the goal, and a [tooltip renderer](/r/tooltips/#modifying-content) reports the gap to it.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'simple-bullet': {
        title: 'Bullet Chart Example - JavaScript Data Visualization | AG Charts',
        h1: 'Bullet Chart Example',
        description:
            'A bullet chart built with AG Charts, comparing value against target across categories as a row of narrow gauges on one shared scale. Explore the live example.',
        intro: 'This example shows a [bullet chart](/r/linear-gauge/#bullet-series) built with AG Charts, comparing a value against its target across categories by placing one narrow gauge per category in a row, so a set of measures is scanned as compactly as a table. Each gauge is a separate [linear gauge chart](/r/linear-gauge/) divided into [segments](/r/linear-gauge/#segmentation), rounded with a [corner radius](/r/linear-gauge/#corner-radius), and marked with a line-shaped [target](/r/linear-gauge/#targets).  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },

    // ── Combination ──────────────────────────────────────────────────────
    'bar-line-combination': {
        title: 'Bar And Line Combination Chart Example - JavaScript | AG Charts',
        h1: 'Bar And Line Combination Chart Example',
        description:
            'An interactive combination chart built with AG Charts, charting one measure for six advertising channels as two emphasised bars and four dashed lines. Explore the live example.',
        intro: 'This example shows a [combination chart](/r/combination-series/) built with AG Charts, charting the same measure for six advertising channels on shared axes: two channels are drawn as [bar series](/r/bar-series/) to carry the emphasis and the other four as [line series](/r/line-series/) behind them, so every channel stays directly comparable. A [shared tooltip](/r/tooltips/#tooltip-modes) reads every series at one category and is [anchored to the chart](/r/tooltips/#anchor-point) rather than to the pointer, so it stays in a fixed position, the lines are dashed and marker-free via a [theme override](/r/themes/#overrides), and [band highlight](/r/axes-crosshairs/#band-highlight) shades the hovered category.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'histogram-scatter-combination': {
        title: 'Histogram And Scatter Combination Chart Example | AG Charts',
        h1: 'Histogram And Scatter Combination Chart Example',
        description:
            'An interactive combination chart built with AG Charts, overlaying every individual point on the binned averages so outliers survive the aggregation. Explore the live example.',
        intro: 'This example shows a [combination chart](/r/combination-series/) built with AG Charts, overlaying a [scatter series](/r/scatter-series/) on a [histogram series](/r/histogram-series/) across shared axes, so the individual points that an aggregate hides are shown alongside it. [Mean aggregation](/r/histogram-series/#aggregation) sets each bar to the average of a second measure within its bin, the bars take a corner radius, and both axes [keep their exact extents](/r/axes-domain/#nice-domain) rather than rounding outwards.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'horizontal-range-bar-scatter-combination': {
        title: 'Horizontal Range Bar And Scatter Combination Example | AG Charts',
        h1: 'Horizontal Range Bar And Scatter Combination Chart Example',
        description:
            'An interactive combination chart built with AG Charts, reading a derived measure against two value ranges by giving each its own named axis. Explore the live example.',
        intro: 'This example shows a [combination chart](/r/combination-series/) built with AG Charts, reading a derived measure against the ranges it comes from: two [horizontal range bar series](/r/range-bar-series/#horizontal-range-bar) carry the ranges and a [bubble series](/r/bubble-series/) carries the derived figure, each mapped to its own [named axis](/r/axes-secondary/#custom-axis-keys) so the two scales never distort each other. The bubbles are both sized and labelled by that measure, and [axis label formatters](/r/axes-labels/#formatter) give each axis its own units.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'radar-line-radar-area-nightingale-combination': {
        title: 'Polar Combination Chart Example - Radar, Nightingale | AG Charts',
        h1: 'Radar Line, Radar Area And Nightingale Combination Chart Example',
        description:
            'An interactive polar combination chart built with AG Charts, layering nightingale sectors, a radar area fill and a radar line on shared polar axes. Explore the live example.',
        intro: 'This example shows a [combination chart](/r/combination-series/) built with AG Charts, layering three polar series on shared angle and radius axes: a [nightingale series](/r/nightingale-series/) gives the sectors, a [radar area series](/r/radar-area-series/) fills a second measure behind them with no stroke, and a [radar line series](/r/radar-line-series/) traces a third as an outline, so three measures per category are read as one figure.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'grouped-bar-line-combination': {
        title: 'Grouped Category Axis Combination Chart Example | AG Charts',
        h1: 'Grouped Category Axis Combination Chart Example',
        description:
            'An interactive combination chart built with AG Charts, combining bars and lines on a grouped category axis with a secondary axis for the smaller scale. Explore the live example.',
        intro: 'This example shows a [combination chart](/r/combination-series/) built with AG Charts, combining [bar series](/r/bar-series/) and [line series](/r/line-series/) whose scales are orders of magnitude apart: a [secondary y-axis](/r/axes-secondary/#creating-a-secondary-axis) keeps the smaller measures readable, and a [grouped category axis](/r/axes-types/#grouped-category) nests the categories. A [custom marker shape](/r/markers/#custom-marker-shapes) matches the line markers to the bars, both axes use compact labels, and a [shared tooltip](/r/tooltips/#tooltip-modes) reads the group at once.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'step-interpolation-combination': {
        title: 'Step Interpolation Combination Chart Example | AG Charts',
        h1: 'Step Interpolation Combination Chart Example',
        description:
            'An interactive combination chart built with AG Charts using step interpolation throughout, so each value holds flat until the next period. Explore the live example.',
        intro: 'This example shows a [combination chart](/r/combination-series/) built with AG Charts, combining a [range area series](/r/range-area-series/) with two [line series](/r/line-series/), all using [step interpolation](/r/line-series/#interpolation) so each value holds flat until the next period: the honest shape for figures that change in discrete steps rather than continuously. A [grouped category axis](/r/axes-types/#grouped-category) nests the periods and rotates its inner labels, with the value axis pinned to fixed [interval values](/r/axes-intervals/#values).  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'grouped-category-combination': {
        title: 'Bar, Line And Area Combination Chart Example | AG Charts',
        h1: 'Bar, Line And Area Combination Chart Example',
        description:
            'An interactive combination chart built with AG Charts, charting six measures in three forms against three named axes on one grouped category axis. Explore the live example.',
        intro: 'This example shows a [combination chart](/r/combination-series/) built with AG Charts, charting six measures in three different forms without letting any one scale dominate: an [area series](/r/area-series/), a [line series](/r/line-series/) with [smooth interpolation](/r/line-series/#interpolation) and four [bar series](/r/bar-series/) each read against their own [named axis](/r/axes-secondary/#custom-axis-keys), on a [grouped category axis](/r/axes-types/#grouped-category). A bordered [floating legend](/r/legend/#floating) sits over the series area so it costs no layout space.  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'stacked-bar-area-combination': {
        title: 'Stacked Bar And Area Combination Chart Example | AG Charts',
        h1: 'Stacked Bar And Area Combination Chart Example',
        description:
            'An interactive combination chart built with AG Charts, overlaying a stepped area on a seven-series stack so the parts and a separate total read together. Explore the live example.',
        intro: "This example shows a [combination chart](/r/combination-series/) built with AG Charts, overlaying an [area series](/r/area-series/) with [step interpolation](/r/area-series/#interpolation) on seven [stacked bar series](/r/bar-series/#stacked-bar), so a composition and an independent measure over the same period are read together. A [unit time axis](/r/axes-time/#unit-time) spaces the periods evenly, an [item styler](/r/stylers/#item-stylers) fades each bar's opacity by value, and the value axis sits on the right with a fixed [step interval](/r/axes-intervals/#step).  \nGet started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).",
    },
};
