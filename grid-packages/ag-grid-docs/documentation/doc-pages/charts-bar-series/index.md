---
title: "Bar and Column Series"
---

Because bar series are just transposed column series and have the same configuration, this section covers both series at once.

Bar series are a good choice to show values for a discrete set of objects, such as item categories, specific items, or time periods such as years or quarters.

## Column Series

### Regular Columns

To create a column chart, we need to use series type `'column'`. We also have to provide the `xKey` and at least one `yKey`.

A minimal `'column'` series config would therefore look like this:

```js
series: [{
    type: 'column',
    xKey: 'quarter',
    yKey: 'iphone'
}]
```

In the snippet above we are using the `'iphone'` as the only `yKey`, to show revenue per quarter for this product alone. Using this simple series config produces the following chart:

<chart-example title='Regular Column Series' name='regular-column' type='generated'></chart-example>

### Stacked Columns

If the goal is to show the total quarterly revenue for each product category, multiple stacked series can be used
by adding more `column`-type series.

```js
series: [
    { type: 'column', xKey: 'quarter', yKey: 'iphone' },
    { type: 'column', xKey: 'quarter', yKey: 'mac' },
    { type: 'column', xKey: 'quarter', yKey: 'ipad' },
    { type: 'column', xKey: 'quarter', yKey: 'wearables' },
    { type: 'column', xKey: 'quarter', yKey: 'services' },
}]
```

This example demonstrates stacked columns using the example above. Additionally:
- We set `yName` on each series to configure the display names to provide tooltip headers and legend entries.

<chart-example title='Stacked Column Series' name='stacked-column' type='generated'></chart-example>

### Grouped Columns

If we want to show quarterly revenue for each product category as grouped columns, we can simply take the [stacked column](#stacked-columns) config from the example above and set the `grouped` property of the series to `true`:

```js
grouped: true
```

This will produce the following chart:</p>

<chart-example title='Grouped Column Series' name='grouped-column' type='generated'></chart-example>

### Normalized Columns

Going back to our [stacked column](#stacked-columns) example, if we wanted to normalize the totals so that each column's segments added up to a certain value, for example 100%, we could add the following to our series config:

```js
normalizedTo: 100
```

[[note]]
| It's possible to use any non-zero value to normalize to.

<chart-example title='Normalized Column Series' name='normalized-column' type='generated'></chart-example>

### Column Labels

It's possible to add labels to columns, by adding the following to the series config:

```js
label: {}
```

That's it. The config can be empty like that. However, you might want to customise your labels. For example, by default the values are rounded to two decimal places for the labels, but in the example below even that is too much, so we use a label formatter that simply returns the integer part of the number:

```js
label: {
    formatter: function (params) {
        // if the data contains values that are not valid numbers,
        // the formatter's `value` will be `undefined`
        return params.value === undefined ? '' : params.value.toFixed(0);
    }
}
```

The above formatter produces an attractive chart where the labels don't stick out of their columns:

<chart-example title='Column Series with Labels' name='labeled-column' type='generated'></chart-example>

[[note]]
| It's best to avoid using labels with grouped columns (or bars), because columns in grouped mode tend to be narrow and often won't fit a label.

To learn more about label configuration please refer to the [API reference](#reference-bar.label) below.

## Bar Series

`'bar'` series configuration is exactly the same as `'column'` series configuration and all the same modes (regular, stacked, grouped, normalized) apply to bars just as they do to columns.

To create a bar chart all you need to do is use `type: 'bar'` instead of `type: 'column'` in the series config and swap the axes &mdash; the `'category'` axis moves from the bottom to the left of a chart, and the `'number'` axis takes its place instead, moving from the left to the bottom:

```js
axes: [
    {
        type: 'number',
        position: 'bottom'
    },
    {
        type: 'category',
        position: 'left'
    }
]
```

With these simple changes we go from [stacked columns](#stacked-columns) to stacked bars:

<chart-example title='Stacked Bar Series' name='stacked-bar' type='generated'></chart-example>

## API Reference

<interface-documentation interfaceName='AgBarSeriesOptions' overridesrc="charts-api/api.json" config='{ "showSnippets": false }'></interface-documentation>

## Next Up

Continue to the next section to learn about [histogram series](/charts-histogram-series/).
