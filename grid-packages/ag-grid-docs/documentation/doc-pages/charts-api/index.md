---
title: "Options Reference"
---

The `AgChartOptions` interface is the gateway to creating charts.

To initialise a chart, an instance of the `AgChartOptions` is passed to the `AgChart.create()` factory method. Once the chart is initialised, it can be modified using the `AgChart.update()` method.

## Options by Chart Type

An instance of `AgChartOptions` is an essential configuration object required to create a chart with the desired data and attributes.

Properties, formatters and event handlers are all available through the `AgChartOptions` interface. Specifying these on the `options` object will enable fine grained control of charts including registering event listeners and applying styles to individual data points.

The `AgChartOptions` interface is displayed below in an expandable JSON graph, which can be navigated to explore the object structure.

Click through the tabs to see the three main variations of `AgChartOptions` depending on the chart/series type to be rendered.

<tabs>
    <expandable-snippet label="Cartesian" interfaceName='AgCartesianChartOptions' overrideSrc="charts-api/api.json" breadcrumbs='["options"]'></expandable-snippet>
    <expandable-snippet label="Polar" interfaceName='AgPolarChartOptions' overrideSrc="charts-api/api.json" breadcrumbs='["options"]'></expandable-snippet>
    <expandable-snippet label="Hierarchy" interfaceName='AgHierarchyChartOptions' overrideSrc="charts-api/api.json" breadcrumbs='["options"]'></expandable-snippet>
</tabs>

## Creating and Updating Charts Using Options

[[only-javascript]]
| `AgChart` exposes `create()` and `update()` static methods to perform chart initialisation and update respectively.
| Mutations to the previously used `options` object are not automatically picked up by the chart implementation,
| `AgChart.update()` should be called for changes to be applied.
|
| [[note]]
| | NOTE: We expect the options supplied to `AgChart.update()` to be the full configuration to update
| | to, not a partial configuration. If properties or nested objects are missing compared with an
| | earlier `create()`/`update()` call, features may be disabled or defaults assumed as the target
| | configuration.

[[only-frameworks]]
| Options are supplied to the AG Charts component, and mutations of the options trigger an update of the chart configuration.

The following example demonstrates both create and update cases:
- Definition of an `options` object used to create the initial chart state.
- Buttons that invoke mutations of the `options` and trigger update of the chart state.

<chart-example title='Create and Update with AgChartOptions' name='create-update' type='generated'></chart-example>
