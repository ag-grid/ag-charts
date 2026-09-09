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
            'An interactive bar chart built with AG Charts: compare categories with customisable axes, tooltips and labels. Explore the live example and copy the code.',
        intro: 'This example shows a bar chart built with AG Charts, comparing values across categories with [rounded bars](/r/bar-series/), custom colours, tooltips and labels. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'grouped-stacked-bar': {
        title: 'Grouped Stacked Bar Chart Example - JavaScript Data Visualization | AG Charts',
        h1: 'Grouped Stacked Bar Chart Example',
        description:
            'A grouped stacked bar chart built with AG Charts: pair two stacked measures per category with error bars and a secondary axis. Explore the live example and copy the code.',
        intro: 'This example shows a grouped stacked bar chart built with AG Charts, pairing two [stacked](/r/bar-series/) measures side by side per category with [error bars](/r/error-bars/) and a [secondary axis](/r/axes-secondary/). Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'stacked-bar': {
        title: 'Stacked Bar Chart Example - JavaScript Data Visualization | AG Charts',
        h1: 'Stacked Bar Chart Example',
        description:
            'A 100% stacked bar chart built with AG Charts: break each category into a percentage split across series. Explore the live example and copy the code.',
        intro: 'This example shows a 100% stacked bar chart built with AG Charts, breaking each category down into a percentage split across [stacked](/r/bar-series/) series. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'simple-horizontal-bar': {
        title: 'Horizontal Bar Chart Example - JavaScript Data Visualization | AG Charts',
        h1: 'Horizontal Bar Chart Example',
        description:
            'A horizontal bar chart built with AG Charts: rank categories with error bars and value-scaled bar opacity. Explore the live example and copy the code.',
        intro: 'This example shows a horizontal bar chart built with AG Charts, ranking categories with [error bars](/r/error-bars/) and value-scaled bar opacity. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'stacked-horizontal-bar': {
        title: 'Stacked Horizontal Bar Chart Example - JavaScript Data Visualization | AG Charts',
        h1: 'Stacked Horizontal Bar Chart Example',
        description:
            'A diverging stacked horizontal bar chart built with AG Charts: split positive and negative values either side of a baseline. Explore the live example and copy the code.',
        intro: 'This example shows a diverging stacked horizontal bar chart built with AG Charts, splitting positive and negative values either side of a baseline with [labelled zones](/r/axes-cross-lines/). Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'grouped-horizontal-bar': {
        title: 'Grouped Horizontal Bar Chart Example - JavaScript Data Visualization | AG Charts',
        h1: 'Grouped Horizontal Bar Chart Example',
        description:
            'A grouped horizontal bar chart built with AG Charts: plot positive and negative changes with in-chart category labels. Explore the live example and copy the code.',
        intro: 'This example shows a grouped horizontal bar chart built with AG Charts, plotting positive and negative changes per category with [in-chart category labels](/r/axes-cross-lines/). Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'simple-line': {
        title: 'Line Chart Example - JavaScript & React | AG Charts',
        h1: 'Line Chart Example',
        description:
            'A line chart built with AG Charts: petrol and diesel prices tracked over time with error bars and a time axis. Explore the live example and copy the code.',
        intro: 'This example shows a line chart built with AG Charts, tracking UK petrol and diesel prices over time with [error bars](/r/error-bars/) on a [time axis](/r/axes-time/) and custom [tooltips](/r/tooltips/). Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'line-with-gaps': {
        title: 'Line Chart With Gaps Example - JavaScript & React | AG Charts',
        h1: 'Line Chart With Gaps Example',
        description:
            'A line chart built with AG Charts: banana prices for ten countries plotted with gaps where data is missing. Explore the live example and copy the code.',
        intro: 'This example shows a line chart with gaps built with AG Charts, plotting banana import prices for ten countries across the year and breaking each [line series](/r/line-series/) wherever a country has no price for a given week. A [shared tooltip](/r/tooltips/) compares every country at once, with custom [axis labels](/r/axes-labels/) formatting each week. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'multiple-line-series': {
        title: 'Line Chart with Multiple Series Example | AG Charts',
        h1: 'Line Chart with Multiple Series Example',
        description:
            'A line chart built with AG Charts: six series compare daily socialising hours by age, with custom axis intervals. Explore the live example and copy the code.',
        intro: 'This example shows a line chart with multiple series built with AG Charts, comparing six smooth [line series](/r/line-series/) that track how many hours per day people spend socialising alone, with friends, family, children or a partner across different ages. It uses [shared tooltips](/r/tooltips/) and custom [axis intervals](/r/axes-intervals/) to keep the hour scale readable. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'line-with-time-axis': {
        title: 'Line Chart With Time Axis Example | AG Charts',
        h1: 'Line Chart With Time Axis Example',
        description:
            'A line chart built with AG Charts: five renewable energy sources on a time axis with stepped lines and a COVID cross line. Explore the live example and copy the code.',
        intro: 'This example shows a line chart with a time axis built with AG Charts, tracking five renewable energy sources in kilotonnes of oil equivalent from 2000 onward using stepped [line series](/r/line-series/) on a [time axis](/r/axes-time/). A [cross line](/r/axes-cross-lines/) flags the COVID-19 downturn, and [zoom](/r/zoom/) lets you drag to explore a date range. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'multiple-line-series-large-data': {
        title: 'Line Chart With Large Data Example | AG Charts',
        h1: 'Line Chart With Large Data Example',
        description:
            'A line chart built with AG Charts: six trigonometric functions plotted across 1,000 points with pi-based formatters. Explore the live example and copy the code.',
        intro: 'This example shows a line chart with large data built with AG Charts, plotting six trigonometric functions, sine, cosine, tangent, secant, cosecant and cotangent, across 1,000 points from -2π to 2π. [Cross lines](/r/axes-cross-lines/) mark the axes like a maths textbook, and custom [formatters](/r/formatters/) label ticks and tooltips in terms of π while AG Charts keeps rendering [smooth at scale](/r/high-performance-charts/). Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'line-with-labels': {
        title: 'Line Chart With Labels Example - JavaScript & React | AG Charts',
        h1: 'Line Chart With Labels Example',
        description:
            'A line chart built with AG Charts: daily eating hours by age group, labelled only on the first and last points. Explore the live example and copy the code.',
        intro: 'This example shows a line chart with labels built with AG Charts, tracking hours spent eating and drinking per day across six age groups from 2012 to 2022. [Series labels](/r/series-labels/) mark only the first and last year for each smooth [line series](/r/line-series/), and a [cross line](/r/axes-cross-lines/) highlights the one-hour mark. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'simple-area': {
        title: 'Area Chart Example - JavaScript Data Visualization | AG Charts',
        h1: 'Area Chart Example',
        description:
            'An area chart built with AG Charts: quarterly US GDP growth shown with a red style segment where growth turns negative. Explore the live example and copy the code.',
        intro: 'This example shows an area chart built with AG Charts, tracking quarterly US GDP growth from 2019 to 2021 on a [time axis](/r/axes-time/). A red [style segment](/r/style-segments/) highlights the COVID-19 contraction where growth dips below zero. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'area-with-labels': {
        title: 'Area Chart With Labels Example | AG Charts',
        h1: 'Area Chart With Labels Example',
        description:
            'An area chart built with AG Charts: streaming music sales shown with a gradient fill and labels at key milestones. Explore the live example and copy the code.',
        intro: 'This example shows an area chart with labels built with AG Charts, tracking streaming music sales in billions of USD against a blue [gradient fill](/r/fills/) on a [time axis](/r/axes-time/). [Series labels](/r/series-labels/) appear only at a handful of milestone dates along the timeline. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'stacked-area': {
        title: 'Stacked Area Chart Example | AG Charts',
        h1: 'Stacked Area Chart Example',
        description:
            "A stacked area chart built with AG Charts: six museums' monthly visitors layered with a shaded peak-season range. Explore the live example and copy the code.",
        intro: 'This example shows a stacked area chart built with AG Charts, layering monthly visitor numbers for six UK science museums onto a single [time axis](/r/axes-time/). A shaded [cross line](/r/axes-cross-lines/) range marks the July-August peak season, and custom [tooltips](/r/tooltips/) format visitor counts in thousands. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'area-with-markers': {
        title: 'Area Chart With Markers Example | AG Charts',
        h1: 'Area Chart With Markers Example',
        description:
            'An area chart built with AG Charts: target versus actual revenue by industry, with markers on the top performers. Explore the live example and copy the code.',
        intro: 'This example shows an area chart with markers built with AG Charts, comparing target versus actual Q4 subscription revenue across industries. [Markers](/r/markers/) appear only on the industries with the strongest growth, and [cross line](/r/axes-cross-lines/) ranges call out their percentage gains along a rotated [category axis](/r/axes-labels/). Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    '100--stacked-area': {
        title: '100% Stacked Area Chart Example | AG Charts',
        h1: '100% Stacked Area Chart Example',
        description:
            'A 100% stacked area chart built with AG Charts: seven UK energy sources normalised to a percentage with pattern fills. Explore the live example and copy the code.',
        intro: 'This example shows a 100% stacked area chart built with AG Charts, normalising seven UK energy sources to a full percentage of total generation over time. Coal and nuclear use a [pattern fill](/r/fills/) to stand out, and a smooth [animation](/r/animation/) eases the series in along a [time axis](/r/axes-time/). Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'area-with-negative-values': {
        title: 'Area Chart With Negative Values Example | AG Charts',
        h1: 'Area Chart With Negative Values Example',
        description:
            "An area chart built with AG Charts: a startup's revenue and costs turning positive across a grouped category axis. Explore the live example and copy the code.",
        intro: "This example shows an area chart with negative values built with AG Charts, tracking a SaaS startup's revenue and costs from launch losses to profitability across a two-level [grouped category axis](/r/axes-types/) of years and quarters. Shaded [cross line](/r/axes-cross-lines/) ranges label each business phase, with a marker where the areas cross into positive territory. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).",
    },
    'simple-scatter': {
        title: 'Scatter Chart Example - JavaScript Data Visualization | AG Charts',
        h1: 'Scatter Chart Example',
        description:
            'A scatter chart built with AG Charts: height versus weight for 1,040 MLB players, with cross lines marking the averages. Explore the live example and copy the code.',
        intro: "This example shows a scatter chart built with AG Charts, plotting height against weight for 1,040 Major League Baseball players to reveal the correlation between the two. [Cross lines](/r/axes-cross-lines/) mark the league averages, and custom [tooltips](/r/tooltips/) convert each player's height into feet and inches. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).",
    },
    'multiple-scatter-series': {
        title: 'Scatter Chart with Multiple Series Example | AG Charts',
        h1: 'Scatter Chart with Multiple Series Example',
        description:
            'A scatter chart built with AG Charts: GDP per capita versus life satisfaction, with a star-shaped series per continent. Explore the live example and copy the code.',
        intro: 'This example shows a scatter chart with multiple series built with AG Charts, plotting GDP per capita against life satisfaction for 163 countries grouped into continents, each drawn as its own star-shaped [marker](/r/markers/) series. [Series labels](/r/series-labels/) call out notable countries, while coloured [cross line](/r/axes-cross-lines/) bands split nations into low, middle and high income groups. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'scatter-with-large-data': {
        title: 'Scatter Chart With Large Data Example | AG Charts',
        h1: 'Scatter Chart With Large Data Example',
        description:
            'A scatter chart built with AG Charts: cytogenetic bands mapped across all 23 human chromosomes, one series per chromosome. Explore the live example and copy the code.',
        intro: 'This example shows a scatter chart with large data built with AG Charts, mapping cytogenetic band positions across all 23 pairs of human chromosomes as one [scatter series](/r/scatter-series/) per chromosome. [Cross lines](/r/axes-cross-lines/) mark the centromere and label the short and long arms, while AG Charts keeps every point [rendering smoothly](/r/high-performance-charts/). Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'scatter-with-custom-markers': {
        title: 'Scatter Chart With Custom Markers Example | AG Charts',
        h1: 'Scatter Chart With Custom Markers Example',
        description:
            'A scatter chart built with AG Charts: NPM downloads and website visits plotted with custom logo-shaped markers. Explore the live example and copy the code.',
        intro: 'This example shows a scatter chart with custom markers built with AG Charts, comparing monthly NPM downloads against daily website visits using [custom marker shapes](/r/markers/) built from the AG Charts and npm logos. Each metric plots against its own [secondary axis](/r/axes-secondary/) along a shared [time axis](/r/axes-time/). Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'scatter-with-labels': {
        title: 'Scatter Chart With Labels Example | AG Charts',
        h1: 'Scatter Chart With Labels Example',
        description:
            'A scatter chart built with AG Charts: British baby names plotted by popularity and trend, with a name label on every point. Explore the live example and copy the code.',
        intro: 'This example shows a scatter chart with labels built with AG Charts, plotting popularity against trend score for British baby names, split into boy and girl [marker](/r/markers/) series. [Series labels](/r/series-labels/) name each point, and formatted [crosshairs](/r/axes-crosshairs/) read out the exact popularity and trend values as you hover. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'scatter-with-multiple-axes': {
        title: 'Scatter Chart With Multiple Axes Example | AG Charts',
        h1: 'Scatter Chart With Multiple Axes Example',
        description:
            'A scatter chart built with AG Charts: UK life expectancy versus deaths registered, plotted on two independent axes. Explore the live example and copy the code.',
        intro: 'This example shows a scatter chart with multiple axes built with AG Charts, plotting UK life expectancy against the number of registered deaths on independent scales. Life expectancy runs on a [secondary axis](/r/axes-secondary/) from 25 to 85 years, with formatted [crosshairs](/r/axes-crosshairs/) and a shared [tooltip](/r/tooltips/) comparing both metrics at a glance. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'bubble-with-negative-values': {
        title: 'Bubble Chart Example | AG Charts',
        h1: 'Bubble Chart Example',
        description:
            "A bubble chart built with AG Charts: plot the world's most populous cities by position, sized by population, with cross lines marking the equator. Explore the live example and copy the code.",
        intro: "This example shows a bubble chart built with AG Charts, plotting the world's most populous cities across negative and positive longitude and latitude, sizing each [bubble](/r/bubble-series/) by population and marking the equator and prime meridian with [cross lines](/r/axes-cross-lines/). Custom [formatters](/r/formatters/) convert the raw coordinates into compass directions. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).",
    },
    'multiple-bubble-series': {
        title: 'Multiple Bubble Series Chart Example | AG Charts',
        h1: 'Multiple Bubble Series Chart Example',
        description:
            'A multiple bubble series chart built with AG Charts: compare UK food and coffee franchise growth with a shared tooltip and market-threshold cross lines. Explore the live example and copy the code.',
        intro: 'This example shows a chart with multiple bubble series built with AG Charts, comparing the UK food and coffee franchise industries side by side on shared axes with a [shared tooltip](/r/tooltips/) and [cross lines](/r/axes-cross-lines/) marking the market threshold and industry average growth rate. Each [bubble series](/r/bubble-series/) sizes its markers by licence fee and labels only the most significant franchises. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'bubble-with-categories': {
        title: 'Bubble Chart With Categories Example | AG Charts',
        h1: 'Bubble Chart With Categories Example',
        description:
            'A bubble chart built with AG Charts: plot a GitHub commit punch card across category axes for day and hour, sized by commit count. Explore the live example and copy the code.',
        intro: 'This example shows a bubble chart built with AG Charts, plotting a GitHub commit punch card across [category axes](/r/axes-types/) for day and hour, with each [bubble](/r/bubble-series/) sized by the number of commits made in that hour. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'bubble-with-images': {
        title: 'Bubble Chart With Images Example | AG Charts',
        h1: 'Bubble Chart With Images Example',
        description:
            'A bubble chart built with AG Charts: compare musical instruments by invention year and difficulty, filling each marker with an instrument image. Explore the live example and copy the code.',
        intro: 'This example shows a bubble chart built with AG Charts, comparing musical instruments by invention year, difficulty and popularity, filling each [bubble](/r/bubble-series/) with an instrument image using an [image fill](/r/fills/) and custom axis [formatters](/r/formatters/) for BCE/CE eras and difficulty labels. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'bubble-with-patterns': {
        title: 'Bubble Chart With Patterns Example | AG Charts',
        h1: 'Bubble Chart With Patterns Example',
        description:
            'A bubble chart built with AG Charts: compare revenue, employees and growth across five industries, each series filled with a distinct pattern. Explore the live example and copy the code.',
        intro: "This example shows a bubble chart built with AG Charts, comparing revenue, employee count and growth across five industries, filling each industry's [bubble series](/r/bubble-series/) with a distinct [pattern fill](/r/fills/) instead of a flat colour. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).",
    },
    'bubble-with-custom-svg-patterns': {
        title: 'Bubble Chart With Custom SVG Patterns Example | AG Charts',
        h1: 'Bubble Chart With Custom SVG Patterns Example',
        description:
            'A bubble chart built with AG Charts: plot Sahara meteorite landings by location, sized by mass and filled with a custom SVG asteroid pattern. Explore the live example and copy the code.',
        intro: 'This example shows a bubble chart built with AG Charts, plotting meteorite landings across the Sahara by longitude and latitude, sizing each [bubble](/r/bubble-series/) by mass and filling it with a custom SVG asteroid shape using a [pattern fill](/r/fills/). Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'bubble-with-custom-markers': {
        title: 'Bubble Chart With Custom Markers Example | AG Charts',
        h1: 'Bubble Chart With Custom Markers Example',
        description:
            'A bubble chart built with AG Charts: plot seasonal rainfall with a custom rain-drop marker shape and a crosshair label formatted in millimetres. Explore the live example and copy the code.',
        intro: 'This example shows a bubble chart built with AG Charts, plotting rainfall volume on rainy days by season with a custom rain-drop [marker shape](/r/markers/) sized by rainfall, plus a [crosshair](/r/axes-crosshairs/) label that formats the value in millimetres. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'bubble-with-labels': {
        title: 'Bubble Chart With Labels Example | AG Charts',
        h1: 'Bubble Chart With Labels Example',
        description:
            'A bubble chart built with AG Charts: rank the best movies of all time by genre, year and IMDb rating, sized by box office and labelled by rank. Explore the live example and copy the code.',
        intro: 'This example shows a bubble chart built with AG Charts, ranking the best movies of all time by genre, year of release and IMDb rating, sizing each [bubble](/r/bubble-series/) by box office and adding ranked [labels](/r/series-labels/) with a [legend](/r/legend/) for each genre. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'simple-pie': {
        title: 'Pie Chart Example - JavaScript Data Visualization | AG Charts',
        h1: 'Pie Chart Example',
        description:
            'A pie chart built with AG Charts: break down technology revenue by segment with formatted callout labels, sector percentages and a custom tooltip. Explore the live example and copy the code.',
        intro: 'This example shows a pie chart built with AG Charts, breaking down technology revenue by segment with formatted callout labels from the [pie series](/r/pie-series/), sector percentage labels and a custom [tooltip](/r/tooltips/) showing revenue and market share. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'pie-with-variable-radius': {
        title: 'Pie Chart With Variable Radius Example | AG Charts',
        h1: 'Pie Chart With Variable Radius Example',
        description:
            "A pie chart built with AG Charts: compare the Baltic states' population and GDP per capita, with slice radius scaling to GDP per capita. Explore the live example and copy the code.",
        intro: "This example shows a pie chart built with AG Charts, comparing the Baltic states' population and GDP per capita, where each [slice](/r/pie-series/)'s angle represents population while its radius scales with GDP per capita, and sector labels show the formatted GDP share. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).",
    },
    'pie-in-a-donut': {
        title: 'Pie Chart In A Donut Example | AG Charts',
        h1: 'Pie Chart In A Donut Example',
        description:
            'A pie chart nested in a donut built with AG Charts: compare desktop browser market share between 2020 and 2022 with a shared legend and tooltips. Explore the live example and copy the code.',
        intro: 'This example shows a pie chart nested inside a donut built with AG Charts, comparing desktop browser market share between January 2020 as the inner [pie](/r/pie-series/) and September 2022 as the outer [donut](/r/donut-series/), with a shared [legend](/r/legend/) and tooltips that show the change between years. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'simple-donut': {
        title: 'Donut Chart Example - JavaScript Data Visualization | AG Charts',
        h1: 'Donut Chart Example',
        description:
            'A donut chart built with AG Charts: break down UK dwelling fires by property type with a centred total, percentage sector labels and a ranking tooltip. Explore the live example and copy the code.',
        intro: 'This example shows a donut chart built with AG Charts, breaking down UK dwelling fires by property type with the grand total shown as an inner label at the centre of the [donut series](/r/donut-series/), plus percentage [sector labels](/r/series-labels/) and a tooltip ranking each property type. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'donut-with-variable-radius': {
        title: 'Donut Chart With Variable Radius Example | AG Charts',
        h1: 'Donut Chart With Variable Radius Example',
        description:
            'A donut chart built with AG Charts: compare department store category revenue and profit margin, with slice radius scaling to profit margin. Explore the live example and copy the code.',
        intro: "This example shows a donut chart built with AG Charts, comparing department store category revenue and profit margin, where each [slice](/r/donut-series/)'s angle reflects revenue while its radius scales with profit margin, and an inner label displays the total revenue at the centre. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).",
    },
    'multiple-donuts': {
        title: 'Multiple Donut Charts Example | AG Charts',
        h1: 'Multiple Donut Charts Example',
        description:
            'Multiple concentric donut charts built with AG Charts: compare daily water usage per person by country and by continent, each ring with its own tooltip. Explore the live example and copy the code.',
        intro: 'This example shows multiple concentric donut charts built with AG Charts, comparing daily water usage per person by country in the outer ring and by continent in the inner ring, each [donut series](/r/donut-series/) with its own radius, corner radius and [tooltip](/r/tooltips/) renderer. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'multiple-map-shape-series': {
        title: 'Map Chart With Multiple Shape Series Example | AG Charts',
        h1: 'Map Chart With Multiple Shape Series Example',
        description:
            'A world map built with AG Charts: layers six continent-specific shape series onto one topology, with GDP tooltips, zoom and a legend. Explore the live example and copy the code.',
        intro: 'This example shows a world map built with AG Charts, layering six continent-specific [map shape series](/r/map-shapes/) onto a single [topology](/r/map-topology/), with country-level GDP tooltips, [zoom](/r/zoom/) and a [legend](/r/legend/) to toggle each region. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'multiple-map-series': {
        title: 'Multiple Map Chart Series Example - JavaScript Geographic Data | AG Charts',
        h1: 'Multiple Map Chart Series Example',
        description:
            'A travel network map built with AG Charts: combines population-sized markers for islands with ferry and flight route lines. Explore the live example and copy the code.',
        intro: 'This example shows a Greek islands travel network map built with AG Charts, combining population-sized [map markers](/r/map-markers/) for each island with ferry and flight connections drawn as [map lines](/r/map-lines/), styled with dashed strokes, a [legend](/r/legend/) and [zoom](/r/zoom/). Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'map-heatmap-series': {
        title: 'Map Chart with Heatmap Example - JavaScript Geographic Data | AG Charts',
        h1: 'Map Chart with Heatmap Example',
        description:
            'A US GDP heatmap built with AG Charts: colours each state by economic output using a colour scale, gradient legend and custom tooltips. Explore the live example and copy the code.',
        intro: 'This example shows a United States GDP heatmap built with AG Charts, colouring each state by economic output using a [colour scale](/r/colour-scale/) on a [map shape](/r/map-shapes/) series, with a gradient legend and state-level tooltips. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'map-shapes-lines': {
        title: 'Map Chart With Shapes and Lines Example - JavaScript Geographic Data | AG Charts',
        h1: 'Map Chart With Shapes and Lines Example',
        description:
            'A London Underground map built with AG Charts: layers borough shapes beneath colour-coded tube line routes sized by ridership. Explore the live example and copy the code.',
        intro: 'This example shows a London Underground map built with AG Charts, layering faded [map shape](/r/map-shapes/) borough boundaries beneath eleven colour-coded [map line](/r/map-lines/) series sized by daily ridership, with a floating [legend](/r/legend/) for each tube line. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'map-lines-markers': {
        title: 'Map Chart with Lines and Markers Example | AG Charts',
        h1: 'Map Chart with Lines and Markers Example',
        description:
            'A York cycle network map built with AG Charts: overlays cycle lanes and traffic camera markers on a road network background. Explore the live example and copy the code.',
        intro: 'This example shows a York cycle network map built with AG Charts, overlaying [map line](/r/map-lines/) cycle lanes and pin-shaped [map markers](/r/map-markers/) for traffic cameras on top of a road network background, with a floating [legend](/r/legend/). Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'map-kitchen-sink': {
        title: 'Map Chart Kitchen Sink Example - JavaScript Geographic Data | AG Charts',
        h1: 'Map Chart Kitchen Sink Example',
        description:
            'A world currency zones map built with AG Charts: combines shape, line and marker series to plot currencies, cables and financial capitals. Explore the live example and copy the code.',
        intro: 'This example shows a global currency zones map built with AG Charts, combining [map shape](/r/map-shapes/) layers for eight currencies, dashed [map line](/r/map-lines/) submarine cables and [map markers](/r/map-markers/) for capital cities and stock exchanges, all with [zoom](/r/zoom/) and a shared [legend](/r/legend/). Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'simple-org-chart-with-images': {
        title: 'Org Chart With Images Example - JavaScript Hierarchy Diagram | AG Charts',
        h1: 'Org Chart With Images Example',
        description:
            'A team directory org chart built with AG Charts: shows avatar images, country flags and colour-coded working-status labels on each node. Explore the live example and copy the code.',
        intro: 'This example shows a team directory [org chart](/r/org-chart/) built with AG Charts, displaying avatar images and country flags on each node alongside colour-coded working-status labels, with several branches collapsed by default. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'simple-org-chart-with-categories': {
        title: 'Org Chart With Categories Example - JavaScript Hierarchy Diagram | AG Charts',
        h1: 'Org Chart With Categories Example',
        description:
            'A product family org chart built with AG Charts: colours nodes and links by category with dashed strokes marking beta products. Explore the live example and copy the code.',
        intro: 'This example shows a product family [org chart](/r/org-chart/) built with AG Charts, colouring nodes and connecting links by product category and using dashed strokes to flag beta releases, arranged in a horizontal layout. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'org-chart-with-many-nodes': {
        title: 'Org Chart With Many Nodes Example - JavaScript Hierarchy Diagram | AG Charts',
        h1: 'Org Chart With Many Nodes Example',
        description:
            'A large company hierarchy org chart built with AG Charts: switches to a stacked layout at deeper levels with zoom controls for many nodes. Explore the live example and copy the code.',
        intro: 'This example shows a large company hierarchy [org chart](/r/org-chart/) built with AG Charts, switching to a stacked layout from the fifth level deep and adding [zoom](/r/zoom/) controls so visitors can navigate hundreds of nodes. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'quadrant-chart': {
        title: 'Quadrant Chart Example - JavaScript 2x2 Matrix | AG Charts',
        h1: 'Quadrant Chart Example',
        description:
            'An operational risk quadrant chart built with AG Charts: divides assessed likelihood against financial exposure into four labelled response regions. Explore the live example and copy the code.',
        intro: 'This example shows an operational risk [quadrant chart](/r/quadrant-chart/) built with AG Charts, dividing assessed likelihood against financial exposure into four labelled regions around a pivot, with a custom [tooltip](/r/tooltips/) naming the agreed response and the risk owner. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'quadrant-chart-with-size': {
        title: 'Quadrant Chart With Varying Size Example - JavaScript 2x2 Matrix | AG Charts',
        h1: 'Quadrant Chart With Varying Size Example',
        description:
            'A growth-share matrix built with AG Charts: sizes every marker by annual revenue and highlights the invest and divest regions. Explore the live example and copy the code.',
        intro: 'This example shows a growth-share [quadrant chart](/r/quadrant-chart/) built with AG Charts, sizing each product marker by annual revenue and colouring the invest and divest regions, with the axes crossing at the pivot and their labels carried along the crossing lines. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'quadrant-chart-with-large-data': {
        title: 'Quadrant Chart With Large Data Example - JavaScript 2x2 Matrix | AG Charts',
        h1: 'Quadrant Chart With Large Data Example',
        description:
            'A customer health quadrant chart built with AG Charts: spreads 1,000 accounts across four segments by year-on-year usage and revenue change. Explore the live example and copy the code.',
        intro: 'This example shows a customer health [quadrant chart](/r/quadrant-chart/) built with AG Charts, spreading 1,000 accounts across four segments by their year-on-year change in usage and revenue, giving each segment its own marker colour, region label and [highlight](/r/series-highlighting/) style. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'simple-histogram': {
        title: 'Histogram Chart Example - JavaScript Distribution Chart | AG Charts',
        h1: 'Histogram Chart Example',
        description:
            'A vehicle engine size histogram built with AG Charts: bins continuous values with a mean reference line and detailed frequency tooltips. Explore the live example and copy the code.',
        intro: 'This example shows a vehicle engine size [histogram](/r/histogram-series/) built with AG Charts, grouping engine sizes into automatically sized bins with a mean [cross line](/r/axes-cross-lines/) and tooltips showing the vehicle count and percentage per bin. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'histogram-with-specified-bins': {
        title: 'Histogram Chart With Specified Bins Example | AG Charts',
        h1: 'Histogram Chart With Specified Bins Example',
        description:
            'A student exam score histogram built with AG Charts: maps each grade to fixed bin boundaries with area-plotted bars and pattern fills. Explore the live example and copy the code.',
        intro: 'This example shows a student exam score [histogram](/r/histogram-series/) built with AG Charts, mapping each grade boundary to its own fixed bin, drawn as area-plotted bars with alternating pattern [fills](/r/fills/), a [crosshair](/r/axes-crosshairs/) and a bordered [legend](/r/legend/). Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'histogram-with-missing-bins': {
        title: 'Histogram Chart With Missing Bins Example | AG Charts',
        h1: 'Histogram Chart With Missing Bins Example',
        description:
            'A fuel efficiency histogram built with AG Charts: aggregates highway MPG by engine size bin, some left empty, with a reversed axis and range bands. Explore the live example and copy the code.',
        intro: 'This example shows a vehicle fuel efficiency [histogram](/r/histogram-series/) built with AG Charts, aggregating average highway MPG by engine size bin so bins with no data are simply left blank, on a reversed [axis](/r/axes-configuration/) with a [cross line](/r/axes-cross-lines/) and a range band marking the typical efficiency range. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'simple-range-bar': {
        title: 'Range Bar Chart Example - JavaScript Data Visualization | AG Charts',
        h1: 'Range Bar Chart Example',
        description:
            'A financial range bar chart built with AG Charts: plot daily stock trading highs and lows with an average-price reference line. Explore the live example and copy the code.',
        intro: 'This example shows a range bar chart built with AG Charts, plotting the daily high-low trading range of the S&P 500 with rounded [range bars](/r/range-bar-series/), an ordinal-time axis and an average-price [cross line](/r/axes-cross-lines/). Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'range-bar-with-labels': {
        title: 'Range Bar Chart With Labels Example | AG Charts',
        h1: 'Range Bar Chart With Labels Example',
        description:
            'A range bar chart built with AG Charts: compare salary ranges by department with outside labels and a currency formatter. Explore the live example and copy the code.',
        intro: "This example shows a range bar chart built with AG Charts, comparing salary ranges by department with outside [series labels](/r/series-labels/), opacity scaled to each range's size, a currency [formatter](/r/formatters/) and an average-salary [cross line](/r/axes-cross-lines/) shown alongside an axis [crosshair](/r/axes-crosshairs/). Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).",
    },
    'multiple-range-bars': {
        title: 'Range Bar Chart with Multiple Series Example | AG Charts',
        h1: 'Range Bar Chart with Multiple Series Example',
        description:
            'A range bar chart built with AG Charts: compare monthly temperature ranges across continents, highlighting extreme heat and freezing thresholds. Explore the live example and copy the code.',
        intro: 'This example shows a range bar chart built with AG Charts, comparing monthly temperature ranges across continents with one [range bar](/r/range-bar-series/) series per region, a shared tooltip, [series highlighting](/r/series-highlighting/) and reference [cross lines](/r/axes-cross-lines/) marking extreme heat and freezing thresholds. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'horizontal-range-bar': {
        title: 'Horizontal Range Bar Chart Example | AG Charts',
        h1: 'Horizontal Range Bar Chart Example',
        description:
            'A horizontal range bar chart built with AG Charts: compare student exam scores at the start and end of the year against subject reference bands. Explore the live example and copy the code.',
        intro: "This example shows a horizontal range bar chart built with AG Charts, comparing student exam scores at the start and end of the year with [horizontal bars](/r/bars/) and background [cross lines](/r/axes-cross-lines/) marking each subject's range. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).",
    },
    'horizontal-range-bar-with-labels': {
        title: 'Horizontal Range Bar Chart With Labels Example | AG Charts',
        h1: 'Horizontal Range Bar Chart With Labels Example',
        description:
            'A horizontal range bar chart built with AG Charts: track year-on-year sales growth by category with colour-coded bars and growth labels. Explore the live example and copy the code.',
        intro: 'This example shows a horizontal range bar chart built with AG Charts, tracking year-on-year sales growth by product category with conditional [labels](/r/series-labels/) that only appear for a significant change, colours that flip between green and red for growth or decline, and a 2022-average [cross line](/r/axes-cross-lines/). Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'multiple-horizontal-range-bars': {
        title: 'Horizontal Range Bar Charts with Multiple Series Example | AG Charts',
        h1: 'Horizontal Range Bar Charts with Multiple Series Example',
        description:
            'A horizontal range bar chart built with AG Charts: compare import and export volumes by product across countries with a trade-balance tooltip. Explore the live example and copy the code.',
        intro: 'This example shows a horizontal range bar chart built with AG Charts, comparing import and export volumes by product across countries with one [range bar](/r/range-bar-series/) series per country, custom [axis intervals](/r/axes-intervals/) and a [tooltip](/r/tooltips/) that calculates the trade balance. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'simple-range-area': {
        title: 'Range Area Chart Example - JavaScript Data Visualization | AG Charts',
        h1: 'Range Area Chart Example',
        description:
            'A range area chart built with AG Charts: shade the magnitude range of Japanese earthquakes over time, marking major historical events. Explore the live example and copy the code.',
        intro: 'This example shows a range area chart built with AG Charts, shading the magnitude range of Japanese earthquakes over time with smooth interpolation on a [range area series](/r/range-area-series/), point [markers](/r/markers/) and [cross lines](/r/axes-cross-lines/) marking major historical earthquakes. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'range-area-difference-inverted-style': {
        title: 'Range Area Difference Chart With Inverted Style Example | AG Charts',
        h1: 'Range Area Difference Chart With Inverted Style Example',
        description:
            'A range area difference chart built with AG Charts: shade fossil fuel versus renewable generation, darkening whenever fossil fuel takes the lead. Explore the live example and copy the code.',
        intro: 'This example shows a range area difference chart built with AG Charts, shading fossil fuel and renewable electricity generation on a [range area series](/r/range-area-series/) with an inverted style that darkens whenever fossil fuel overtakes renewables, plus distinct [item styling](/r/style-segments/) for the high and low series. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'range-area-with-labels': {
        title: 'Range Area Chart With Labels Example | AG Charts',
        h1: 'Range Area Chart With Labels Example',
        description:
            'A range area chart built with AG Charts: track price divergence between London property types across two stacked series with peak-value labels. Explore the live example and copy the code.',
        intro: 'This example shows a range area chart built with AG Charts, tracking the price divergence between London property types with two stacked [range area series](/r/range-area-series/), a [theme override](/r/themes/) enabling series labels, and conditional [labels](/r/series-labels/) that surface only the peak values. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'simple-waterfall': {
        title: 'Waterfall Chart Example - JavaScript Data Viz | AG Charts',
        h1: 'Waterfall Chart Example',
        description:
            "A waterfall chart built with AG Charts: break down Manchester United's transfer spending and income with styled bars and a floating legend. Explore the live example and copy the code.",
        intro: "This example shows a waterfall chart built with AG Charts, breaking down Manchester United's transfer spending and income on a [waterfall series](/r/waterfall-series/) with separately styled positive and negative bars, opacity scaled to each fee, and a floating [legend](/r/legend/). Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).",
    },
    'horizontal-waterfall': {
        title: 'Horizontal Waterfall Chart Example - JavaScript Data Viz | AG Charts',
        h1: 'Horizontal Waterfall Chart Example',
        description:
            'A horizontal waterfall chart built with AG Charts: break down UK government income and spending with running total and subtotal bars. Explore the live example and copy the code.',
        intro: 'This example shows a horizontal waterfall chart built with AG Charts, breaking down UK government income and spending on a [waterfall series](/r/waterfall-series/) with a running total and a subtotal bar inserted into the sequence, plus a custom [tooltip](/r/tooltips/) for each synthetic total. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'customised-waterfall': {
        title: 'Customised Waterfall Chart Example - JavaScript Data Viz | AG Charts',
        h1: 'Customised Waterfall Chart Example',
        description:
            "A waterfall chart built with AG Charts: track the FTSE 100's daily moves with named gain, loss and net-total bars, and shaded gain/loss zones. Explore the live example and copy the code.",
        intro: "This example shows a waterfall chart built with AG Charts, tracking the FTSE 100's daily percentage moves on a [waterfall series](/r/waterfall-series/) with named gain, loss and net-total items, shaded gain and loss [cross lines](/r/axes-cross-lines/) and custom [formatters](/r/formatters/) for both axes. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).",
    },
    'simple-box-plot': {
        title: 'Box Plot Chart Example - JavaScript Statistical Chart | AG Charts',
        h1: 'Box Plot Chart Example',
        description:
            'A box plot chart built with AG Charts: summarise monthly migration arrivals by country with styled whiskers, caps and a target reference line. Explore the live example and copy the code.',
        intro: 'This example shows a box plot chart built with AG Charts, summarising monthly migration arrivals by country with styled whiskers and caps on a [box plot series](/r/box-plot-series/), a target [cross line](/r/axes-cross-lines/) and a tooltip that calculates the interquartile range. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'multiple-box-plots': {
        title: 'Box Plot Chart with Multiple Series Example | AG Charts',
        h1: 'Box Plot Chart with Multiple Series Example',
        description:
            'A box plot chart built with AG Charts: compare quarterly migration arrivals by country with capless whiskers and a shared quartile tooltip. Explore the live example and copy the code.',
        intro: 'This example shows a box plot chart built with AG Charts, comparing quarterly migration arrivals by country with two [box plot series](/r/box-plot-series/) side by side, capless whiskers and a shared [tooltip](/r/tooltips/) that lists every quartile. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'horizontal-box-plot': {
        title: 'Horizontal Box Plot Chart Example | AG Charts',
        h1: 'Horizontal Box Plot Chart Example',
        description:
            'A horizontal box plot chart built with AG Charts: compare annual pay by role with wrapped labels and reference lines for salary bands. Explore the live example and copy the code.',
        intro: 'This example shows a horizontal box plot chart built with AG Charts, comparing annual compensation distribution by role on a [box plot series](/r/box-plot-series/) with wrapped [axis labels](/r/axes-labels/) and [cross lines](/r/axes-cross-lines/) marking the company median and entry- and senior-level salary bands. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    candlestick: {
        title: 'Candlestick Chart Example - JavaScript Finance | AG Charts',
        h1: 'Candlestick Chart Example',
        description:
            'A candlestick chart built with AG Charts: plots OHLC prices with moving average overlays and a custom tooltip. Explore the live example and copy the code.',
        intro: 'This example shows a candlestick chart built with AG Charts, plotting the open, high, low and close prices of the NASDAQ 100 on a [candlestick series](/r/candlestick-series/) alongside 20 and 50 day moving average lines, with a [custom tooltip](/r/tooltips/) showing daily change and volume, and a floating [legend](/r/legend/). Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'candlestick-hollow': {
        title: 'Hollow Candlestick Chart Example - JavaScript Finance | AG Charts',
        h1: 'Hollow Candlestick Chart Example',
        description:
            'A hollow candlestick chart built with AG Charts: visualises Bitcoin price moves with zoom, crosshairs and price cross lines. Explore the live example and copy the code.',
        intro: "This example shows a hollow candlestick chart built with AG Charts, using transparent up candles and filled down candles on a [candlestick series](/r/candlestick-series/) to visualise Bitcoin's price history, with [zoom](/r/zoom/), [crosshairs](/r/axes-crosshairs/) and [cross lines](/r/axes-cross-lines/) marking key price levels. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).",
    },
    ohlc: {
        title: 'OHLC Chart Example - JavaScript Finance | AG Charts',
        h1: 'OHLC Chart Example',
        description:
            'An OHLC chart built with AG Charts: plots open, high, low and close rates as bars with a tooltip and an average-rate cross line. Explore the live example and copy the code.',
        intro: 'This example shows an OHLC chart built with AG Charts, plotting the USD/GBP exchange rate on an [OHLC series](/r/ohlc-series/) as vertical bars with side ticks, a formatted [crosshair](/r/axes-crosshairs/) and a [cross line](/r/axes-cross-lines/) marking the average rate. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'simple-radar-line': {
        title: 'Radar Line Chart Example - JavaScript Spider Chart | AG Charts',
        h1: 'Radar Line Chart Example',
        description:
            'A radar line chart built with AG Charts: compares department quality, efficiency and satisfaction scores on a circular axis. Explore the live example and copy the code.',
        intro: 'This example shows a radar line chart built with AG Charts, plotting three [radar line](/r/radar-line-series/) series around a circular axis to compare department quality, efficiency and customer satisfaction scores, with percentage-formatted labels and a floating [legend](/r/legend/). Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'radar-with-markers': {
        title: 'Radar Chart With Markers Example | AG Charts',
        h1: 'Radar Chart With Markers Example',
        description:
            'A radar chart built with AG Charts: plots relationship closeness against recognition time using markers and zone cross lines. Explore the live example and copy the code.',
        intro: 'This example shows a radar chart built with AG Charts, plotting closeness against recognition time for a social circle using [markers](/r/markers/) on each [radar line](/r/radar-line-series/) series, with [cross lines](/r/axes-cross-lines/) marking intimate, best friend, friend and acquaintance zones. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'reversed-radar-with-markers': {
        title: 'Reversed Radar Chart With Markers Example | AG Charts',
        h1: 'Reversed Radar Chart With Markers Example',
        description:
            'A reversed radar chart built with AG Charts: inverts the radius scale so closer relationships plot further out, with single tooltips. Explore the live example and copy the code.',
        intro: 'This example shows a reversed radar chart built with AG Charts, plotting recognition time against closeness for friends and acquaintances on a [radar line](/r/radar-line-series/) series with a [reversed radius axis](/r/axes-domain/) so closer relationships sit further from centre, and a single-mode [tooltip](/r/tooltips/). Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'simple-radar-area': {
        title: 'Radar Area Chart Example - JavaScript Spider Chart | AG Charts',
        h1: 'Radar Area Chart Example',
        description:
            'A radar area chart built with AG Charts: fills the area inside a circular axis to compare quality, efficiency and revenue growth. Explore the live example and copy the code.',
        intro: 'This example shows a radar area chart built with AG Charts, filling the area inside a circular axis with three [radar area](/r/radar-area-series/) series to compare department quality, efficiency and revenue growth, with percentage-formatted [tooltips](/r/tooltips/) shown above and below each point. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'radar-area-with-labels': {
        title: 'Radar Area Chart With Labels Example | AG Charts',
        h1: 'Radar Area Chart With Labels Example',
        description:
            'A radar area chart built with AG Charts: labels software and hardware revenue on the chart with shared tooltips. Explore the live example and copy the code.',
        intro: 'This example shows a radar area chart built with AG Charts, comparing quarterly software and hardware revenue on two [radar area](/r/radar-area-series/) series, with [series labels](/r/series-labels/) shown directly on the software series, [markers](/r/markers/) on both series and a shared [tooltip](/r/tooltips/) across quarters. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'reversed-radar-area': {
        title: 'Reversed Radar Area Chart Example | AG Charts',
        h1: 'Reversed Radar Area Chart Example',
        description:
            'A reversed radar area chart built with AG Charts: inverts the radius scale so higher efficiency sits closer to centre, with tiered tooltips. Explore the live example and copy the code.',
        intro: "This example shows a reversed radar area chart built with AG Charts, plotting department efficiency scores on a [radar area](/r/radar-area-series/) series with a [reversed radius axis](/r/axes-domain/) so 100% sits at the centre, rotated labels and a [custom tooltip](/r/tooltips/) that grades each department's performance. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).",
    },
    'simple-nightingale': {
        title: 'Nightingale Chart Example - JavaScript Polar Chart | AG Charts',
        h1: 'Nightingale Chart Example',
        description:
            'A nightingale chart built with AG Charts: sizes each wedge by monthly hardware revenue with an average cross line and custom tooltips. Explore the live example and copy the code.',
        intro: "This example shows a nightingale chart built with AG Charts, sizing each [radial bar](/r/radial-bar-series/) wedge by monthly hardware revenue, with an [animated](/r/animation/) reveal, a [cross line](/r/axes-cross-lines/) marking the average and a custom tooltip showing each month's share and variance. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).",
    },
    'multiple-nightingale-series': {
        title: 'Nightingale Chart with Multiple Series Example | AG Charts',
        h1: 'Nightingale Chart with Multiple Series Example',
        description:
            'A nightingale chart built with AG Charts: compares software, hardware and services revenue with target and range cross lines. Explore the live example and copy the code.',
        intro: 'This example shows a nightingale chart built with AG Charts, plotting three [radial bar](/r/radial-bar-series/) series side by side to compare quarterly software, hardware and services revenue, with shaded [cross line](/r/axes-cross-lines/) bands and a target line, styled through a [theme](/r/themes/) override. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'reversed-nightingale': {
        title: 'Reversed Nightingale Chart Example | AG Charts',
        h1: 'Reversed Nightingale Chart Example',
        description:
            'A reversed nightingale chart built with AG Charts: inverts and rotates the radius axis so higher revenue sits closer to centre. Explore the live example and copy the code.',
        intro: 'This example shows a reversed nightingale chart built with AG Charts, plotting quarterly software revenue on a [radial bar](/r/radial-bar-series/) series with a [reversed radius axis](/r/axes-domain/) positioned at 90 degrees and rotated [axis labels](/r/axes-labels/), using fixed revenue intervals. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'simple-radial-column': {
        title: 'Radial Column Chart Example - JavaScript Polar Chart | AG Charts',
        h1: 'Radial Column Chart Example',
        description:
            'A radial column chart built with AG Charts: wraps quarterly product revenue around a circular axis with a custom tooltip. Explore the live example and copy the code.',
        intro: 'This example shows a radial column chart built with AG Charts, wrapping quarterly [radial column](/r/radial-column-series/) bars around a circular axis with a 50% inner radius, custom [axis labels](/r/axes-labels/) that only show the first month of each quarter, and a formatted [tooltip](/r/tooltips/). Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'grouped-radial-column': {
        title: 'Grouped Radial Column Chart Example | AG Charts',
        h1: 'Grouped Radial Column Chart Example',
        description:
            'A grouped radial column chart built with AG Charts: compares quarterly software, hardware and services revenue as grouped columns. Explore the live example and copy the code.',
        intro: 'This example shows a grouped radial column chart built with AG Charts, plotting three [radial column](/r/radial-column-series/) series side by side to compare quarterly software, hardware and services revenue, with a [legend](/r/legend/) using enlarged markers and colours styled through a [theme](/r/themes/) override. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'reversed-radial-column': {
        title: 'Reversed Radial Column Chart Example | AG Charts',
        h1: 'Reversed Radial Column Chart Example',
        description:
            'A reversed radial column chart built with AG Charts: stacks revenue by product with an inverted radius scale. Explore the live example and copy the code.',
        intro: 'This example shows a reversed radial column chart built with AG Charts, stacking quarterly software, hardware and services revenue on three [radial column](/r/radial-column-series/) series with a [reversed radius axis](/r/axes-domain/) so larger totals sit closer to the centre, and a [legend](/r/legend/) with enlarged markers. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'simple-radial-bar': {
        title: 'Radial Bar Chart Example - JavaScript Polar Chart | AG Charts',
        h1: 'Radial Bar Chart Example',
        description:
            'A radial bar chart built with AG Charts: plot quarterly service revenue as gradient-filled arcs on a three-quarter polar axis with custom tooltips. Explore the live example and copy the code.',
        intro: "This example shows a radial bar chart built with AG Charts, drawing each quarter's services revenue as a gradient-filled arc on a [radial bar series](/r/radial-bar-series/) spanning a three-quarter circle, with a [custom tooltip](/r/tooltips/) formatting the values in millions. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).",
    },
    'stacked-radial-bar': {
        title: 'Stacked Radial Bar Chart Example | AG Charts',
        h1: 'Stacked Radial Bar Chart Example',
        description:
            'A stacked radial bar chart built with AG Charts: stack software, hardware and services revenue into concentric arcs around a small inner radius. Explore the live example and copy the code.',
        intro: 'This example shows a stacked radial bar chart built with AG Charts, stacking software, hardware and services revenue into a single set of arcs using the [radial bar series](/r/radial-bar-series/) with a small donut hole and dashed [grid lines](/r/axes-grid-lines/). Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'reversed-radial-bar': {
        title: 'Reversed Radial Bar Chart Example | AG Charts',
        h1: 'Reversed Radial Bar Chart Example',
        description:
            'A reversed radial bar chart built with AG Charts: reverse both the radius and angle axes and share one tooltip across software, hardware and services. Explore the live example and copy the code.',
        intro: 'This example shows a reversed radial bar chart built with AG Charts, plotting software, hardware and services revenue on [radial bar series](/r/radial-bar-series/) with both axes reversed and a [shared tooltip](/r/tooltips/) across all three. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'simple-sunburst': {
        title: 'Sunburst Chart Example - JavaScript Hierarchy Chart | AG Charts',
        h1: 'Sunburst Chart Example',
        description:
            "A sunburst chart built with AG Charts: show wind farm capacity nested inside countries, with secondary labels and a tooltip showing each country's share. Explore the live example and copy the code.",
        intro: "This example shows a sunburst chart built with AG Charts, nesting wind farm capacity inside its country using the [sunburst series](/r/sunburst-series/), with [secondary labels](/r/series-labels/) converting megawatts to gigawatts and a custom [tooltip](/r/tooltips/) showing each country's share of total capacity. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).",
    },
    'sunburst-with-nesting': {
        title: 'Sunburst Chart with Nesting Example | AG Charts',
        h1: 'Sunburst Chart with Nesting Example',
        description:
            'A sunburst chart built with AG Charts: visualise a webpack dependency tree several levels deep, with file sizes shown in kilobytes on every ring. Explore the live example and copy the code.',
        intro: 'This example shows a sunburst chart built with AG Charts, visualising a webpack dependency tree several levels deep on the [sunburst series](/r/sunburst-series/), with [secondary labels](/r/series-labels/) showing each module size in kilobytes. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'sunburst-with-color-range': {
        title: 'Sunburst Chart with Colour Range Example | AG Charts',
        h1: 'Sunburst Chart with Colour Range Example',
        description:
            'A sunburst chart built with AG Charts: size each ring by sales while colouring it by revenue, using a colour scale and gradient legend. Explore the live example and copy the code.',
        intro: 'This example shows a sunburst chart built with AG Charts, sizing an organisation hierarchy by sales while colouring the rings by revenue on a [colour scale](/r/colour-scale/) with a matching [gradient legend](/r/legend/). Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'simple-treemap': {
        title: 'Treemap Chart Example - JavaScript Hierarchy Chart | AG Charts',
        h1: 'Treemap Chart Example',
        description:
            'A treemap chart built with AG Charts: size tiles by GDP across continents and countries, with a tooltip that totals GDP for each continent group. Explore the live example and copy the code.',
        intro: 'This example shows a treemap chart built with AG Charts, sizing each tile by GDP on a [treemap series](/r/treemap-series/) nested by continent and country, with a custom [tooltip](/r/tooltips/) that totals GDP and counts countries for each continent group. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'treemap-with-nesting': {
        title: 'Treemap Chart with Nesting Example | AG Charts',
        h1: 'Treemap Chart with Nesting Example',
        description:
            'A treemap chart built with AG Charts: nest an organisation chart several levels deep, with semi-transparent, borderless group tiles marking each level. Explore the live example and copy the code.',
        intro: 'This example shows a treemap chart built with AG Charts, nesting an organisation chart several levels deep on the [treemap series](/r/treemap-series/), with semi-transparent, borderless group tiles using [fills and borders](/r/fills-borders/) to mark each level. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'treemap-with-color-range': {
        title: 'Treemap Chart with Colour Range Example | AG Charts',
        h1: 'Treemap Chart with Colour Range Example',
        description:
            'A treemap chart built with AG Charts: size tiles by market cap and colour them by daily change on a diverging colour scale with a gradient legend. Explore the live example and copy the code.',
        intro: 'This example shows a treemap chart built with AG Charts, sizing stock tiles by market capitalisation and colouring them by daily percentage change on a diverging [colour scale](/r/colour-scale/), with a rounded [treemap series](/r/treemap-series/) and matching [gradient legend](/r/legend/). Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'simple-heatmap': {
        title: 'Heatmap Chart Example - JavaScript Matrix Chart | AG Charts',
        h1: 'Heatmap Chart Example',
        description:
            'A heatmap chart built with AG Charts: colour UK monthly temperatures over thirteen years on a diverging colour scale with a classifying tooltip. Explore the live example and copy the code.',
        intro: 'This example shows a heatmap chart built with AG Charts, colouring thirteen years of UK monthly temperatures on a [heatmap series](/r/heatmap-series/) with a diverging [colour scale](/r/colour-scale/) and a custom [tooltip](/r/tooltips/) classifying each cell as cold, moderate or warm. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'heatmap-with-labels': {
        title: 'Heatmap Chart with Labels Example | AG Charts',
        h1: 'Heatmap Chart with Labels Example',
        description:
            'A heatmap chart built with AG Charts: show quarterly revenue values directly on each cell as in-chart labels, with the year axis moved to the right. Explore the live example and copy the code.',
        intro: 'This example shows a heatmap chart built with AG Charts, printing quarterly revenue directly on each cell using [in-chart labels](/r/series-labels/) on the [heatmap series](/r/heatmap-series/), with the year axis repositioned to the right. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'grouped-category-heatmap': {
        title: 'Heatmap Chart with Grouped Category Axis Example | AG Charts',
        h1: 'Heatmap Chart with Grouped Category Axis Example',
        description:
            'A heatmap chart built with AG Charts: group year and quarter into a two-level axis to compare city revenue across grouped time periods. Explore the live example and copy the code.',
        intro: 'This example shows a heatmap chart built with AG Charts, grouping year and quarter into a two-level [grouped category axis](/r/axes-types/) to compare city revenue on a [heatmap series](/r/heatmap-series/), with bold styling applied to the outer depth. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'calendar-heatmap': {
        title: 'Calendar Heatmap Chart Example | AG Charts',
        h1: 'Calendar Heatmap Chart Example',
        description:
            'A calendar-style heatmap chart built with AG Charts: colour weekly step counts across twelve months, with the legend removed for a cleaner grid. Explore the live example and copy the code.',
        intro: 'This example shows a calendar-style heatmap chart built with AG Charts, colouring weekly step counts across twelve months on a [heatmap series](/r/heatmap-series/), with the [legend](/r/legend/) switched off and the month axis moved above the grid. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    sankey: {
        title: 'Sankey Chart Example - JavaScript Flow Diagram | AG Charts',
        h1: 'Sankey Chart Example',
        description:
            "A sankey chart built with AG Charts: trace Apple's earnings from product revenue through costs to gross and operating profit as proportional flows. Explore the live example and copy the code.",
        intro: "This example shows a sankey chart built with AG Charts, tracing Apple's earnings from product revenue through costs to gross and operating profit on a [sankey series](/r/sankey-series/) with centred nodes and inside-edge [labels](/r/series-labels/). Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).",
    },
    'sankey-customisation': {
        title: 'Customised Sankey Chart Example | AG Charts',
        h1: 'Customised Sankey Chart Example',
        description:
            'A customised sankey chart built with AG Charts: style bordered node labels and a stage-aware tooltip for a renewable energy flow to end use. Explore the live example and copy the code.',
        intro: 'This example shows a customised sankey chart built with AG Charts, tracing renewable energy generation through to transmission losses and end use on a [sankey series](/r/sankey-series/) with bordered [labels](/r/series-labels/), styled [fills and borders](/r/fills-borders/) and a stage-aware [tooltip](/r/tooltips/). Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    chord: {
        title: 'Chord Chart Example - JavaScript Flow Diagram | AG Charts',
        h1: 'Chord Chart Example',
        description:
            'A chord chart built with AG Charts: show co-occurrence between front-end technologies as circular ribbons, including self-referencing links. Explore the live example and copy the code.',
        intro: 'This example shows a chord chart built with AG Charts, showing how often front-end technologies co-occur, including self-referencing links, on a [chord series](/r/chord-series/) with a chart-level [formatter](/r/formatters/) abbreviating large counts. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'chord-customisation': {
        title: 'Customised Chord Chart Example | AG Charts',
        h1: 'Customised Chord Chart Example',
        description:
            'A customised chord chart built with AG Charts: scale ribbon opacity by passenger traffic between flight routes, with pointer-anchored tooltips. Explore the live example and copy the code.',
        intro: 'This example shows a customised chord chart built with AG Charts, scaling each ribbon opacity to passenger traffic between international flight routes with an [item styler](/r/stylers/) on the [chord series](/r/chord-series/), and a pointer-anchored [tooltip](/r/tooltips/). Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'simple-funnel': {
        title: 'Funnel Chart Example - JavaScript Conversion Chart | AG Charts',
        h1: 'Funnel Chart Example',
        description:
            'A funnel chart built with AG Charts: visualise stage-by-stage conversion drop-off with adjustable stage spacing and conversion-rate tooltips. Explore the live example and copy the code.',
        intro: 'This example shows a funnel chart built with AG Charts, showing how a total falls away across the stages of a conversion process with an adjustable gap between stages using the [funnel series](/r/funnel-series/) and a [tooltip](/r/tooltips/) that reports the conversion rate at each step. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'customised-funnel': {
        title: 'Customised Funnel Chart Example | AG Charts',
        h1: 'Customised Funnel Chart Example',
        description:
            'A horizontal funnel chart built with AG Charts: colour stages by target achievement, with custom labels and tooltips tracking sales pipeline performance. Explore the live example and copy the code.',
        intro: 'This example shows a horizontal funnel chart built with AG Charts, visualising an enterprise sales pipeline where an [item styler](/r/stylers/) shades each stage by how close it is to target, drop-off segments are styled separately, and [labels](/r/series-labels/) and tooltips report target achievement and overall conversion. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'simple-cone-funnel': {
        title: 'Cone Funnel Chart Example | AG Charts',
        h1: 'Cone Funnel Chart Example',
        description:
            "A cone funnel chart built with AG Charts: taper each stage with dashed, translucent outlines and labels that hide the initial stage's value. Explore the live example and copy the code.",
        intro: 'This example shows a cone funnel chart built with AG Charts, tapering each stage of a conversion process to show how a total falls away, with dashed, semi-transparent [cone funnel](/r/cone-funnel-series/) outlines and a tooltip that reports the conversion rate at each stage. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'simple-pyramid': {
        title: 'Pyramid Chart Example - JavaScript Stage Chart | AG Charts',
        h1: 'Pyramid Chart Example',
        description:
            'A pyramid chart built with AG Charts: stack income brackets sized by population share, with selective labels and percentage tooltips. Explore the live example and copy the code.',
        intro: "This example shows a pyramid chart built with AG Charts, stacking income brackets into a [pyramid series](/r/pyramid-series/) sized by the number of adults in each bracket, with an adjustable aspect ratio and a tooltip that reports each bracket's share of the population. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).",
    },
    'simple-radial-gauge': {
        title: 'Radial Gauge Chart Example - JavaScript KPI Gauge | AG Charts',
        h1: 'Radial Gauge Chart Example',
        description:
            'A radial gauge built with AG Charts: rate a single score against discrete performance bands, from very poor to excellent, on a circular scale. Explore the live example and copy the code.',
        intro: 'This example shows a radial gauge built with AG Charts, showing a single score against its range on a circular scale, with a thick inner radius, discretely coloured [segments](/r/radial-gauge/) for each performance band, and labels mapping each step to a rating from very poor to excellent. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'customised-radial-gauge': {
        title: 'Customised Radial Gauge Chart Example | AG Charts',
        h1: 'Customised Radial Gauge Chart Example',
        description:
            'A radial gauge built with AG Charts: monitor vehicle speed with custom risk segments, a triangular limit target and a live status tooltip. Explore the live example and copy the code.',
        intro: 'This example shows a radial gauge built with AG Charts, monitoring vehicle speed on a wide 270-degree scale with custom segment thresholds for safe, moderate and high-risk speeds, a triangular [target](/r/radial-gauge/) marking the speed limit, and a tooltip reporting the current status and risk level. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'simple-linear-gauge': {
        title: 'Linear Gauge Chart Example - JavaScript KPI Gauge | AG Charts',
        h1: 'Linear Gauge Chart Example',
        description:
            'A linear gauge built with AG Charts: track a chemical concentration reading against colour-coded thresholds and a status tooltip. Explore the live example and copy the code.',
        intro: 'This example shows a linear gauge built with AG Charts, showing a chemical concentration reading against its range on a straight scale, with five labelled [targets](/r/linear-gauge/) marking concentration thresholds, custom stroke colours for the optimal and threshold limits, and a tooltip reporting the current status and range. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'horizontal-linear-gauge': {
        title: 'Horizontal Linear Gauge Chart Example | AG Charts',
        h1: 'Horizontal Linear Gauge Chart Example',
        description:
            'A horizontal linear gauge built with AG Charts: compare a performance score to a target with a gap-to-target tooltip and inside labels. Explore the live example and copy the code.',
        intro: 'This example shows a horizontal linear gauge built with AG Charts, showing a performance score against its range on a straight scale, with a circular [target](/r/linear-gauge/) marker, inside-end value labels, and a tooltip that reports the current category and the gap to target. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'simple-bullet': {
        title: 'Bullet Chart Example - JavaScript KPI Gauge | AG Charts',
        h1: 'Bullet Chart Example',
        description:
            'A set of bullet charts built with AG Charts: compare revenue to target across five sectors using compact linear gauges with target markers. Explore the live example and copy the code.',
        intro: 'This example shows a row of bullet charts built with AG Charts, each a compact [linear gauge](/r/linear-gauge/) comparing year-to-date revenue against a target line for a different sector, with segmented bars and a tooltip reporting revenue against target. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'bar-line-combination': {
        title: 'Bar and Line Combination Example | AG Charts',
        h1: 'Bar and Line Combination Example',
        description:
            'A bar and line combination chart built with AG Charts: compare desktop and phone bars against TV, tablet, radio and billboard trend lines. Explore the live example and copy the code.',
        intro: 'This example shows a bar and line [combination chart](/r/combination-series/) built with AG Charts, drawing bar and dashed line series together on shared axes to compare year-on-year advertising engagement across six channels, with a highlighted category band on hover and a [shared tooltip](/r/tooltips/) positioned over the chart. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'histogram-scatter-combination': {
        title: 'Histogram and Scatter Combination Example | AG Charts',
        h1: 'Histogram and Scatter Combination Example',
        description:
            'A histogram and scatter combination chart built with AG Charts: overlay individual data points on mean highway MPG bars by engine size. Explore the live example and copy the code.',
        intro: 'This example shows a histogram and scatter [combination chart](/r/combination-series/) built with AG Charts, drawing a [histogram series](/r/histogram-series/) of mean highway fuel economy over dashed gridlines, with a [scatter series](/r/scatter-series/) plotting every individual vehicle on the same axes. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'horizontal-range-bar-scatter-combination': {
        title: 'Range Bar and Scatter Combination Example | AG Charts',
        h1: 'Horizontal Range Bar and Scatter Combination Example',
        description:
            'A horizontal range bar and bubble combination chart built with AG Charts: compare smartphone cost and price ranges against profit margin. Explore the live example and copy the code.',
        intro: 'This example shows a horizontal [range bar](/r/range-bar-series/) and bubble combination chart built with AG Charts, drawing production cost and retail price ranges together with profit margin bubbles across three shared axes, complete with a currency-formatted value axis and a footnote explaining the cost basis. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'radar-line-radar-area-nightingale-combination': {
        title: 'Radar Line, Area and Nightingale Combination Example | AG Charts',
        h1: 'Radar Line, Area and Nightingale Combination Example',
        description:
            'A radar line, radar area and nightingale combination chart built with AG Charts: compare departmental efficiency, satisfaction and quality. Explore the live example and copy the code.',
        intro: 'This example shows a [radar line](/r/radar-line-series/), [radar area](/r/radar-area-series/) and [nightingale](/r/nightingale-series/) combination chart built with AG Charts, drawing three series types together on shared angle and radius axes to compare efficiency, customer satisfaction and quality across departments. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'grouped-bar-line-combination': {
        title: 'Grouped Category Axis Combination Example | AG Charts',
        h1: 'Grouped Category Axis Combination Example',
        description:
            'A bar and line combination chart built with AG Charts: compare tech infrastructure and growth metrics across a grouped continent, country and city axis. Explore the live example and copy the code.',
        intro: 'This example shows a bar and line combination chart built with AG Charts, drawing infrastructure bars and growth lines together on a [grouped category axis](/r/axes-types/) that nests continent, country and city, with a secondary y-axis, custom marker shapes and a shared tooltip. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'step-interpolation-combination': {
        title: 'Step Interpolation Combination Example | AG Charts',
        h1: 'Step Interpolation Combination Example',
        description:
            'A range area and line combination chart built with AG Charts: plot UK fuel price indices using step interpolation across current and real terms. Explore the live example and copy the code.',
        intro: 'This example shows a range area and line combination chart built with AG Charts, drawing current gas and electricity prices as a shaded band alongside real-terms price lines, all using [step interpolation](/r/line-series/) to reflect quarterly index changes. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'grouped-category-combination': {
        title: 'Bar, Line and Area Combination Example | AG Charts',
        h1: 'Bar, Line and Area Combination Example',
        description:
            'A bar, line and area combination chart built with AG Charts: compare food calories, blood sugar spike and macronutrients on multiple axes. Explore the live example and copy the code.',
        intro: 'This example shows a bar, line and area combination chart built with AG Charts, drawing calorie, blood sugar and macronutrient series together across three separate [axes](/r/axes-secondary/), with a smoothed blood sugar line, a floating bordered [legend](/r/legend/) and a shared tooltip anchored to the chart. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
    'stacked-bar-area-combination': {
        title: 'Stacked Bar and Area Combination Example | AG Charts',
        h1: 'Stacked Bar and Area Combination Example',
        description:
            'A stacked bar and area combination chart built with AG Charts: track music format revenue against concert ticket sales from 1975 to 2024. Explore the live example and copy the code.',
        intro: 'This example shows a stacked bar and area combination chart built with AG Charts, drawing seven stacked music format series against a step-interpolated concert ticket sales area on a [time axis](/r/axes-time/), with an [item styler](/r/stylers/) that fades bar opacity by revenue value. Get started with [JavaScript](/javascript/quick-start/), [React](/react/quick-start/), [Angular](/angular/quick-start/) or [Vue](/vue/quick-start/).',
    },
};
