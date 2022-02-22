---
title: "Pie and Doughnut Series"
---

This section shows how to create pie charts.

Pie series are used for showing how parts relate to the whole, for example if you want to show the market share of each competitor.

## Basic Configuration

To plot a basic pie all we need is an array of values that will determine the angle of each pie slice. The total of all values will correspond to the full pie.

A basic pie series configuration is shown below:

```js
series: [{
    type: 'pie',
    angleKey: 'value'
}]
```
This results in the chart shown below. Note that [tooltips](/charts-tooltips/) show the absolute value of each pie slice.

<chart-example title='Basic Pie Chart' name='basic-pie' type='generated'></chart-example>

## Slice Labels

In the example above there's no legend or labels next to pie slices. To show those, the label information must be in the `data`. Additionally, we'll have to provide the `labelKey`:

```diff
series: [{
    type: 'pie',
    angleKey: 'value',
+   labelKey: 'label'
}]
```

Now we get labels, a legend, and the tooltips will also show labels along with the values:

<chart-example title='Pie Chart with Labels' name='pie-labels' type='generated'></chart-example>

Each individual slice can be toggled on and off via the legend.

You might notice that not all of the slices in the chart above have a label. The reason for this is that certain slices can be small, and if there's a cluster of small slices their labels will overlap, resulting in a messy chart. To prevent this from happening the series will only show labels for slices with an angle greater than a certain value, which by default is set to be `20` degrees. This value is adjustable via the `label.minAngle` config:


```js
label: {
    minAngle: 20
}
```

The label's callout can be configured to have a different `length`, `color` and `strokeWidth`, for example:

```js
callout: {
    colors: 'red',
    length: 20,
    strokeWidth: 3
}
```

Please check the [API reference](#api-reference) below to learn more about `label` and `callout`, as well as other series configuration.

## Variable Slice Radius

Let's say you have the data for both the market share of mobile operating systems and the level of user satisfaction with each OS. We could represent the satisfaction level as the radius of a slice using the `radiusKey` config like so:

```js
series: [{
    type: 'pie',
    labelKey: 'os',
    angleKey: 'share',
    radiusKey: 'satisfaction'
}]
```

A pie chart where slices can have different radii is also known as a **rose chart**.

<chart-example title='Slices with Different Radii' name='slice-radius' type='generated'></chart-example>

## Doughnuts

Pie series can be used to create a doughnut chart by using the `innerRadiusOffset` config.

```js
series: [{
    type: 'pie',
    labelKey: 'os',
    angleKey: 'share',
    innerRadiusOffset: -70
}]
```

The config specifies the offset value from the maximum pie radius which all pie slices use by default (the maximum pie series radius is determined automatically by the chart depending on the chart's dimensions). `-70` in the snippet above means the inner radius of the series should be 70 pixels smaller than the maximum radius.

<chart-example title='Doughnut Chart' name='doughnut-chart' type='generated'></chart-example>

## Multiple Doughnuts

As well as the `innerRadiusOffset` we can also configure the `outerRadiusOffset`. This gives us the ability to render multiple pie series in a single chart without overlapping.

```js
series: [
    {
        type: 'pie',
        outerRadiusOffset: 0, // default
        innerRadiusOffset: -40,
        ...
    },
    {
        type: 'pie',
        outerRadiusOffset: -100,
        innerRadiusOffset: -140,
        ...
    }
]
```

In the snippet above we configure the `outerRadiusOffset` of the second (inner) series to be smaller than the `innerRadiusOffset` of the first (outer) series. The difference of `60` between these offsets will determine the size of the gap between the outer and inner series. The difference between `outerRadiusOffset` and `innerRadiusOffset` for each series will determine the thickness of the rings, which will be `40` for both series in this case.

The example below uses one pie series to plot the market share of each operating system and another pie series to plot user satisfaction level with each OS:

<chart-example title='Multi-Doughnut Chart' name='multi-doughnut' type='generated'></chart-example>

## API Reference

<interface-documentation interfaceName='AgPieSeriesOptions' overridesrc="charts-api/api.json" config='{ "showSnippets": false }'></interface-documentation>

## Next Up

Continue to the next section to learn about [treemap](../treemap-series/).
