---
title: "Legend"
---

A legend makes it easier to tell at a glance which series or series items correspond to which pieces of data. This section describes the legend options and layout behaviour.

## Position and Visibility

A legend can be positioned to any side of a chart using the `position` config:

```js
legend: {
    position: 'right' // 'bottom', 'left', 'top'
}
```

A legend is shown by default but can be hidden using the `enabled` config:

```js
legend: {
    enabled: false
}
```

### Example: Legend Position and Visibility

Notice how when you click on one of the buttons in the example to change the position of the legend:

- the layout of the legend items also changes
- the layout of the chart changes as well, with series moving around and growing/shrinking slightly to accommodate the legend

<chart-example title='Legend Position and Visibility' name='legend-position' type='generated'></chart-example>

## Vertical Layout

Whenever the size of a chart changes, the legend layout is triggered. If the legend is vertical (positioned to the `'right'` or `'left'` of a chart), the layout algorithm tries to use the minimum number of columns possible to render all legend items using current constraints. Notice how the number of columns in a legend increases as the height of a chart shrinks.

### Example: Vertical Legend Layout

<chart-example title='Vertical Legend Layout' name='legend-layout-vertical' type='generated'></chart-example>

## Horizontal Layout

If the legend is horizontal (positioned to the `'bottom'` or `'top'` of a chart), the layout algorithm tries to use the minimum possible number of rows. If a chart is not wide enough, the legend will keep subdividing its items into more rows until everything fits.

### Example: Horizontal Legend Layout

<chart-example title='Horizontal Legend Layout' name='legend-layout-horizontal' type='generated'></chart-example>

## Constraints

In addition to the width and height of the chart, the legend's layout is also affected by the amount of padding between and within the legend items. For example, `legend.item.paddingX` controls the amount of padding between adjacent horizontal legend items:

```js
legend: {
    item: {
        paddingX: 16
    }
}
```

`legend.item.paddingY` controls the amount of padding between adjacent vertical legend items:

```js
legend: {
    item: {
        paddingY: 8
    }
}
```

And the `legend.item.marker.padding` config is responsible for the amount of padding within a legend item, between the marker and the label:

```js
legend: {
    item: {
        marker: {
            padding: 8
        }
    }
}
```

Please refer to the example below to get a better idea of how the above configs affect the legend layout.

### Example: Legend Constraints

<chart-example title='Legend Constraints' name='legend-constraints' type='generated'></chart-example>

## Fonts

There are a number of configs that affect the `fontSize`, `fontStyle`, `fontWeight`, `fontFamily`, and `color` of the legend item labels:

```js
legend: {
    fontSize: 14,
    fontStyle: 'italic',
    fontWeight: 'bold',
    fontFamily: 'Papyrus',
    color: 'red'
}
```

## Markers

### Size and Stroke

All legend items use the same size and stroke width, regardless of the size and stroke width used by the series they represent. It's possible to adjust the defaults using the following configs:

```js
legend: {
    markerSize: 20,
    strokeWidth: 3
}
```

### Shape

Normally, the legend mirrors the marker shapes used by the series, unless the series in question doesn't support markers (for example `'column'` series), in which case the legend will use the `'square'` marker shape for that series.

It's also possible to override the default behaviour and make the legend use a specified marker shape for all legend items, regardless of the shapes the series are using themselves:

```js
legend: {
    markerShape: 'circle' // 'square', 'diamond', 'cross', 'plus', 'triangle'
}
```

## API Reference

<interface-documentation interfaceName='AgChartLegendOptions' overridesrc="charts-api/api.json" config='{ "showSnippets": false }'></interface-documentation>

## Next Up

Continue to the next section to learn about the [series](../series-highlighting/).
