---
title: "Tooltips"
---

There are four ways of enabling the tooltips in AG Charts by using:

- [default tooltips](#default-tooltip)
- [custom styled tooltips](#styling-the-default-tooltip) via CSS classes
- [custom title / content](#modifying-content--title) via a renderer function
- [completely custom template and markup](#using-custom-tooltips) via a renderer function

## Default Tooltip

The default chart tooltip has the following template:

```html
<div class="ag-chart-tooltip">
    <div class="ag-chart-tooltip-title"></div>
    <div class="ag-chart-tooltip-content"></div>
</div>
```

The title element may or may not exist but the content element is always present. In the screenshots below the content element of both tooltips contains `Jun: 50.00`:

<div style="display: flex; justify-content: center;">
    <image-caption src="resources/tooltip-no-title.png" alt="Tooltip without the title element" width="250px" constrained="true">No Title</image-caption>
    <image-caption src="resources/tooltip-with-title.png" alt="Tooltip with a title element" width="250px" constrained="true">With Title</image-caption>
</div>

To make the tooltip title visible you need to specify the series' `yName`, or `labelName` in the case of `'pie'` series. These configs supply the keys used to fetch the display names, because the keys themselves may not be presentable or descriptive.

### Example: Default Tooltip

In the sample data below the `value1` key is not descriptive, while `hats_made` is not very presentable:


```js
data: [
    {
        month: 'Jun',
        value1: 50,
        hats_made: 40
    },
    // ...
]
```

Notice that when we set the `yName` of the `'column'` series:

- The tooltip title is visible when `yName` config is set, and hidden when the `yName` is reset.
- The `yName` changes are reflected in the legend as well.
- The legend will use the `yKey` when the `yName` is not set. The tooltip however will only have a title if the `yName` (or `title`) is set.

Also note that for numeric values the tooltips show two digits after the decimal point by default.

<chart-example title='Default Tooltip' name='default-tooltip' type='generated'></chart-example>

## Styling the Default Tooltip

The default tooltip already uses `ag-chart-tooltip`, `ag-chart-tooltip-title` and `ag-chart-tooltip-content` CSS classes, but these classes are not meant to be used directly to add custom CSS rules to, unless you want to change the styling of all the tooltips in your app. Instead, users of the charting library should provide their own tooltip class name via the `chart.tooltip.class` config. This class name will be added to the class list of the tooltip element for only that particular chart instance.


For example, if we wanted to set the tooltip's content `background-color` to `gold`, we'd add a custom class name to our chart in the code:


```js
chart.tooltip.class = 'my-tooltip';
```

And then in the CSS:

```css
.my-tooltip .ag-chart-tooltip-content {
    background-color: gold;
}
```

This limits the styling changes to this chart instance alone (or instances that use the same tooltip class). We could style the title element and the container element in the same manner.

Note that your styles don't override the default tooltip styles but complement them.


### Example: Tooltip Styling

In this example we show how to change the content's background color and the color of the tooltip's arrow to gold.

<chart-example title='Default Tooltip with Custom Styling' name='default-tooltip-styling' type='generated'></chart-example>

## Modifying Content / Title

To control what goes into the title and content divs of the tooltip one can set up a tooltip renderer function (one per series) that receives values associated with the highlighted data point and returns an object with the `title` and `content` fields containing plain text or inner HTML that goes into the corresponding divs:


```ts
tooltip: {
    renderer?: (params: AgTooltipRendererParams) => AgTooltipRendererResult;
}

interface AgTooltipRendererResult {
    title?: string;
    content?: string;
}
```

The actual type of the `params` object passed into the tooltip renderer will depend on the series type being used. For example, bar series' tooltip renderer params object will have the following structure:

```ts
interface AgTooltipRendererParams {
    // the element of the series' data represented by the highlighted item
    datum: any;
    // the title of the series, if any
    title?: string;
    // the color of the series
    color?: string;

    // the xKey used to fetch the xValue from the datum, same as series xKey
    xKey: string;
    // the actual xValue used
    xValue?: any;
    // same as series.xName
    xName?: string;

    // the yKey used to fetch the yValue from the datum,
    // equals to the value of `yKey` for one of the elements in the series,
    // depending on which bar inside a stack/group is highlighted
    yKey: string;
    // the actuall yValue used
    yValue?: any;
    // equals to the value of `yName` for one of the elements in the series
    yName?: string;
}
```

Let's say we wanted to remove the digits after the decimal point from the values shown in tooltips.
We could use the following tooltip renderer to achieve that:


```js
tooltip: {
    renderer: function (params) {
        return {
            content: params.yValue.toFixed(0),
            title: params.xValue
        };
    }
}
```

The example below demonstrates the above tooltip renderer in action:

<chart-example title='Modifying Tooltip Content' name='tooltip-content-title' type='generated'></chart-example>

## Using Custom Tooltips

Instead of having the tooltip renderer return an object with title and content strings to be used in the default tooltip template, you can return a string with completely custom markup that will override not just the title and content but the template as well.

Let's say we wanted to remove the digits after the decimal point from the values shown in tooltips (by default the tooltips show two digits after the decimal point for numeric values). We could use the following tooltip renderer to achieve that:


```js
series: [{
    type: 'column',
    tooltip: {
        renderer: function (params) {
            return '<div class="ag-chart-tooltip-title" ' + 'style="background-color:' + params.color + '">' + params.xValue + '</div>' + '<div class="ag-chart-tooltip-content">' + params.yValue + '</div>';
        }
    }
}]
```

The tooltip renderer function receives the `params` object as a single parameter. Inside that object you get the `xValue` and `yValue` for the highlighted data point as well as the reference to the raw `datum` element from the `chart.data` or `series.data` array. You can then process the raw values however you like before using them as a part of the returned HTML string.

[[note]]
| Different series types get different tooltip renderer parameters. You can find out which parameters are supported by which series using the [API reference](#api-reference) below.

The effect of applying the tooltip renderer from the snippet above can be seen in the example below.

### Example: Tooltip Renderer

Notice that the tooltip renderer in the example below:

- Returns two `div` elements, one for the tooltip's title and another for its content.
- The value of the title comes from `params.xValue` which is the name of the month.
- The title element gets its background color from the `params` object. The provided color matches the color of the series.
- The `'Sweaters Made'` value comes from the `params.yValue`, which we then stringify as an integer via `toFixed(0)`.
- We use the default class names on the returned `div` elements, so that our tooltip gets the default styling. You could however add your own classes to the class list, or replace the default CSS classes with your own. The structure of the returned DOM is also up to you, we are just following the convention for this example.

<chart-example title='Column Series with Tooltip Renderer' name='tooltip-renderer' type='generated'></chart-example>

## API Reference

### Bar/Column Tooltips

<interface-documentation interfaceName='AgBarSeriesTooltip' config='{ "showSnippets": false }'></interface-documentation>

### Area Tooltips

<interface-documentation interfaceName='AgAreaSeriesTooltip' config='{ "showSnippets": false }'></interface-documentation>


### Line Tooltips

<interface-documentation interfaceName='AgLineSeriesTooltip' config='{ "showSnippets": false }'></interface-documentation>

### Scatter/Bubble Tooltips

<interface-documentation interfaceName='AgScatterSeriesTooltip' config='{ "showSnippets": false }'></interface-documentation>

### Pie/Doughnut Tooltips

<interface-documentation interfaceName='AgPieSeriesTooltip' config='{ "showSnippets": false }'></interface-documentation>

### Histogram Tooltips

<interface-documentation interfaceName='AgHistogramSeriesTooltip' config='{ "showSnippets": false }'></interface-documentation>

## Next Up

Continue to the next section to learn about [axes](/charts-axes/).

