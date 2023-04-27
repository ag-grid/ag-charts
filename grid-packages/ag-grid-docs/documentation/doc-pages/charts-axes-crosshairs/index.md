---
title: "Crosshairs"
enterprise: true
---

Crosshairs show a reference line on the chart, along with the corresponding axis value at a specific position.

When hovering over the chart, the crosshairs can either follow the mouse pointer position or snap to the highlighted
item's position to display the axis value at that specific point.

## Enabling Crosshairs

To enable the crosshair feature for a given axis, use the `crosshair` property on the `axes` options object as shown below:

```js
axes: [
  {
    type: "number",
    position: "left",
    crosshair: {
      enabled: true,
    },
  },
]
```

<chart-example title='Basic Crosshair' name='basic-crosshairs' type='generated' options='{ "enterprise": true }'></chart-example> 
 
[Crosshair Example](https://plnkr.co/edit/CIja77MQKhSnePn4?open=main.js)

## Crosshair Snap

By default, the crosshair will snap to the position of the highlighted node.

This default behaviour can be modified by using the crosshair `snap` option. When `snap` is `false`, the crosshair will follow the mouse pointer rather than snapping to the highlighted item.

```js
axes: [
  {
    type: "number",
    position: "bottom",
    crosshair: {
      snap: false,
    },
  },
]
```

[Crosshair Snap False Example](https://plnkr.co/edit/KIZfPMY3yG31rScl?open=main.js)

## Crosshair Styles

Crosshair styles such as `stroke`, `strokeWidth` and `lineDash` are customisable via `AgCrosshairOptions`.

```js
crosshair: {
  stroke: '#7290C4',
  strokeWidth: 2,
  lineDash: [5, 10],
},
```

[Crosshair Styles Example](https://plnkr.co/edit/WWShmKEk4U2EiOoU?open=main.js)

## Crosshair Label

The crosshair label will be displayed along the axis by default. The label can be removed via the crosshair `label` option as shown in the code snippet below:

```js
crosshair: {
  label: {
    enabled: false // removes crosshair label
  }
},
```

## Crosshair Label position

The label position relative to the crosshair can be modified using the `xOffset` and `yOffset` properties in `crosshair.label` options as shown below:

```js
crosshair: {
  label: {
    xOffset: 20, // positions label 20px to the right of the start of the crosshair line
    yOffset: 20, // positions label 20px down from the start of the crosshair line
  }
}
```

[Crosshair Label Offset Example](https://plnkr.co/edit/cMwlh8WT7VSTD1pg?open=main.js)

## Crosshair Label format

The `crosshair.label.format` property can be used to format the crosshair label.

If a format string is not provided, the `axis.label.format` string will be used.

If neither is present, default formatting will be used: one granularity above axis tick fraction digits for number axes and no formatting for category and time axes.

The example below demonstrates this behaviour.

Notice how when you click on one of the buttons in the example to change the provided configuration, the crosshair label format changes.

[Crosshair Label Format](https://plnkr.co/edit/BbqRxe8q057BITE5?open=main.js)

## Crosshair Label Renderer

### Default Label

The default crosshair label is customisable using the crosshair label `renderer` option as shown below:

```js
crosshair: {
  label: {
    renderer: labelRenderer // Add label renderer callback function to customise label styles and content
  }
},
```

- The `renderer` is a callback function which receives the axis `value` and its `fractionDigits` used for formatting the value at the crosshair position.
- It returns an object with the `text` value as well as style attributes including `color`, `backgroundColor` and `opacity` for the crosshair label:

```js
const labelRenderer = ({ value, fractionDigits }) => {
  return {
    text: value.toFixed(fractionDigits),
    color: "aliceBlue",
    backgroundColor: "darkBlue",
    opacity: 0.8,
  }
}
```

[Crosshair Default Label Custom Renderer Styles Example](https://plnkr.co/edit/emFruynNi7HiwDae?open=main.js)

The default label HTML element uses CSS class name `ag-crosshair-label`. Custom CSS styling can be applied by providing a class name via the `crosshair.label.className` config. This class name will be added to the class list of the label's element.

For example, to set the label element's `border-radius` to `15px`, add a custom class name to the crosshair label options:

```js
crosshair: {
  label: {
    className: 'custom-crosshair-label'
  }
},
```

Then modify the style definitions in a stylesheet file:

```css
.custom-crosshair-label {
  border-radius: 15px;
}
```

This is shown in the example below. Note that:

- The default label template is used and the style definitions are overriden in the styles.css file.

[Crosshair Default Label Custom CSS Example](https://plnkr.co/edit/BJ0UoCFvMknL2jN7?open=main.js)

### Custom Label

Alternatively, the `renderer` function could return a `string` representing HTML content, which can be used to provide a completely custom label:

```js
const labelRenderer = ({ value, fractionDigits }) => {
  return `<div class='custom-crosshair-label custom-crosshair-label-arrow'>
            ${value.toFixed(fractionDigits)}</div>`
}
```

The `renderer` function receives a single object with the axis `value` and `fractionDigits`.

The effect of applying the `renderer` from the snippet above can be seen in the example below.

Note that:

- The structure of the returned DOM is up to you.
- The elements have custom CSS class attributes, but the default class names can also be used so that the label gets the default styling.
- The styles for the elements are defined in the external styles.css file.

[Crosshair Custom Label Style Example](https://plnkr.co/edit/7uBJFVUN75sL625M?open=main.js)
