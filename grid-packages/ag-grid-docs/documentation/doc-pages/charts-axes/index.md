---
title: "Axes"
---

This section explains what chart axes are, how to configure and style them, and which axis type to use in which situation.

A chart uses axes to plot data such as categories and values by converting them to screen coordinates. Since any point on the screen is an `(x, y)` pair of coordinates, a chart needs two orthogonal axes to plot the data &mdash; a horizontal axis to determine the `x` position of a point and a vertical axis to determine the `y` position. Axes also show ticks, labels and grid lines to help the user navigate a chart.

The charting library supports three axis types:

- [Category](#category-axis)
- [Number](#number-axis)
- [Time](#time-axis)

Each type is tailored to be used with certain types of data. An axis can be positioned to any side of a chart &mdash; `'top'`, `'right'`, `'bottom'`, or `'left'`. Just like with series, the axes can be specified by setting the corresponding `axes` array property of a chart.

[[note]]
| Axes are only supported in <a href="https://en.wikipedia.org/wiki/Cartesian_coordinate_system" target="blank">cartesian</a> charts, not <a href="https://en.wikipedia.org/wiki/Polar_coordinate_system" target="blank">polar</a>. For example, you can't use axes with pie series.

## Category Axis

The category axis is meant to be used with relatively small datasets of discrete values or categories, such as sales per product, person or quarter, where _product_, _person_ and _quarter_ are categories.

The category axis renders a [tick](#ticks), a [label](#labels) and a [grid line](#grid-lines) for each category, and spaces out all ticks evenly.

The category axis is used as the x-axis by default, positioned at the bottom of a chart.

The simplest category axis config looks like this:

```js
{
    type: 'category',
    position: 'bottom'
}
```

## Number Axis

The number axis is meant to be used as a value axis. While categories are spaced out evenly, the distance between values depends on their magnitude.

Instead of using one tick per value, the number axis will determine the range of all values, round it up and try to segment the rounded range with 10 evenly spaced ticks (unless you configure it differently).

The number axis is used as the y-axis by default, positioned to the left a chart.

Here's the simplest number axis config:

```js
{
    type: 'number',
    position: 'left'
}
```

## Time Axis

The time axis is similar to the number axis in the sense that it is also used to plot continuous values. The time axis can even be used with numeric data (in addition to `Date` objects), but the numbers will be interpreted as Unix timestamps. The time axis differs from the number axis in tick segmentation and label formatting. For example, you could choose to place a tick every 5 minutes, every month, or every Friday.

The time axis also supports specifier strings to control the way time values are presented as labels. For example, the `%H:%M:%S` specifier string will instruct the axis to format a time value like `new Date('Tue Feb 04 202 15:08:03')` or `1580828883000` as `'15:08:03'`. Time axes are typically used as x-axes and placed at the bottom of a chart. The simplest time axis config looks like this:

```js
{
    type: 'time',
    position: 'bottom'
}
```

## Title

Sometimes it may not be obvious what a chart's dimension represents. For example, you might see numbers on a chart's axis and not be able to tell if they're millimetres, percentages, dollars, or something else! It can also be helpful to provide extra information. For example, category axis labels can clearly show people's names, but it might be worth knowing that they are a company's best performing sales people.

Luckily, an axis can have a title just like a chart. In the example below we can use axis titles to point out that:

- the horizontal dimension shows desktop operating systems
- the vertical dimension shows their percentage market share

Please see the [API reference](#reference-axis.title) for axis title styling options like font and colour.

### Example: Axis Title

<chart-example title='Axis Title' name='axis-title' type='generated'></chart-example>

## Ticks

Category axes show a tick for every category. Number and time axes try to segment the whole range into a certain number of intervals (10 by default, giving 11 ticks in total).

The `width`, `size` and `color` of chart axis ticks can be configured as explained in the [API reference](#reference-axis.tick) below. These configs apply to all axis types.

With number and time axes you can additionally set the `count` property:

- In number axes the `count` means the desired number of ticks for the axis to use. Note that this value only serves as a hint and doesn't guarantee that this number of ticks is going to be used.
- In time axes the `count` property can be set to a time interval, for example `agCharts.time.month`, to make an axis show a tick every month.

The example below demonstrates how the `count` property of the number axis can be used to reduce or increase the amount of ticks.

### Example: Axis Ticks

<chart-example title='Axis Tick Styling' name='axis-tick-count' type='generated'></chart-example>

## Labels

The axis renders a label next to every tick to show the tick's value. Chart axis labels support the same font and colour options as the axis title. Additionally, the distance of the labels from the ticks and their rotation can be configured via the `padding` and `rotation` properties respectively.

A label formatter function can be used to change the value displayed in the label. It's a handy feature when you need to show units next to values or format number values to a certain precision, for example.

A label formatter function receives a single `params` object which contains:

- the raw `value` of the label (without the default formatting applied)
- the `index` of the label in the data array
- the number of `fractionDigits`, if the value is a number
- the default label `formatter`, if the axis is a time axis

### Example: Label Formatter

For example, to add `'%'` units next to number values, you can use the following formatter function:

```js
formatter: function(params) {
    return params.value + '%';
}
```

<chart-example title='Axis Label Formatter' name='axis-label-formatter' type='generated'></chart-example>

### Time Label Format String

For time axes, a format string can be provided, which will be used to format the data for display as axis labels. The format string may contain the following directives, which reflect those from Python's <a href="https://strftime.org/" target="_blank">strftime</a>:

- `%a` - abbreviated weekday name.*
- `%A` - full weekday name.*
- `%b` - abbreviated month name.*
- `%B` - full month name.*
- `%c` - the locale’s date and time, such as `%x`, `%X`.*
- `%d` - zero-padded day of the month as a decimal number `[01,31]`.
- `%e` - space-padded day of the month as a decimal number `[ 1,31]`; equivalent to `%_d`.
- `%f` - microseconds as a decimal number `[000000,999999]`.
- `%H` - hour (24-hour clock) as a decimal number `[00,23]`.
- `%I` - hour (12-hour clock) as a decimal number `[01,12]`.
- `%j` - day of the year as a decimal number `[001,366]`.
- `%m` - month as a decimal number `[01,12]`.
- `%M` - minute as a decimal number `[00,59]`.
- `%L` - milliseconds as a decimal number `[000,999]`.
- `%p` - either AM or PM.*
- `%Q` - milliseconds since UNIX epoch.
- `%s` - seconds since UNIX epoch.
- `%S` - second as a decimal number `[00,61]`.
- `%u` - Monday-based (ISO) weekday as a decimal number `[1,7]`.
- `%U` - Sunday-based week of the year as a decimal number `[00,53]`.
- `%V` - ISO 8601 week number of the year as a decimal number `[01, 53]`.
- `%w` - Sunday-based weekday as a decimal number `[0,6]`.
- `%W` - Monday-based week of the year as a decimal number `[00,53]`.
- `%x` - the locale’s date, such as `%-m/%-d/%Y`.*
- `%X` - the locale’s time, such as `%-I:%M:%S %p`.*
- `%y` - year without century as a decimal number `[00,99]`.
- `%Y` - year with century as a decimal number.
- `%Z` - time zone offset, such as `-0700`, `-07:00`, `-07`, or `Z`.
- `%%` - a literal percent sign (%).

Directives marked with an asterisk (*) may be affected by the locale definition.

For `%U`, all days in a new year preceding the first Sunday are considered to be in week 0.<br />
For `%W`, all days in a new year preceding the first Monday are considered to be in week 0.<br />

For `%V`, per the strftime man page:

| In this system, weeks start on a Monday, and are numbered from 01, for the first week, up to 52 or 53, for the last week. Week 1 is the first week where four or more days fall within the new year (or, synonymously, week 01 is: the first week of the year that contains a Thursday; or, the week that has 4 January in it).

The `%` sign indicating a directive may be immediately followed by a padding modifier:

1. `0` - zero-padding
1. `_` - space-padding
1. (nothing) - disable padding

If no padding modifier is specified, the default is `0` for all directives except `%e`, which defaults to `_`.

### Example: Time Label Format

The `label` config of the bottom axis in the example below uses the `'%b&nbsp;%Y'` specifier string for the `format` property to format dates as the abbreviated name of the month followed by the full year.

Notice that the `label.format` property only affects label formatting but not segmentation. The fact that axis labels were configured to show the name of the month and the year doesn't mean that the axis will show a tick every month. To ensure that it does, we also set the `tick.count` config to use the `agCharts.time.month` interval.

<chart-example title='Time Axis Label Format' name='time-axis-label-format' type='generated'></chart-example>

## Grid Lines

Chart axes feature grid lines by default. Grid lines extend from axis ticks on the other side of the axis into the series area, so that it's easy to trace a series item such as a marker to a corresponding tick/label.

Grid lines have the same stroke width as ticks.

Grid lines of each axis can be styled individually via the `gridStyle` config. The config takes an array of objects with two properties:

- `stroke`: colour string in hex, <a href="https://www.w3.org/TR/css-color-4/#typedef-named-color" target="blank">named</a>, rgb, or rgba format.
- `lineDash`: an array of numbers that specify distances to alternately draw a line and a gap. If the number of elements in the array is odd, the elements of the array get copied and concatenated. For example, `[5, 15, 25]` will become `[5, 15, 25, 5, 15, 25]`. If the array is empty, the grid lines will be solid without any dashes.

Each config object in the `gridStyle` array is alternately applied to the grid lines of the axis.

### Example: Grid Lines

<chart-example title='Axis Grid Lines' name='axis-grid-lines' type='generated'></chart-example>

## API Reference

<api-documentation source='charts-api/api.json' section='axis' config='{ "showSnippets": true }'></api-documentation>
