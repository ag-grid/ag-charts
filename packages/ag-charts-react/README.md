<picture><source media="(prefers-color-scheme: dark)" srcset="./.github/banner-dark.png"><source media="(prefers-color-scheme: light)" srcset="./.github/banner-light.png"><img alt="AG Charts canvas-based charting trusted by the community, built for enterprise." src="./.github/banner-light.png"></picture>

[![Github Stars](https://img.shields.io/github/stars/ag-grid/ag-charts?style=social)](https://github.com/ag-grid/ag-charts) [![Twitter](https://img.shields.io/twitter/follow/ag_grid?style=social)](https://twitter.com/ag_grid)

| Module               |                                                                                                                                                                                                                                                                                                        Info |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
| ag-charts-community  | [![npm](https://img.shields.io/npm/dm/ag-charts-community)](https://www.npmjs.com/package/ag-charts-community) <br> [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=ag-charts-community&metric=alert_status)](https://sonarcloud.io/dashboard?id=ag-charts-community) <br> |
| ag-charts-enterprise |    [![npm](https://img.shields.io/npm/dm/ag-charts-enterprise)](https://www.npmjs.com/package/ag-charts-enterprise) <br> [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=ag-charts-community&metric=alert_status)](https://sonarcloud.io/dashboard?id=ag-charts-community) |
| ag-charts-react      |                                                                                  [![npm](https://img.shields.io/npm/dm/ag-charts-react.svg)](https://www.npmjs.com/package/ag-charts-react) <br> [![npm](https://img.shields.io/npm/dt/ag-charts-react.svg)](https://www.npmjs.com/package/ag-charts-react) |

AG Charts React

AG Charts is a fully-featured and highly customizable JavaScript charting library. The professional choice for developers building enterprise applications.

It delivers outstanding performance, has no third-party dependencies and [integrates smoothly with all major JavaScript frameworks](https://charts.ag-grid.com/react/supported-frameworks/?utm_source=ag-grid-readme&utm_medium=repository&utm_campaign=github).

## Examples

<a href="https://charts.ag-grid.com/gallery/?utm_source=ag-grid-readme&utm_medium=repository&utm_campaign=github"><picture><source media="(prefers-color-scheme: dark)" srcset="./.github/example-1-dark.png"><source media="(prefers-color-scheme: light)" srcset="./.github/example-1-light.png"><img alt="Images from our gallery" src="./.github/example-1-light.png"></picture></a>

## Features

Here are some of the features that make AG Charts stand out:

-   Modern, lightweight and performant.
-   Framework agnostic:
    -   thin reactive wrappers for your chosen framework: React, Angular, Vue;
    -   or use our plain Javascript API with 1st-class Typescript support.
-   Zero dependencies.
-   Simple & clean declarative configuration.
-   Comprehensive interactive documentation.

<table>
    <thead>
        <th colspan="2">
            Supported Chart Types
        </th>
        <th colspan="2">
            Advanced Features
        </th>
    </thead>
    <tbody>
        <tr>
            <td>
                <a href="https://charts.ag-grid.com/react/line-series/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github">Line</a>, <a href="https://charts.ag-grid.com/react/bar-series/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github">Bar</a> & <a href="https://charts.ag-grid.com/react/area-series/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github">Area</a><br/>
                <a href="https://charts.ag-grid.com/react/scatter-series/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github">Scatter</a> & <a href="https://charts.ag-grid.com/react/bubble-series/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github">Bubble</a><br/>
                <a href="https://charts.ag-grid.com/react/pie-series/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github">Pie</a> & <a href="https://charts.ag-grid.com/react/donut-series/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github">Donut</a><br/>
                <a href="https://charts.ag-grid.com/react/histogram-series/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github">Histogram</a>*<br/>
                <a href="https://charts.ag-grid.com/react/maps/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github">Map</a>*<br/>
                <a href="https://charts.ag-grid.com/react/candlestick-series/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github">Candlestick</a> & <a href="https://charts.ag-grid.com/react/ohlc-series/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github">OHLC</a>*<br/>
                <a href="https://charts.ag-grid.com/react/box-plot-series/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github">Box Plot</a>*<br/>
            </td>
            <td>
                <a href="https://charts.ag-grid.com/react/heatmap-series/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github">Heatmap</a>*<br/>
                <a href="https://charts.ag-grid.com/react/nightingale-series/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github">Nightingale</a>*<br/>
                <a href="https://charts.ag-grid.com/react/range-bar-series/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github">Range Bar</a>* & <a href="https://charts.ag-grid.com/react/range-area-series/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github">Range Area</a>*<br/>
                <a href="https://charts.ag-grid.com/react/radar-area-series/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github">Radar Area</a>* & <a href="https://charts.ag-grid.com/react/radar-line-series/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github">Radar Line</a>*<br/>
                <a href="https://charts.ag-grid.com/react/radial-bar-series/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github">Radial Bar</a>* & <a href="https://charts.ag-grid.com/react/radial-column-series/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github">Radial Column</a>*<br/>
                <a href="https://charts.ag-grid.com/react/sunburst-series/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github">Sunburst*</a> & <a href="https://charts.ag-grid.com/react/treemap-series/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github">Treemap</a>*<br/>
                <a href="https://charts.ag-grid.com/react/bullet-series/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github">Bullet</a>*<br/>
            </td>
            <td>
                <a href="https://charts.ag-grid.com/react/animation/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github">Animation</a>*<br/>
                <a href="https://charts.ag-grid.com/react/accessibility/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github">Accessibility</a><br/>
                <a href="https://charts.ag-grid.com/react/sync/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github">Synchronized Charts</a>*<br/>
                <a href="https://charts.ag-grid.com/react/context-menu/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github">Context Menu</a>*<br/>
                <a href="https://charts.ag-grid.com/react/axes-crosshairs/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github">Crosshairs</a>*<br/>
                <a href="https://charts.ag-grid.com/react/axes-cross-lines/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github">Cross Lines </a><br/>
                <a href="https://charts.ag-grid.com/react/error-bars/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github">Error Bars</a>*<br/>
            </td>
            <td>
                <a href="https://charts.ag-grid.com/react/themes/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github">Theming</a><br/>
                <a href="https://charts.ag-grid.com/react/zoom/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github">Zoom</a>*<br/>
                <br/>
                <br/>
                <br/>
                <br/>
                <br/>
            </td>
        </tr>
    </tbody>
</table>
<br/>

\* These are available in the [Enterprise version](https://charts.ag-grid.com/license-pricing/?utm_source=ag-grid-readme&utm_medium=repository&utm_campaign=github) only.

Check out the [developer documentation](https://charts.ag-grid.com/react/?utm_source=ag-grid-readme&utm_medium=repository&utm_campaign=github) for a complete list of features or visit [our official docs](https://charts.ag-grid.com/?utm_source=ag-grid-readme&utm_medium=repository&utm_campaign=github) for tutorials and feature demos.

## Getting started

Get started with [React](https://charts.ag-grid.com/react/quick-start/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github).

Installation for [React](https://charts.ag-grid.com/react/installation/).

## Issue Reporting

If you have found a bug, please report it in this repository's [issues](https://github.com/ag-grid/ag-charts/issues) section. If you're using the Enterprise version, please use the [private ticketing](https://ag-grid.zendesk.com/) system to do that.

## Asking Questions

Look for similar problems on [StackOverflow](https://stackoverflow.com/questions/tagged/ag-charts) using the `ag-charts` tag. If nothing seems related, post a new message there. Please do not use GitHub issues to ask questions. If you're using the Enterprise version, please use the [private ticketing](https://ag-grid.zendesk.com/) system to do that.

## Contributing

AG Charts is developed by a team of co-located developers in London. If you want to join the team send your application to info@ag-grid.com.

## License

This project is licensed under the MIT license. See the [LICENSE file](./LICENSE.txt) for more info.
