# Vue3 Charting Library

<div align="center">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/ag-grid/ag-grid/blob/latest/documentation/ag-grid-docs/public/images/ag-logos/svg-logos/AG-Charts-Logo_Dark-Theme.svg?raw=true"/>
      <source media="(prefers-color-scheme: light)" srcset="https://github.com/ag-grid/ag-grid/blob/latest/documentation/ag-grid-docs/public/images/ag-logos/svg-logos/AG-Charts-Logo_Light-Theme.svg?raw=true"/>
      <img width="100%" alt="AG Charts Logo" src="https://github.com/ag-grid/ag-grid/blob/latest/documentation/ag-grid-docs/public/images/ag-logos/svg-logos/AG-Charts-Logo_Light-Theme.svg?raw=true"/>
    </picture>
    <div align="center">
        <h4><a href="https://ag-grid.com/charts/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github">🌐 Website</a> • <a href="https://ag-grid.com/charts/vue/quick-start/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github">📖 Documentation</a> • <a href="https://ag-grid.com/charts/gallery/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github">📊 Gallery</a></h4>
    </div>
    <br>
    <a href="https://github.com/ag-grid/ag-charts/releases">
        <img src="https://img.shields.io/github/v/release/ag-grid/ag-charts?style=for-the-badge" alt="GitHub Release">
    </a>
    <a href="https://www.npmjs.com/package/ag-charts-vue3">
        <img src="https://img.shields.io/npm/dm/ag-charts-vue3?style=for-the-badge" alt="NPM Downloads">
    </a>
    <a href="https://github.com/ag-grid/ag-charts">
        <img src="https://img.shields.io/github/stars/ag-grid/ag-charts?style=for-the-badge" alt="GitHub Repo stars">
    </a>
    <a href="https://github.com/ag-grid/ag-charts">
        <img alt="GitHub forks" src="https://img.shields.io/github/forks/ag-grid/ag-charts?style=for-the-badge">
    </a>
    <br><br>
    <a href="https://sonarcloud.io/dashboard?id=ag-charts-community">
      <img src="https://sonarcloud.io/api/project_badges/measure?project=ag-charts-community&metric=alert_status" alt="Quality Gate Status">
    </a>
    <a href="https://npm.io/package/ag-charts-vue3">
        <img src="https://img.shields.io/npms-io/maintenance-score/ag-grid-community" alt="npms.io Maintenance Score">
    </a>
    <a href="https://github.com/ag-grid/ag-charts/graphs/commit-activity">
        <img src="https://img.shields.io/github/commit-activity/m/ag-grid/ag-charts" alt="GitHub commit activity">
    </a>
    <a href="https://github.com/ag-grid/ag-charts/network/dependents">
        <img src="https://img.shields.io/librariesio/dependents/npm/ag-charts-vue3" alt="Dependents (via libraries.io?style=for-the-badge)">
    </a>
    <br><br>
    <!-- START MAIN DESCRIPTION -->
	<p>AG Charts is a <strong>fully-featured</strong> and <strong>highly customizable</strong> canvas-based  Vue3 Charting library. It delivers <strong>outstanding performance</strong> and has <strong>no third-party dependencies</strong>.</p>	
<!-- END MAIN DESCRIPTION -->
    <br>
</div>

<picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://github.com/ag-grid/ag-charts/blob/latest/packages/ag-charts-website/public/images/readme-assets/gallery-dark.gif?raw=true"/>
    <source media="(prefers-color-scheme: light)" srcset="https://github.com/ag-grid/ag-charts/blob/latest/packages/ag-charts-website/public/images/readme-assets/gallery.gif?raw=true"/>
    <img width="100%" alt="Preview of AG Charts  Vue3 Charting Examples" src="https://github.com/ag-grid/ag-charts/blob/latest/packages/ag-charts-website/public/images/readme-assets/gallery.gif?raw=true"/>
</picture>
<div align="right">
    <a href="https://ag-grid.com/charts/gallery/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github"><br><img alt="Static Badge" src="https://img.shields.io/badge/View%20Gallery-blue?style=for-the-badge&logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOIiAiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkIj4KDTwhLS0gVXBsb2FkZWQgdG86IFNWRyBSZXBvLCB3d3cuc3ZncmVwby5jb20sIFRyYW5zZm9ybWVkIGJ5OiBTVkcgUmVwbyBNaXhlciBUb29scyAtLT4KPHN2ZyB3aWR0aD0iODAwcHgiIGhlaWdodD0iODAwcHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KDTxnIGlkPSJTVkdSZXBvX2JnQ2FycmllciIgc3Ryb2tlLXdpZHRoPSIwIi8%2BCg08ZyBpZD0iU1ZHUmVwb190cmFjZXJDYXJyaWVyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KDTxnIGlkPSJTVkdSZXBvX2ljb25DYXJyaWVyIj4gPHBhdGggZD0iTTE4IDIwLjc1SDZDNS4yNzA2NSAyMC43NSA0LjU3MTE4IDIwLjQ2MDMgNC4wNTU0NiAxOS45NDQ1QzMuNTM5NzMgMTkuNDI4OCAzLjI1IDE4LjcyOTMgMy4yNSAxOFY2QzMuMjUgNS4yNzA2NSAzLjUzOTczIDQuNTcxMTggNC4wNTU0NiA0LjA1NTQ2QzQuNTcxMTggMy41Mzk3MyA1LjI3MDY1IDMuMjUgNiAzLjI1SDEyQzEyLjE5ODkgMy4yNSAxMi4zODk3IDMuMzI5MDIgMTIuNTMwMyAzLjQ2OTY3QzEyLjY3MSAzLjYxMDMyIDEyLjc1IDMuODAxMDkgMTIuNzUgNEMxMi43NSA0LjE5ODkxIDEyLjY3MSA0LjM4OTY4IDEyLjUzMDMgNC41MzAzM0MxMi4zODk3IDQuNjcwOTggMTIuMTk4OSA0Ljc1IDEyIDQuNzVINkM1LjY2ODQ4IDQuNzUgNS4zNTA1NCA0Ljg4MTcgNS4xMTYxMiA1LjExNjEyQzQuODgxNyA1LjM1MDU0IDQuNzUgNS42Njg0OCA0Ljc1IDZWMThDNC43NSAxOC4zMzE1IDQuODgxNyAxOC42NDk1IDUuMTE2MTIgMTguODgzOUM1LjM1MDU0IDE5LjExODMgNS42Njg0OCAxOS4yNSA2IDE5LjI1SDE4QzE4LjMzMTUgMTkuMjUgMTguNjQ5NSAxOS4xMTgzIDE4Ljg4MzkgMTguODgzOUMxOS4xMTgzIDE4LjY0OTUgMTkuMjUgMTguMzMxNSAxOS4yNSAxOFYxMkMxOS4yNSAxMS44MDExIDE5LjMyOSAxMS42MTAzIDE5LjQ2OTcgMTEuNDY5N0MxOS42MTAzIDExLjMyOSAxOS44MDExIDExLjI1IDIwIDExLjI1QzIwLjE5ODkgMTEuMjUgMjAuMzg5NyAxMS4zMjkgMjAuNTMwMyAxMS40Njk3QzIwLjY3MSAxMS42MTAzIDIwLjc1IDExLjgwMTEgMjAuNzUgMTJWMThDMjAuNzUgMTguNzI5MyAyMC40NjAzIDE5LjQyODggMTkuOTQ0NSAxOS45NDQ1QzE5LjQyODggMjAuNDYwMyAxOC43MjkzIDIwLjc1IDE4IDIwLjc1WiIgZmlsbD0iI2ZmZmZmZiIvPiA8cGF0aCBkPSJNMjAgOC43NUMxOS44MDE5IDguNzQ3NDEgMTkuNjEyNiA4LjY2NzU2IDE5LjQ3MjUgOC41Mjc0N0MxOS4zMzI0IDguMzg3MzcgMTkuMjUyNiA4LjE5ODExIDE5LjI1IDhWNC43NUgxNkMxNS44MDExIDQuNzUgMTUuNjEwMyA0LjY3MDk4IDE1LjQ2OTcgNC41MzAzM0MxNS4zMjkgNC4zODk2OCAxNS4yNSA0LjE5ODkxIDE1LjI1IDRDMTUuMjUgMy44MDEwOSAxNS4zMjkgMy42MTAzMiAxNS40Njk3IDMuNDY5NjdDMTUuNjEwMyAzLjMyOTAyIDE1LjgwMTEgMy4yNSAxNiAzLjI1SDIwQzIwLjE5ODEgMy4yNTI1OSAyMC4zODc0IDMuMzMyNDQgMjAuNTI3NSAzLjQ3MjUzQzIwLjY2NzYgMy42MTI2MyAyMC43NDc0IDMuODAxODkgMjAuNzUgNFY4QzIwLjc0NzQgOC4xOTgxMSAyMC42Njc2IDguMzg3MzcgMjAuNTI3NSA4LjUyNzQ3QzIwLjM4NzQgOC42Njc1NiAyMC4xOTgxIDguNzQ3NDEgMjAgOC43NVoiIGZpbGw9IiNmZmZmZmYiLz4gPHBhdGggZD0iTTEzLjUgMTEuMjVDMTMuMzA3MSAxMS4yMzUyIDEzLjEyNzYgMTEuMTQ1NSAxMyAxMUMxMi44NzcgMTAuODYyNSAxMi44MDkgMTAuNjg0NSAxMi44MDkgMTAuNUMxMi44MDkgMTAuMzE1NSAxMi44NzcgMTAuMTM3NSAxMyAxMEwxOS41IDMuNUMxOS41Njg3IDMuNDI2MzEgMTkuNjUxNSAzLjM2NzIxIDE5Ljc0MzUgMy4zMjYyMkMxOS44MzU1IDMuMjg1MjMgMTkuOTM0OCAzLjI2MzE5IDIwLjAzNTUgMy4yNjE0MUMyMC4xMzYyIDMuMjU5NjMgMjAuMjM2MiAzLjI3ODE2IDIwLjMyOTYgMy4zMTU4OEMyMC40MjMgMy4zNTM2IDIwLjUwNzggMy40MDk3NCAyMC41NzkgMy40ODA5NkMyMC42NTAzIDMuNTUyMTggMjAuNzA2NCAzLjYzNzAxIDIwLjc0NDEgMy43MzA0QzIwLjc4MTggMy44MjM3OSAyMC44MDA0IDMuOTIzODIgMjAuNzk4NiA0LjAyNDUyQzIwLjc5NjggNC4xMjUyMyAyMC43NzQ4IDQuMjI0NTQgMjAuNzMzOCA0LjMxNjU0QzIwLjY5MjggNC40MDg1NCAyMC42MzM3IDQuNDkxMzQgMjAuNTYgNC41NkwxNCAxMUMxMy44NzI0IDExLjE0NTUgMTMuNjkyOSAxMS4yMzUyIDEzLjUgMTEuMjVaIiBmaWxsPSIjZmZmZmZmIi8%2BIDwvZz4KDTwvc3ZnPg%3D%3D">
</a>
</div>

## 📖 Overview

<details>
  <summary><strong>Table of Contents</strong></summary>

-   [📖 Overview](#-overview)
    -   [Chart Types](#chart-types)
    -   [Features](#features)
    -   [Financial Charts](#financial-charts)
    -   [Map Charts](#map-charts)
-   [⚡️ Quick Start](#️-quick-start)
    -   [Installation](#installation)
    -   [Setup](#setup)
-   [🤝 Support](#-support)
    -   [Enterprise Support](#enterprise-support)
    -   [Bug Reports](#bug-reports)
    -   [Questions](#questions)
    -   [Contributing](#contributing)
-   [⚠️ License](#️-license)

</details>

AG Charts is available in two versions: Community & Enterprise.

-   `ag-charts-community` is free, available under the MIT license, and comes with core series types, such as [Pie](https://ag-grid.com/charts/vue/pie-series/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github), [Area](https://ag-grid.com/charts/vue/area-series/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github), [Bar](https://ag-grid.com/charts/vue/bar-series/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github), [Scatter](https://ag-grid.com/charts/vue/scatter-series/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github) and [Bubble](https://ag-grid.com/charts/vue/bubble-series/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github) in addition to all of the key features expected from a Vue3 charting library, including [Accessibility](https://ag-grid.com/charts/vue/accessibility/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github), [Tooltips](https://ag-grid.com/charts/vue/tooltips/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github), [Themes](https://ag-grid.com/charts/vue/themes/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github), [Markers](https://ag-grid.com/charts/vue/markers/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github), [Legends](https://ag-grid.com/charts/vue/legend/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github), [Axis Types](https://ag-grid.com/charts/vue/axes-types/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github) and [Secondary Axes](https://ag-grid.com/charts/vue/axes-secondary/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github).
-   `ag-charts-enterprise` is available under a commercial license and comes with additional series types, such as [Maps](https://ag-grid.com/charts/vue/maps/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github), [Sankey](https://ag-grid.com/charts/vue/sankey-series/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github), [Radar](https://ag-grid.com/charts/vue/radar-area-series/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github), and [Waterfall](https://ag-grid.com/charts/vue/waterfall-series/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github) Charts as well as advanced interactivity features, like [Animations](https://ag-grid.com/charts/vue/animation/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github), [Context Menus](https://ag-grid.com/charts/vue/context-menu/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github), [Zooming](https://ag-grid.com/charts/vue/zoom/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github), [Navigators](https://ag-grid.com/charts/vue/navigator/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github), [Synchronization](https://ag-grid.com/charts/vue/sync/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github) and much more, including [Financial Charts](https://ag-grid.com/charts/vue/financial-charts/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github).

### Features & Chart Types

#### Chart Types

AG Charts offers 20+ Vue3 Chart types, each of which are fully customisable:

| Chart Type                                                                                                                                  | AG Charts Community | AG Charts Enterprise |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | -------------------- |
| [Bar](https://ag-grid.com/charts/vue/bar-series/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github)                     | ✅                  | ✅                   |
| [Line](https://ag-grid.com/charts/vue/line-series/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github)                   | ✅                  | ✅                   |
| [Area](https://ag-grid.com/charts/vue/area-series/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github)                   | ✅                  | ✅                   |
| [Scatter](https://ag-grid.com/charts/vue/scatter-series/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github)             | ✅                  | ✅                   |
| [Bubble](https://ag-grid.com/charts/vue/bubble-series/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github)               | ✅                  | ✅                   |
| [Pie](https://ag-grid.com/charts/vue/pie-series/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github)                     | ✅                  | ✅                   |
| [Donut](https://ag-grid.com/charts/vue/donut-series/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github)                 | ✅                  | ✅                   |
| [Combination](https://ag-grid.com/charts/vue/combination-series/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github)     | ✅                  | ✅                   |
| [Box Plot](https://ag-grid.com/charts/vue/box-plot-series/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github)           | ❌                  | ✅                   |
| [Candlestick](https://ag-grid.com/charts/vue/candlestick-series/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github)     | ❌                  | ✅                   |
| [OHLC](https://ag-grid.com/charts/vue/ohlc-series/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github)                   | ❌                  | ✅                   |
| [Heatmap](https://ag-grid.com/charts/vue/heatmap-series/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github)             | ❌                  | ✅                   |
| [Histogram](https://ag-grid.com/charts/vue/histogram-series/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github)         | ❌                  | ✅                   |
| [Nightingale](https://ag-grid.com/charts/vue/nightingale-series/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github)     | ❌                  | ✅                   |
| [Radar Line](https://ag-grid.com/charts/vue/radar-line-series/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github)       | ❌                  | ✅                   |
| [Radar Area](https://ag-grid.com/charts/vue/radar-area-series/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github)       | ❌                  | ✅                   |
| [Radial Column](https://ag-grid.com/charts/vue/radial-column-series/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github) | ❌                  | ✅                   |
| [Radial Bar](https://ag-grid.com/charts/vue/radial-bar-series/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github)       | ❌                  | ✅                   |
| [Range Area](https://ag-grid.com/charts/vue/range-area-series/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github)       | ❌                  | ✅                   |
| [Range Bar](https://ag-grid.com/charts/vue/range-bar-series/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github)         | ❌                  | ✅                   |
| [Sunburst](https://ag-grid.com/charts/vue/sunburst-series/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github)           | ❌                  | ✅                   |
| [Treemap](https://ag-grid.com/charts/vue/treemap-series/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github)             | ❌                  | ✅                   |
| [Waterfall](https://ag-grid.com/charts/vue/waterfall-series/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github)         | ❌                  | ✅                   |
| [Sankey](https://ag-grid.com/charts/vue/sankey-series/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github)               | ❌                  | ✅                   |
| [Chord](https://ag-grid.com/charts/vue/chord-series/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github)                 | ❌                  | ✅                   |

#### Features

AG Charts Vue3 Charting Library comes with every feature you'd expect:

| Feature                                                                                                                                          | AG Charts Community | AG Charts Enterprise |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------- | -------------------- |
| [Accessibility](https://ag-grid.com/charts/vue/accessibility/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github)             | ✅                  | ✅                   |
| [Localisation](https://ag-grid.com/charts/vue/localisation/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github)               | ✅                  | ✅                   |
| [Series Highlighting](https://ag-grid.com/charts/vue/series-highlighting/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github) | ✅                  | ✅                   |
| [Tooltips](https://ag-grid.com/charts/vue/tooltips/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github)                       | ✅                  | ✅                   |
| [Animations](https://ag-grid.com/charts/vue/animation/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github)                    | ❌                  | ✅                   |
| [Context Menu](https://ag-grid.com/charts/vue/context-menu/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github)               | ❌                  | ✅                   |
| [Crosshairs](https://ag-grid.com/charts/vue/axes-crosshairs/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github)              | ❌                  | ✅                   |
| [Navigator](https://ag-grid.com/charts/vue/navigator/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github)                     | ❌                  | ✅                   |
| [Synchronization](https://ag-grid.com/charts/vue/sync/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github)                    | ❌                  | ✅                   |
| [Zoom](https://ag-grid.com/charts/vue/zoom/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github)                               | ❌                  | ✅                   |

<blockquote>
    <p>ℹ️ <b>Note:</b></p>
    <span>Visit the <a href="https://ag-grid.com/charts/license-pricing/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github">Pricing</a> page for a full comparison.</span>
</blockquote>

### Financial Charts

Build interactive financial charts featuring advanced annotations with minimal configuration, all you need to do is provide your data:

<!-- START FINANCIAL CHARTS CODE SNIPPET -->

```js
template: `<ag-financial-charts :options="options"/>`,
components: {
    'ag-financial-charts': AgFinancialCharts,
},
data() {
    return {
        options: {
            data: getData(),
        },
    };
}
```

<!-- END FINANCIAL CHARTS CODE SNIPPET -->

Once created, users will have a Financial Chart that they can interact with and add annotations to.

<picture>
    <source media="(prefers-color-scheme: light)" srcset="https://github.com/ag-grid/ag-charts/blob/latest/packages/ag-charts-website/public/images/readme-assets/financial-charts-annotations-light.gif?raw=true"/>
    <source media="(prefers-color-scheme: dark)" srcset="https://github.com/ag-grid/ag-charts/blob/latest/packages/ag-charts-website/public/images/readme-assets/financial-charts-annotations.gif?raw=true"/>
    <img width="100%" alt="Financial Charts Annotations" src="https://github.com/ag-grid/ag-charts/blob/latest/packages/ag-charts-website/public/images/readme-assets/financial-charts-annotations-light.gif?raw=true"/>
    <br>
</picture>

The default chart type is [Candlestick](https://ag-grid.com/charts/vue/candlestick-series/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github), with additional types like [OHLC](https://ag-grid.com/charts/vue/ohlc-series/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github) and [Line](https://ag-grid.com/charts/vue/line-series/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github) for versatile data visualisation.

<div align="right">
    <a href="https://ag-grid.com/charts/vue/financial-charts/"><br><img alt="Static Badge" src="https://img.shields.io/badge/Learn More-blue?style=for-the-badge&logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOIiAiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkIj4KDTwhLS0gVXBsb2FkZWQgdG86IFNWRyBSZXBvLCB3d3cuc3ZncmVwby5jb20sIFRyYW5zZm9ybWVkIGJ5OiBTVkcgUmVwbyBNaXhlciBUb29scyAtLT4KPHN2ZyB3aWR0aD0iODAwcHgiIGhlaWdodD0iODAwcHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KDTxnIGlkPSJTVkdSZXBvX2JnQ2FycmllciIgc3Ryb2tlLXdpZHRoPSIwIi8%2BCg08ZyBpZD0iU1ZHUmVwb190cmFjZXJDYXJyaWVyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KDTxnIGlkPSJTVkdSZXBvX2ljb25DYXJyaWVyIj4gPHBhdGggZD0iTTE4IDIwLjc1SDZDNS4yNzA2NSAyMC43NSA0LjU3MTE4IDIwLjQ2MDMgNC4wNTU0NiAxOS45NDQ1QzMuNTM5NzMgMTkuNDI4OCAzLjI1IDE4LjcyOTMgMy4yNSAxOFY2QzMuMjUgNS4yNzA2NSAzLjUzOTczIDQuNTcxMTggNC4wNTU0NiA0LjA1NTQ2QzQuNTcxMTggMy41Mzk3MyA1LjI3MDY1IDMuMjUgNiAzLjI1SDEyQzEyLjE5ODkgMy4yNSAxMi4zODk3IDMuMzI5MDIgMTIuNTMwMyAzLjQ2OTY3QzEyLjY3MSAzLjYxMDMyIDEyLjc1IDMuODAxMDkgMTIuNzUgNEMxMi43NSA0LjE5ODkxIDEyLjY3MSA0LjM4OTY4IDEyLjUzMDMgNC41MzAzM0MxMi4zODk3IDQuNjcwOTggMTIuMTk4OSA0Ljc1IDEyIDQuNzVINkM1LjY2ODQ4IDQuNzUgNS4zNTA1NCA0Ljg4MTcgNS4xMTYxMiA1LjExNjEyQzQuODgxNyA1LjM1MDU0IDQuNzUgNS42Njg0OCA0Ljc1IDZWMThDNC43NSAxOC4zMzE1IDQuODgxNyAxOC42NDk1IDUuMTE2MTIgMTguODgzOUM1LjM1MDU0IDE5LjExODMgNS42Njg0OCAxOS4yNSA2IDE5LjI1SDE4QzE4LjMzMTUgMTkuMjUgMTguNjQ5NSAxOS4xMTgzIDE4Ljg4MzkgMTguODgzOUMxOS4xMTgzIDE4LjY0OTUgMTkuMjUgMTguMzMxNSAxOS4yNSAxOFYxMkMxOS4yNSAxMS44MDExIDE5LjMyOSAxMS42MTAzIDE5LjQ2OTcgMTEuNDY5N0MxOS42MTAzIDExLjMyOSAxOS44MDExIDExLjI1IDIwIDExLjI1QzIwLjE5ODkgMTEuMjUgMjAuMzg5NyAxMS4zMjkgMjAuNTMwMyAxMS40Njk3QzIwLjY3MSAxMS42MTAzIDIwLjc1IDExLjgwMTEgMjAuNzUgMTJWMThDMjAuNzUgMTguNzI5MyAyMC40NjAzIDE5LjQyODggMTkuOTQ0NSAxOS45NDQ1QzE5LjQyODggMjAuNDYwMyAxOC43MjkzIDIwLjc1IDE4IDIwLjc1WiIgZmlsbD0iI2ZmZmZmZiIvPiA8cGF0aCBkPSJNMjAgOC43NUMxOS44MDE5IDguNzQ3NDEgMTkuNjEyNiA4LjY2NzU2IDE5LjQ3MjUgOC41Mjc0N0MxOS4zMzI0IDguMzg3MzcgMTkuMjUyNiA4LjE5ODExIDE5LjI1IDhWNC43NUgxNkMxNS44MDExIDQuNzUgMTUuNjEwMyA0LjY3MDk4IDE1LjQ2OTcgNC41MzAzM0MxNS4zMjkgNC4zODk2OCAxNS4yNSA0LjE5ODkxIDE1LjI1IDRDMTUuMjUgMy44MDEwOSAxNS4zMjkgMy42MTAzMiAxNS40Njk3IDMuNDY5NjdDMTUuNjEwMyAzLjMyOTAyIDE1LjgwMTEgMy4yNSAxNiAzLjI1SDIwQzIwLjE5ODEgMy4yNTI1OSAyMC4zODc0IDMuMzMyNDQgMjAuNTI3NSAzLjQ3MjUzQzIwLjY2NzYgMy42MTI2MyAyMC43NDc0IDMuODAxODkgMjAuNzUgNFY4QzIwLjc0NzQgOC4xOTgxMSAyMC42Njc2IDguMzg3MzcgMjAuNTI3NSA4LjUyNzQ3QzIwLjM4NzQgOC42Njc1NiAyMC4xOTgxIDguNzQ3NDEgMjAgOC43NVoiIGZpbGw9IiNmZmZmZmYiLz4gPHBhdGggZD0iTTEzLjUgMTEuMjVDMTMuMzA3MSAxMS4yMzUyIDEzLjEyNzYgMTEuMTQ1NSAxMyAxMUMxMi44NzcgMTAuODYyNSAxMi44MDkgMTAuNjg0NSAxMi44MDkgMTAuNUMxMi44MDkgMTAuMzE1NSAxMi44NzcgMTAuMTM3NSAxMyAxMEwxOS41IDMuNUMxOS41Njg3IDMuNDI2MzEgMTkuNjUxNSAzLjM2NzIxIDE5Ljc0MzUgMy4zMjYyMkMxOS44MzU1IDMuMjg1MjMgMTkuOTM0OCAzLjI2MzE5IDIwLjAzNTUgMy4yNjE0MUMyMC4xMzYyIDMuMjU5NjMgMjAuMjM2MiAzLjI3ODE2IDIwLjMyOTYgMy4zMTU4OEMyMC40MjMgMy4zNTM2IDIwLjUwNzggMy40MDk3NCAyMC41NzkgMy40ODA5NkMyMC42NTAzIDMuNTUyMTggMjAuNzA2NCAzLjYzNzAxIDIwLjc0NDEgMy43MzA0QzIwLjc4MTggMy44MjM3OSAyMC44MDA0IDMuOTIzODIgMjAuNzk4NiA0LjAyNDUyQzIwLjc5NjggNC4xMjUyMyAyMC43NzQ4IDQuMjI0NTQgMjAuNzMzOCA0LjMxNjU0QzIwLjY5MjggNC40MDg1NCAyMC42MzM3IDQuNDkxMzQgMjAuNTYgNC41NkwxNCAxMUMxMy44NzI0IDExLjE0NTUgMTMuNjkyOSAxMS4yMzUyIDEzLjUgMTEuMjVaIiBmaWxsPSIjZmZmZmZmIi8%2BIDwvZz4KDTwvc3ZnPg%3D%3D"></a>
</div>

---

### Maps

The Maps Series let you visualise geographic data in different ways.

<picture>
    <source media="(prefers-color-scheme: light)" srcset="https://github.com/ag-grid/ag-charts/blob/latest/packages/ag-charts-website/public/images/readme-assets/map.gif?raw=true"/>
    <source media="(prefers-color-scheme: dark)" srcset="https://github.com/ag-grid/ag-charts/blob/latest/packages/ag-charts-website/public/images/readme-assets/map-dark.gif?raw=true"/>
    <img width="100%" alt="Preview of Map Charts from AG Charts" src="https://github.com/ag-grid/ag-charts/blob/latest/packages/ag-charts-website/public/images/readme-assets/map.gif?raw=true"/>
</picture>

Maps can display data using [Shapes](https://ag-grid.com/charts/vue/map-shapes/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github), [Lines](https://ag-grid.com/charts/vue/map-lines/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github) and [Marker](https://ag-grid.com/charts/vue/map-markers/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github) series:

```js
const options = {
    topology: topology,
    series: [
        {
            type: 'map-shape',
            data: pacific,
            idKey: 'name',
            title: 'Pacific',
        },
        // ...
    ],
    legend: {
        enabled: true,
    },
    // ...
};
```

<div align="right">
    <a href="https://ag-grid.com/charts/vue/maps/"><img alt="Static Badge" src="https://img.shields.io/badge/Learn More-blue?style=for-the-badge&logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOIiAiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkIj4KDTwhLS0gVXBsb2FkZWQgdG86IFNWRyBSZXBvLCB3d3cuc3ZncmVwby5jb20sIFRyYW5zZm9ybWVkIGJ5OiBTVkcgUmVwbyBNaXhlciBUb29scyAtLT4KPHN2ZyB3aWR0aD0iODAwcHgiIGhlaWdodD0iODAwcHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KDTxnIGlkPSJTVkdSZXBvX2JnQ2FycmllciIgc3Ryb2tlLXdpZHRoPSIwIi8%2BCg08ZyBpZD0iU1ZHUmVwb190cmFjZXJDYXJyaWVyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KDTxnIGlkPSJTVkdSZXBvX2ljb25DYXJyaWVyIj4gPHBhdGggZD0iTTE4IDIwLjc1SDZDNS4yNzA2NSAyMC43NSA0LjU3MTE4IDIwLjQ2MDMgNC4wNTU0NiAxOS45NDQ1QzMuNTM5NzMgMTkuNDI4OCAzLjI1IDE4LjcyOTMgMy4yNSAxOFY2QzMuMjUgNS4yNzA2NSAzLjUzOTczIDQuNTcxMTggNC4wNTU0NiA0LjA1NTQ2QzQuNTcxMTggMy41Mzk3MyA1LjI3MDY1IDMuMjUgNiAzLjI1SDEyQzEyLjE5ODkgMy4yNSAxMi4zODk3IDMuMzI5MDIgMTIuNTMwMyAzLjQ2OTY3QzEyLjY3MSAzLjYxMDMyIDEyLjc1IDMuODAxMDkgMTIuNzUgNEMxMi43NSA0LjE5ODkxIDEyLjY3MSA0LjM4OTY4IDEyLjUzMDMgNC41MzAzM0MxMi4zODk3IDQuNjcwOTggMTIuMTk4OSA0Ljc1IDEyIDQuNzVINkM1LjY2ODQ4IDQuNzUgNS4zNTA1NCA0Ljg4MTcgNS4xMTYxMiA1LjExNjEyQzQuODgxNyA1LjM1MDU0IDQuNzUgNS42Njg0OCA0Ljc1IDZWMThDNC43NSAxOC4zMzE1IDQuODgxNyAxOC42NDk1IDUuMTE2MTIgMTguODgzOUM1LjM1MDU0IDE5LjExODMgNS42Njg0OCAxOS4yNSA2IDE5LjI1SDE4QzE4LjMzMTUgMTkuMjUgMTguNjQ5NSAxOS4xMTgzIDE4Ljg4MzkgMTguODgzOUMxOS4xMTgzIDE4LjY0OTUgMTkuMjUgMTguMzMxNSAxOS4yNSAxOFYxMkMxOS4yNSAxMS44MDExIDE5LjMyOSAxMS42MTAzIDE5LjQ2OTcgMTEuNDY5N0MxOS42MTAzIDExLjMyOSAxOS44MDExIDExLjI1IDIwIDExLjI1QzIwLjE5ODkgMTEuMjUgMjAuMzg5NyAxMS4zMjkgMjAuNTMwMyAxMS40Njk3QzIwLjY3MSAxMS42MTAzIDIwLjc1IDExLjgwMTEgMjAuNzUgMTJWMThDMjAuNzUgMTguNzI5MyAyMC40NjAzIDE5LjQyODggMTkuOTQ0NSAxOS45NDQ1QzE5LjQyODggMjAuNDYwMyAxOC43MjkzIDIwLjc1IDE4IDIwLjc1WiIgZmlsbD0iI2ZmZmZmZiIvPiA8cGF0aCBkPSJNMjAgOC43NUMxOS44MDE5IDguNzQ3NDEgMTkuNjEyNiA4LjY2NzU2IDE5LjQ3MjUgOC41Mjc0N0MxOS4zMzI0IDguMzg3MzcgMTkuMjUyNiA4LjE5ODExIDE5LjI1IDhWNC43NUgxNkMxNS44MDExIDQuNzUgMTUuNjEwMyA0LjY3MDk4IDE1LjQ2OTcgNC41MzAzM0MxNS4zMjkgNC4zODk2OCAxNS4yNSA0LjE5ODkxIDE1LjI1IDRDMTUuMjUgMy44MDEwOSAxNS4zMjkgMy42MTAzMiAxNS40Njk3IDMuNDY5NjdDMTUuNjEwMyAzLjMyOTAyIDE1LjgwMTEgMy4yNSAxNiAzLjI1SDIwQzIwLjE5ODEgMy4yNTI1OSAyMC4zODc0IDMuMzMyNDQgMjAuNTI3NSAzLjQ3MjUzQzIwLjY2NzYgMy42MTI2MyAyMC43NDc0IDMuODAxODkgMjAuNzUgNFY4QzIwLjc0NzQgOC4xOTgxMSAyMC42Njc2IDguMzg3MzcgMjAuNTI3NSA4LjUyNzQ3QzIwLjM4NzQgOC42Njc1NiAyMC4xOTgxIDguNzQ3NDEgMjAgOC43NVoiIGZpbGw9IiNmZmZmZmYiLz4gPHBhdGggZD0iTTEzLjUgMTEuMjVDMTMuMzA3MSAxMS4yMzUyIDEzLjEyNzYgMTEuMTQ1NSAxMyAxMUMxMi44NzcgMTAuODYyNSAxMi44MDkgMTAuNjg0NSAxMi44MDkgMTAuNUMxMi44MDkgMTAuMzE1NSAxMi44NzcgMTAuMTM3NSAxMyAxMEwxOS41IDMuNUMxOS41Njg3IDMuNDI2MzEgMTkuNjUxNSAzLjM2NzIxIDE5Ljc0MzUgMy4zMjYyMkMxOS44MzU1IDMuMjg1MjMgMTkuOTM0OCAzLjI2MzE5IDIwLjAzNTUgMy4yNjE0MUMyMC4xMzYyIDMuMjU5NjMgMjAuMjM2MiAzLjI3ODE2IDIwLjMyOTYgMy4zMTU4OEMyMC40MjMgMy4zNTM2IDIwLjUwNzggMy40MDk3NCAyMC41NzkgMy40ODA5NkMyMC42NTAzIDMuNTUyMTggMjAuNzA2NCAzLjYzNzAxIDIwLjc0NDEgMy43MzA0QzIwLjc4MTggMy44MjM3OSAyMC44MDA0IDMuOTIzODIgMjAuNzk4NiA0LjAyNDUyQzIwLjc5NjggNC4xMjUyMyAyMC43NzQ4IDQuMjI0NTQgMjAuNzMzOCA0LjMxNjU0QzIwLjY5MjggNC40MDg1NCAyMC42MzM3IDQuNDkxMzQgMjAuNTYgNC41NkwxNCAxMUMxMy44NzI0IDExLjE0NTUgMTMuNjkyOSAxMS4yMzUyIDEzLjUgMTEuMjVaIiBmaWxsPSIjZmZmZmZmIi8%2BIDwvZz4KDTwvc3ZnPg%3D%3D"></a>
</div>

## ⚡️ Quick Start

<!-- START QUICK START DESCRIPTION -->

AG Charts are easy to set up - all you need to do is provide your data and series type along with any other chart options.

<!-- END QUICK START DESCRIPTION -->

### Installation

```sh
$ npm install ag-charts-vue3
```

### Setup

<!-- START SETUP -->

1. Import the Vue Chart

```html
<template>
    <!-- The AG Charts component with chartsOptions as an attribute -->
    <ag-charts :options="options"> </ag-charts>
</template>

<script>
    import { ref } from 'vue';

    // Vue Chart Component
    import { AgCharts } from 'ag-charts-vue3';

    export default {
        name: 'App',
        components: {
            'ag-charts': AgCharts,
        },
        setup() {},
    };
</script>
```

2. Instantiate the Vue3 Chart

```js
// Chart Options
const options = {};

// Create Chart
const chart = agCharts.AgCharts.create(options);
```

2. Define Chart Data and Series

```html
<template>
    <!-- The AG Charts component with chartsOptions as an attribute -->
    <ag-charts :options="options"> </ag-charts>
</template>

<script>
    setup() {
      // Chart Options
        const options = ref({
         // Data: Data to be displayed in the chart
         data: [
          { month: 'Jan', avgTemp: 2.3, iceCreamSales: 162000 },
          { month: 'Mar', avgTemp: 6.3, iceCreamSales: 302000 },
          { month: 'May', avgTemp: 16.2, iceCreamSales: 800000 },
          { month: 'Jul', avgTemp: 22.8, iceCreamSales: 1254000 },
          { month: 'Sep', avgTemp: 14.5, iceCreamSales: 950000 },
          { month: 'Nov', avgTemp: 8.9, iceCreamSales: 200000 },
        ],
        // Series: Defines which chart type and data to use
        series: [{ type: 'bar', xKey: 'month', yKey: 'iceCreamSales' }],
        });
      return {
        options,
      };
    },
</script>
```

3. Vue Chart Component

```html
<template>
    <!-- The AG Charts component with chartsOptions as an attribute -->
    <ag-charts :options="options"> </ag-charts>
</template>
```

<!-- END SETUP -->

<blockquote>
    <p>ℹ️ <b>Note:</b></p>
    <span>For more information on building  Vue3 Charts with AG Charts, refer to our <a href="https://ag-grid.com/charts/vue/quick-start/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github">Documentation</a>.</span>
</blockquote>

## 🤝 Support

### Enterprise Support

AG Charts Enterprise customers have access to dedicated support via [ZenDesk](https://ag-grid.zendesk.com/hc/en-us), which is monitored by our support & engineering teams.

### Bug Reports

If you have found a bug, please report it in this repository's [issues](https://github.com/ag-grid/ag-charts/issues) section.

<img src="https://img.shields.io/github/issues-closed/ag-grid/ag-charts?style=for-the-badge&color=%233d8c40" alt="GitHub Issues" height="26">

### Questions

Look for similar problems on [StackOverflow](https://stackoverflow.com/questions/tagged/ag-charts) using the `ag-charts` tag. If nothing seems related, post a new message there. Please do not use GitHub issues to ask questions.

<img src="https://img.shields.io/stackexchange/stackoverflow.com/t/ag-charts?style=for-the-badge&color=%233d8c40" alt="Stack Exchange questions" height="26">

### Contributing

AG Charts is developed by a team of co-located developers in London. If you want to join the team send your application to info@ag-grid.com.

## ⚠️ License

`ag-charts-community` is licensed under the **MIT** license.

`ag-charts-enterprise` has a **Commercial** license.

See the [LICENSE file](./LICENSE.txt) for more info.

<div><h2><img vertical-align="middle" width="32" height="32" src="https://github.com/ag-grid/ag-grid/blob/latest/documentation/ag-grid-docs/public/images/ag-logos/svg-logos/AG-BrandMark_Light-Theme.svg?raw=true" alt="AG ChartsLogo">AG Grid</h2></div>

<p>AG Grid is our flagship product, a <strong>fully-featured</strong> and <strong>highly customizable</strong>  Vue3 Data Grid. It delivers <strong>outstanding performance</strong>, has <strong>no third-party dependencies</strong> and comes with support for <strong><a href="https://github.com/ag-grid/ag-grid/tree/latest/packages/ag-grid-react"><img src="https://github.com/ag-grid/ag-grid/blob/latest/documentation/ag-grid-docs/public/images/fw-logos/react.svg?raw=true" height="16" width="16" alt="React Logo"> React</a></strong>, <strong><a href="https://github.com/ag-grid/ag-grid/tree/latest/packages/ag-grid-angular"><img src="https://github.com/ag-grid/ag-grid/blob/latest/documentation/ag-grid-docs/public/images/fw-logos/angular.svg?raw=true" height="16" width="16" alt="Angular Logo"> Angular</a></strong> and <strong><a href="https://github.com/ag-grid/ag-grid/tree/latest/packages/ag-grid-vue3"><img src="https://github.com/ag-grid/ag-grid/blob/latest/documentation/ag-grid-docs/public/images/fw-logos/vue.svg?raw=true" height="16" width="16" alt="Vue Logo"> Vue</a></strong>.</p>

AG Charts is used within AG Grid to power the [Integrated Charting](https://www.ag-grid.com/vue-data-grid/integrated-charts/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github) feature.

Learn more at [ag-grid.com](https://www.ag-grid.com/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github)

<div align="center">
    
<hr/>

<strong>Follow us to keep up to date with all the latest news from AG Grid:</strong>

<a href="https://x.com/ag_grid"><img src="https://img.shields.io/badge/-X%20(Twitter)-black?style=for-the-badge&logo=x" alt="Twitter Badge" height="36"></a>
<a href="https://www.linkedin.com/company/ag-grid/"><img src="https://img.shields.io/badge/-LinkedIn-blue?style=for-the-badge&logo=linkedin" alt="LinkedIn Badge" height="36"></a>
<a href="https://www.youtube.com/c/ag-grid"><img src="https://img.shields.io/badge/-YouTube-red?style=for-the-badge&logo=youtube" alt="YouTube Badge" height="36"></a>
<a href="https://blog.ag-grid.com"><img src="https://img.shields.io/badge/-Blog-grey?style=for-the-badge&logo=rss" alt="Blog Badge" height="36"></a>

</div>
