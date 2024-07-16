# JavaScript Charting Library

<div align="center">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/ag-grid/ag-grid/blob/latest/documentation/ag-grid-docs/public/images/ag-logos/svg-logos/AG-Charts-Logo_Dark-Theme.svg?raw=true"/>
      <source media="(prefers-color-scheme: light)" srcset="https://github.com/ag-grid/ag-grid/blob/latest/documentation/ag-grid-docs/public/images/ag-logos/svg-logos/AG-Charts-Logo_Light-Theme.svg?raw=true"/>
      <img width="100%" alt="AG Charts Logo" src="https://github.com/ag-grid/ag-grid/blob/latest/documentation/ag-grid-docs/public/images/ag-logos/svg-logos/AG-Charts-Logo_Dark-Theme.svg?raw=true"/>
    </picture>
    <div align="center">
        <h4><a href="https://charts.ag-grid.com">🌐 Website</a> • <a href="https://charts.ag-grid.com/javascript/quick-start/">📖 Documentation</a> • <a href="https://charts.ag-grid.com/gallery/">📊 Gallery</a></h4>
    </div>
    <br>
    <a href="https://github.com/ag-grid/ag-charts/releases">
        <img src="https://img.shields.io/github/v/release/ag-grid/ag-charts?style=for-the-badge" alt="GitHub Release">
    </a>
    <a href="https://www.npmjs.com/package/ag-charts-community">
        <img src="https://img.shields.io/npm/dm/ag-charts-community?style=for-the-badge" alt="NPM Downloads">
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
    <a href="https://npm.io/package/ag-charts-community">
        <img src="https://img.shields.io/npms-io/maintenance-score/ag-grid-community" alt="npms.io Maintenance Score">
    </a>
    <a href="https://github.com/ag-grid/ag-charts/graphs/commit-activity">
        <img src="https://img.shields.io/github/commit-activity/m/ag-grid/ag-charts" alt="GitHub commit activity">
    </a>
    <a href="https://github.com/ag-grid/ag-charts/network/dependents">
        <img src="https://img.shields.io/librariesio/dependents/npm/ag-charts-community" alt="Dependents (via libraries.io?style=for-the-badge)">
    </a>
    <br><br>
    <!-- START MAIN DESCRIPTION -->
    <p>AG Charts is a <strong>fully-featured</strong> and <strong>highly customizable</strong> canvas-based JavaScript Charting library. It delivers <strong>outstanding performance</strong>, has <strong>no third-party dependencies</strong> and comes with support for <span><strong><a href="https://github.com/ag-grid/ag-charts/tree/latest/packages/ag-charts-react"><img src="https://github.com/ag-grid/ag-grid/blob/latest/documentation/ag-grid-docs/public/images/fw-logos/react.svg?raw=true" height="16" width="16" alt="React Logo"> React</a></strong></span>, <span><strong><a href="https://github.com/ag-grid/ag-charts/tree/latest/packages/ag-charts-angular"><img src="https://github.com/ag-grid/ag-grid/blob/latest/documentation/ag-grid-docs/public/images/fw-logos/angular.svg?raw=true" height="16" width="16" alt="Angular Logo"> Angular</a></strong></span> and <span><strong><a href="https://github.com/ag-grid/ag-charts/tree/latest/packages/ag-charts-vue3"><img src="https://github.com/ag-grid/ag-grid/blob/latest/documentation/ag-grid-docs/public/images/fw-logos/vue.svg?raw=true" height="16" width="16" alt="Vue Logo"> Vue</a></strong></span>.</p>
    <!-- END MAIN DESCRIPTION -->
    <br>
</div>

<picture>
    <source media="(prefers-color-scheme: dark)" srcset="./packages/ag-charts-website/public/images/readme-assets/gallery-dark.gif"/>
    <source media="(prefers-color-scheme: light)" srcset="./packages/ag-charts-website/public/images/readme-assets/gallery.gif"/>
    <img width="100%" alt="Preview of AG Charts JavaScript Charting Examples" src="./packages/ag-charts-website/public/images/readme-assets/gallery-dark.gif"/>
</picture>
<div align="right">
    <a href="https://charts.ag-grid.com/gallery/"><br><img alt="Static Badge" src="https://img.shields.io/badge/View%20Gallery-blue?style=for-the-badge&logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOIiAiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkIj4KDTwhLS0gVXBsb2FkZWQgdG86IFNWRyBSZXBvLCB3d3cuc3ZncmVwby5jb20sIFRyYW5zZm9ybWVkIGJ5OiBTVkcgUmVwbyBNaXhlciBUb29scyAtLT4KPHN2ZyB3aWR0aD0iODAwcHgiIGhlaWdodD0iODAwcHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KDTxnIGlkPSJTVkdSZXBvX2JnQ2FycmllciIgc3Ryb2tlLXdpZHRoPSIwIi8%2BCg08ZyBpZD0iU1ZHUmVwb190cmFjZXJDYXJyaWVyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KDTxnIGlkPSJTVkdSZXBvX2ljb25DYXJyaWVyIj4gPHBhdGggZD0iTTE4IDIwLjc1SDZDNS4yNzA2NSAyMC43NSA0LjU3MTE4IDIwLjQ2MDMgNC4wNTU0NiAxOS45NDQ1QzMuNTM5NzMgMTkuNDI4OCAzLjI1IDE4LjcyOTMgMy4yNSAxOFY2QzMuMjUgNS4yNzA2NSAzLjUzOTczIDQuNTcxMTggNC4wNTU0NiA0LjA1NTQ2QzQuNTcxMTggMy41Mzk3MyA1LjI3MDY1IDMuMjUgNiAzLjI1SDEyQzEyLjE5ODkgMy4yNSAxMi4zODk3IDMuMzI5MDIgMTIuNTMwMyAzLjQ2OTY3QzEyLjY3MSAzLjYxMDMyIDEyLjc1IDMuODAxMDkgMTIuNzUgNEMxMi43NSA0LjE5ODkxIDEyLjY3MSA0LjM4OTY4IDEyLjUzMDMgNC41MzAzM0MxMi4zODk3IDQuNjcwOTggMTIuMTk4OSA0Ljc1IDEyIDQuNzVINkM1LjY2ODQ4IDQuNzUgNS4zNTA1NCA0Ljg4MTcgNS4xMTYxMiA1LjExNjEyQzQuODgxNyA1LjM1MDU0IDQuNzUgNS42Njg0OCA0Ljc1IDZWMThDNC43NSAxOC4zMzE1IDQuODgxNyAxOC42NDk1IDUuMTE2MTIgMTguODgzOUM1LjM1MDU0IDE5LjExODMgNS42Njg0OCAxOS4yNSA2IDE5LjI1SDE4QzE4LjMzMTUgMTkuMjUgMTguNjQ5NSAxOS4xMTgzIDE4Ljg4MzkgMTguODgzOUMxOS4xMTgzIDE4LjY0OTUgMTkuMjUgMTguMzMxNSAxOS4yNSAxOFYxMkMxOS4yNSAxMS44MDExIDE5LjMyOSAxMS42MTAzIDE5LjQ2OTcgMTEuNDY5N0MxOS42MTAzIDExLjMyOSAxOS44MDExIDExLjI1IDIwIDExLjI1QzIwLjE5ODkgMTEuMjUgMjAuMzg5NyAxMS4zMjkgMjAuNTMwMyAxMS40Njk3QzIwLjY3MSAxMS42MTAzIDIwLjc1IDExLjgwMTEgMjAuNzUgMTJWMThDMjAuNzUgMTguNzI5MyAyMC40NjAzIDE5LjQyODggMTkuOTQ0NSAxOS45NDQ1QzE5LjQyODggMjAuNDYwMyAxOC43MjkzIDIwLjc1IDE4IDIwLjc1WiIgZmlsbD0iI2ZmZmZmZiIvPiA8cGF0aCBkPSJNMjAgOC43NUMxOS44MDE5IDguNzQ3NDEgMTkuNjEyNiA4LjY2NzU2IDE5LjQ3MjUgOC41Mjc0N0MxOS4zMzI0IDguMzg3MzcgMTkuMjUyNiA4LjE5ODExIDE5LjI1IDhWNC43NUgxNkMxNS44MDExIDQuNzUgMTUuNjEwMyA0LjY3MDk4IDE1LjQ2OTcgNC41MzAzM0MxNS4zMjkgNC4zODk2OCAxNS4yNSA0LjE5ODkxIDE1LjI1IDRDMTUuMjUgMy44MDEwOSAxNS4zMjkgMy42MTAzMiAxNS40Njk3IDMuNDY5NjdDMTUuNjEwMyAzLjMyOTAyIDE1LjgwMTEgMy4yNSAxNiAzLjI1SDIwQzIwLjE5ODEgMy4yNTI1OSAyMC4zODc0IDMuMzMyNDQgMjAuNTI3NSAzLjQ3MjUzQzIwLjY2NzYgMy42MTI2MyAyMC43NDc0IDMuODAxODkgMjAuNzUgNFY4QzIwLjc0NzQgOC4xOTgxMSAyMC42Njc2IDguMzg3MzcgMjAuNTI3NSA4LjUyNzQ3QzIwLjM4NzQgOC42Njc1NiAyMC4xOTgxIDguNzQ3NDEgMjAgOC43NVoiIGZpbGw9IiNmZmZmZmYiLz4gPHBhdGggZD0iTTEzLjUgMTEuMjVDMTMuMzA3MSAxMS4yMzUyIDEzLjEyNzYgMTEuMTQ1NSAxMyAxMUMxMi44NzcgMTAuODYyNSAxMi44MDkgMTAuNjg0NSAxMi44MDkgMTAuNUMxMi44MDkgMTAuMzE1NSAxMi44NzcgMTAuMTM3NSAxMyAxMEwxOS41IDMuNUMxOS41Njg3IDMuNDI2MzEgMTkuNjUxNSAzLjM2NzIxIDE5Ljc0MzUgMy4zMjYyMkMxOS44MzU1IDMuMjg1MjMgMTkuOTM0OCAzLjI2MzE5IDIwLjAzNTUgMy4yNjE0MUMyMC4xMzYyIDMuMjU5NjMgMjAuMjM2MiAzLjI3ODE2IDIwLjMyOTYgMy4zMTU4OEMyMC40MjMgMy4zNTM2IDIwLjUwNzggMy40MDk3NCAyMC41NzkgMy40ODA5NkMyMC42NTAzIDMuNTUyMTggMjAuNzA2NCAzLjYzNzAxIDIwLjc0NDEgMy43MzA0QzIwLjc4MTggMy44MjM3OSAyMC44MDA0IDMuOTIzODIgMjAuNzk4NiA0LjAyNDUyQzIwLjc5NjggNC4xMjUyMyAyMC43NzQ4IDQuMjI0NTQgMjAuNzMzOCA0LjMxNjU0QzIwLjY5MjggNC40MDg1NCAyMC42MzM3IDQuNDkxMzQgMjAuNTYgNC41NkwxNCAxMUMxMy44NzI0IDExLjE0NTUgMTMuNjkyOSAxMS4yMzUyIDEzLjUgMTEuMjVaIiBmaWxsPSIjZmZmZmZmIi8%2BIDwvZz4KDTwvc3ZnPg%3D%3D">
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

-   `ag-charts-community` is free, available under the MIT license, and comes with core series types, such as [Pie](https://charts.ag-grid.com/javascript/pie-series/), [Area](https://charts.ag-grid.com/javascript/area-series/), [Bar](https://charts.ag-grid.com/javascript/bar-series/), [Scatter](https://charts.ag-grid.com/javascript/scatter-series/) and [Bubble](https://charts.ag-grid.com/javascript/bubble-series/) in addition to all of the key features expected from a JavaScript charting library, including [Accessibility](https://charts.ag-grid.com/javascript/accessibility/), [Tooltips](https://charts.ag-grid.com/javascript/tooltips/), [Themes](https://charts.ag-grid.com/javascript/themes/), [Markers](https://charts.ag-grid.com/javascript/markers/), [Legends](https://charts.ag-grid.com/javascript/legend/), [Axis Types](https://charts.ag-grid.com/javascript/axes-types/) and [Secondary Axes](https://charts.ag-grid.com/javascript/axes-secondary/).
-   `ag-charts-enterprise` is available under a commercial license and comes with additional series types, such as [Maps](https://charts.ag-grid.com/javascript/maps/), [Sankey](https://charts.ag-grid.com/javascript/sankey-series/), [Radar](https://charts.ag-grid.com/javascript/radar-area-series/), and [Waterfall](https://charts.ag-grid.com/javascript/waterfall-series/) Charts as well as advanced interactivity features, like [Animations](https://charts.ag-grid.com/javascript/animation/), [Context Menus](https://charts.ag-grid.com/javascript/context-menu/), [Zooming](https://charts.ag-grid.com/javascript/zoom/), [Navigators](https://charts.ag-grid.com/javascript/navigator/), [Synchronization](https://charts.ag-grid.com/javascript/sync/) and much more, including [Financial Charts](https://charts.ag-grid.com/javascript/financial-charts/).

### Features & Chart Types

AG Charts offers 20+ chart types, each of which are fully customisable:

| Chart Type                                                                | AG Charts Community | AG Charts Enterprise |
| ------------------------------------------------------------------------- | ------------------- | -------------------- |
| [Bar](https://charts.ag-grid.com/gallery/simple-bar/)                     | ✅                  | ✅                   |
| [Line](https://charts.ag-grid.com/gallery/multiple-line-series/)          | ✅                  | ✅                   |
| [Area](https://charts.ag-grid.com/gallery/stacked-area/)                  | ✅                  | ✅                   |
| [Scatter](https://charts.ag-grid.com/gallery/simple-scatter/)             | ✅                  | ✅                   |
| [Bubble](https://charts.ag-grid.com/gallery/simple-bubble/)               | ✅                  | ✅                   |
| [Pie](https://charts.ag-grid.com/gallery/simple-pie/)                     | ✅                  | ✅                   |
| [Donut](https://charts.ag-grid.com/gallery/multiple-donuts/)              | ✅                  | ✅                   |
| [Combination](https://charts.ag-grid.com/gallery/combination-chart/)      | ✅                  | ✅                   |
| [Box Plot](https://charts.ag-grid.com/gallery/simple-box-plot/)           | ❌                  | ✅                   |
| [Bullet](https://charts.ag-grid.com/gallery/simple-bullet/)               | ❌                  | ✅                   |
| [Candlestick](https://charts.ag-grid.com/gallery/candlestick-chart/)      | ❌                  | ✅                   |
| [OHLC](https://charts.ag-grid.com/gallery/ohlc-chart/)                    | ❌                  | ✅                   |
| [Heatmap](https://charts.ag-grid.com/gallery/heatmap-with-labels/)        | ❌                  | ✅                   |
| [Histogram](https://charts.ag-grid.com/gallery/simple-histogram/)         | ❌                  | ✅                   |
| [Nightingale](https://charts.ag-grid.com/gallery/simple-nightingale/)     | ❌                  | ✅                   |
| [Radar Line](https://charts.ag-grid.com/gallery/simple-radar-line/)       | ❌                  | ✅                   |
| [Radar Area](https://charts.ag-grid.com/gallery/radar-area-with-labels/)  | ❌                  | ✅                   |
| [Radial Column](https://charts.ag-grid.com/gallery/simple-radial-column/) | ❌                  | ✅                   |
| [Radial Bar](https://charts.ag-grid.com/gallery/simple-radial-bar/)       | ❌                  | ✅                   |
| [Range Area](https://charts.ag-grid.com/gallery/simple-range-area/)       | ❌                  | ✅                   |
| [Range Bar](https://charts.ag-grid.com/gallery/simple-range-bar/)         | ❌                  | ✅                   |
| [Sunburst](https://charts.ag-grid.com/gallery/simple-sunburst/)           | ❌                  | ✅                   |
| [Treemap](https://charts.ag-grid.com/gallery/treemap/)                    | ❌                  | ✅                   |
| [Waterfall](https://charts.ag-grid.com/gallery/customised-waterfall/)     | ❌                  | ✅                   |
| [Sankey](https://charts.ag-grid.com/gallery/sankey/)                      | ❌                  | ✅                   |
| [Chord](https://charts.ag-grid.com/gallery/chord-diagram/)                | ❌                  | ✅                   |

AG Charts comes with every feature you'd expect from a charting library:

| Feature                                                                           | AG Charts Community | AG Charts Enterprise |
| --------------------------------------------------------------------------------- | ------------------- | -------------------- |
| [Accessibility](https://charts.ag-grid.com/javascript/accessibility/)             | ✅                  | ✅                   |
| [Localisation](https://charts.ag-grid.com/javascript/localisation/)               | ✅                  | ✅                   |
| [Series Highlighting](https://charts.ag-grid.com/javascript/series-highlighting/) | ✅                  | ✅                   |
| [Tooltips](https://charts.ag-grid.com/javascript/tooltips/)                       | ✅                  | ✅                   |
| [Animations](https://charts.ag-grid.com/javascript/animation/)                    | ❌                  | ✅                   |
| [Context Menu](https://charts.ag-grid.com/javascript/context-menu/)               | ❌                  | ✅                   |
| [Crosshairs](https://charts.ag-grid.com/javascript/axes-crosshairs/)              | ❌                  | ✅                   |
| [Navigator](https://charts.ag-grid.com/javascript/navigator/)                     | ❌                  | ✅                   |
| [Synchronization](https://charts.ag-grid.com/javascript/sync/)                    | ❌                  | ✅                   |
| [Zoom](https://charts.ag-grid.com/javascript/zoom/)                               | ❌                  | ✅                   |

> [!IMPORTANT]
> Visit the [Pricing](https://charts.ag-grid.com/license-pricing/?utm_source=ag-charts-readme&utm_medium=repository&utm_campaign=github) page for a full comparison.

### Financial Charts

Build interactive financial charts featuring advanced annotations with minimal configuration, all you need to do is provide your data:

```js
const options = {
    data: getData(),
};

AgCharts.createFinancialChart(options);
```

Once created, users will have a Financial Chart that can interact with and add annotations to.

<picture>
    <source media="(prefers-color-scheme: dark)" srcset="./packages/ag-charts-website/public/images/readme-assets/financial-charts-annotations.gif"/>
    <source media="(prefers-color-scheme: light)" srcset="./packages/ag-charts-website/public/images/readme-assets/financial-charts-annotations-light.gif"/>
    <img width="100%" alt="Financial Charts Annotations" src="./packages/ag-charts-website/public/images/readme-assets/financial-charts-annotations.gif"/>
    <br>
</picture>

The default chart type is [Candlestick](https://charts.ag-grid.com/javascript/candlestick-series/), with additional types like [OHLC](https://charts.ag-grid.com/javascript/ohlc-series/) and [Line](https://charts.ag-grid.com/javascript/line-series/) for versatile data visualisation.

<div align="right">
<a href="https://charts.ag-grid.com/javascript/maps/"><br><img alt="Static Badge" src="https://img.shields.io/badge/Learn More-blue?style=for-the-badge&logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOIiAiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkIj4KDTwhLS0gVXBsb2FkZWQgdG86IFNWRyBSZXBvLCB3d3cuc3ZncmVwby5jb20sIFRyYW5zZm9ybWVkIGJ5OiBTVkcgUmVwbyBNaXhlciBUb29scyAtLT4KPHN2ZyB3aWR0aD0iODAwcHgiIGhlaWdodD0iODAwcHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KDTxnIGlkPSJTVkdSZXBvX2JnQ2FycmllciIgc3Ryb2tlLXdpZHRoPSIwIi8%2BCg08ZyBpZD0iU1ZHUmVwb190cmFjZXJDYXJyaWVyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KDTxnIGlkPSJTVkdSZXBvX2ljb25DYXJyaWVyIj4gPHBhdGggZD0iTTE4IDIwLjc1SDZDNS4yNzA2NSAyMC43NSA0LjU3MTE4IDIwLjQ2MDMgNC4wNTU0NiAxOS45NDQ1QzMuNTM5NzMgMTkuNDI4OCAzLjI1IDE4LjcyOTMgMy4yNSAxOFY2QzMuMjUgNS4yNzA2NSAzLjUzOTczIDQuNTcxMTggNC4wNTU0NiA0LjA1NTQ2QzQuNTcxMTggMy41Mzk3MyA1LjI3MDY1IDMuMjUgNiAzLjI1SDEyQzEyLjE5ODkgMy4yNSAxMi4zODk3IDMuMzI5MDIgMTIuNTMwMyAzLjQ2OTY3QzEyLjY3MSAzLjYxMDMyIDEyLjc1IDMuODAxMDkgMTIuNzUgNEMxMi43NSA0LjE5ODkxIDEyLjY3MSA0LjM4OTY4IDEyLjUzMDMgNC41MzAzM0MxMi4zODk3IDQuNjcwOTggMTIuMTk4OSA0Ljc1IDEyIDQuNzVINkM1LjY2ODQ4IDQuNzUgNS4zNTA1NCA0Ljg4MTcgNS4xMTYxMiA1LjExNjEyQzQuODgxNyA1LjM1MDU0IDQuNzUgNS42Njg0OCA0Ljc1IDZWMThDNC43NSAxOC4zMzE1IDQuODgxNyAxOC42NDk1IDUuMTE2MTIgMTguODgzOUM1LjM1MDU0IDE5LjExODMgNS42Njg0OCAxOS4yNSA2IDE5LjI1SDE4QzE4LjMzMTUgMTkuMjUgMTguNjQ5NSAxOS4xMTgzIDE4Ljg4MzkgMTguODgzOUMxOS4xMTgzIDE4LjY0OTUgMTkuMjUgMTguMzMxNSAxOS4yNSAxOFYxMkMxOS4yNSAxMS44MDExIDE5LjMyOSAxMS42MTAzIDE5LjQ2OTcgMTEuNDY5N0MxOS42MTAzIDExLjMyOSAxOS44MDExIDExLjI1IDIwIDExLjI1QzIwLjE5ODkgMTEuMjUgMjAuMzg5NyAxMS4zMjkgMjAuNTMwMyAxMS40Njk3QzIwLjY3MSAxMS42MTAzIDIwLjc1IDExLjgwMTEgMjAuNzUgMTJWMThDMjAuNzUgMTguNzI5MyAyMC40NjAzIDE5LjQyODggMTkuOTQ0NSAxOS45NDQ1QzE5LjQyODggMjAuNDYwMyAxOC43MjkzIDIwLjc1IDE4IDIwLjc1WiIgZmlsbD0iI2ZmZmZmZiIvPiA8cGF0aCBkPSJNMjAgOC43NUMxOS44MDE5IDguNzQ3NDEgMTkuNjEyNiA4LjY2NzU2IDE5LjQ3MjUgOC41Mjc0N0MxOS4zMzI0IDguMzg3MzcgMTkuMjUyNiA4LjE5ODExIDE5LjI1IDhWNC43NUgxNkMxNS44MDExIDQuNzUgMTUuNjEwMyA0LjY3MDk4IDE1LjQ2OTcgNC41MzAzM0MxNS4zMjkgNC4zODk2OCAxNS4yNSA0LjE5ODkxIDE1LjI1IDRDMTUuMjUgMy44MDEwOSAxNS4zMjkgMy42MTAzMiAxNS40Njk3IDMuNDY5NjdDMTUuNjEwMyAzLjMyOTAyIDE1LjgwMTEgMy4yNSAxNiAzLjI1SDIwQzIwLjE5ODEgMy4yNTI1OSAyMC4zODc0IDMuMzMyNDQgMjAuNTI3NSAzLjQ3MjUzQzIwLjY2NzYgMy42MTI2MyAyMC43NDc0IDMuODAxODkgMjAuNzUgNFY4QzIwLjc0NzQgOC4xOTgxMSAyMC42Njc2IDguMzg3MzcgMjAuNTI3NSA4LjUyNzQ3QzIwLjM4NzQgOC42Njc1NiAyMC4xOTgxIDguNzQ3NDEgMjAgOC43NVoiIGZpbGw9IiNmZmZmZmYiLz4gPHBhdGggZD0iTTEzLjUgMTEuMjVDMTMuMzA3MSAxMS4yMzUyIDEzLjEyNzYgMTEuMTQ1NSAxMyAxMUMxMi44NzcgMTAuODYyNSAxMi44MDkgMTAuNjg0NSAxMi44MDkgMTAuNUMxMi44MDkgMTAuMzE1NSAxMi44NzcgMTAuMTM3NSAxMyAxMEwxOS41IDMuNUMxOS41Njg3IDMuNDI2MzEgMTkuNjUxNSAzLjM2NzIxIDE5Ljc0MzUgMy4zMjYyMkMxOS44MzU1IDMuMjg1MjMgMTkuOTM0OCAzLjI2MzE5IDIwLjAzNTUgMy4yNjE0MUMyMC4xMzYyIDMuMjU5NjMgMjAuMjM2MiAzLjI3ODE2IDIwLjMyOTYgMy4zMTU4OEMyMC40MjMgMy4zNTM2IDIwLjUwNzggMy40MDk3NCAyMC41NzkgMy40ODA5NkMyMC42NTAzIDMuNTUyMTggMjAuNzA2NCAzLjYzNzAxIDIwLjc0NDEgMy43MzA0QzIwLjc4MTggMy44MjM3OSAyMC44MDA0IDMuOTIzODIgMjAuNzk4NiA0LjAyNDUyQzIwLjc5NjggNC4xMjUyMyAyMC43NzQ4IDQuMjI0NTQgMjAuNzMzOCA0LjMxNjU0QzIwLjY5MjggNC40MDg1NCAyMC42MzM3IDQuNDkxMzQgMjAuNTYgNC41NkwxNCAxMUMxMy44NzI0IDExLjE0NTUgMTMuNjkyOSAxMS4yMzUyIDEzLjUgMTEuMjVaIiBmaWxsPSIjZmZmZmZmIi8%2BIDwvZz4KDTwvc3ZnPg%3D%3D"></a>
</div>

---

### Map Charts

Map Charts let you visualise geographic data in different ways.

<picture>
    <source media="(prefers-color-scheme: dark)" srcset="./packages/ag-charts-website/public/images/readme-assets/map-dark.gif"/>
    <source media="(prefers-color-scheme: light)" srcset="./packages/ag-charts-website/public/images/readme-assets/map.gif"/>
    <img width="100%" alt="Preview of Map Charts from AG Charts" src="./packages/ag-charts-website/public/images/readme-assets/map-dark.gif"/>
</picture>

To create a Map Shape Series, use the map-shape series type and provide data and [topology](https://charts.ag-grid.com/javascript/map-topology/). These can be provided in either the chart or series objects.

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
<a href="https://charts.ag-grid.com/javascript/maps/"><img alt="Static Badge" src="https://img.shields.io/badge/Learn More-blue?style=for-the-badge&logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOIiAiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkIj4KDTwhLS0gVXBsb2FkZWQgdG86IFNWRyBSZXBvLCB3d3cuc3ZncmVwby5jb20sIFRyYW5zZm9ybWVkIGJ5OiBTVkcgUmVwbyBNaXhlciBUb29scyAtLT4KPHN2ZyB3aWR0aD0iODAwcHgiIGhlaWdodD0iODAwcHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KDTxnIGlkPSJTVkdSZXBvX2JnQ2FycmllciIgc3Ryb2tlLXdpZHRoPSIwIi8%2BCg08ZyBpZD0iU1ZHUmVwb190cmFjZXJDYXJyaWVyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KDTxnIGlkPSJTVkdSZXBvX2ljb25DYXJyaWVyIj4gPHBhdGggZD0iTTE4IDIwLjc1SDZDNS4yNzA2NSAyMC43NSA0LjU3MTE4IDIwLjQ2MDMgNC4wNTU0NiAxOS45NDQ1QzMuNTM5NzMgMTkuNDI4OCAzLjI1IDE4LjcyOTMgMy4yNSAxOFY2QzMuMjUgNS4yNzA2NSAzLjUzOTczIDQuNTcxMTggNC4wNTU0NiA0LjA1NTQ2QzQuNTcxMTggMy41Mzk3MyA1LjI3MDY1IDMuMjUgNiAzLjI1SDEyQzEyLjE5ODkgMy4yNSAxMi4zODk3IDMuMzI5MDIgMTIuNTMwMyAzLjQ2OTY3QzEyLjY3MSAzLjYxMDMyIDEyLjc1IDMuODAxMDkgMTIuNzUgNEMxMi43NSA0LjE5ODkxIDEyLjY3MSA0LjM4OTY4IDEyLjUzMDMgNC41MzAzM0MxMi4zODk3IDQuNjcwOTggMTIuMTk4OSA0Ljc1IDEyIDQuNzVINkM1LjY2ODQ4IDQuNzUgNS4zNTA1NCA0Ljg4MTcgNS4xMTYxMiA1LjExNjEyQzQuODgxNyA1LjM1MDU0IDQuNzUgNS42Njg0OCA0Ljc1IDZWMThDNC43NSAxOC4zMzE1IDQuODgxNyAxOC42NDk1IDUuMTE2MTIgMTguODgzOUM1LjM1MDU0IDE5LjExODMgNS42Njg0OCAxOS4yNSA2IDE5LjI1SDE4QzE4LjMzMTUgMTkuMjUgMTguNjQ5NSAxOS4xMTgzIDE4Ljg4MzkgMTguODgzOUMxOS4xMTgzIDE4LjY0OTUgMTkuMjUgMTguMzMxNSAxOS4yNSAxOFYxMkMxOS4yNSAxMS44MDExIDE5LjMyOSAxMS42MTAzIDE5LjQ2OTcgMTEuNDY5N0MxOS42MTAzIDExLjMyOSAxOS44MDExIDExLjI1IDIwIDExLjI1QzIwLjE5ODkgMTEuMjUgMjAuMzg5NyAxMS4zMjkgMjAuNTMwMyAxMS40Njk3QzIwLjY3MSAxMS42MTAzIDIwLjc1IDExLjgwMTEgMjAuNzUgMTJWMThDMjAuNzUgMTguNzI5MyAyMC40NjAzIDE5LjQyODggMTkuOTQ0NSAxOS45NDQ1QzE5LjQyODggMjAuNDYwMyAxOC43MjkzIDIwLjc1IDE4IDIwLjc1WiIgZmlsbD0iI2ZmZmZmZiIvPiA8cGF0aCBkPSJNMjAgOC43NUMxOS44MDE5IDguNzQ3NDEgMTkuNjEyNiA4LjY2NzU2IDE5LjQ3MjUgOC41Mjc0N0MxOS4zMzI0IDguMzg3MzcgMTkuMjUyNiA4LjE5ODExIDE5LjI1IDhWNC43NUgxNkMxNS44MDExIDQuNzUgMTUuNjEwMyA0LjY3MDk4IDE1LjQ2OTcgNC41MzAzM0MxNS4zMjkgNC4zODk2OCAxNS4yNSA0LjE5ODkxIDE1LjI1IDRDMTUuMjUgMy44MDEwOSAxNS4zMjkgMy42MTAzMiAxNS40Njk3IDMuNDY5NjdDMTUuNjEwMyAzLjMyOTAyIDE1LjgwMTEgMy4yNSAxNiAzLjI1SDIwQzIwLjE5ODEgMy4yNTI1OSAyMC4zODc0IDMuMzMyNDQgMjAuNTI3NSAzLjQ3MjUzQzIwLjY2NzYgMy42MTI2MyAyMC43NDc0IDMuODAxODkgMjAuNzUgNFY4QzIwLjc0NzQgOC4xOTgxMSAyMC42Njc2IDguMzg3MzcgMjAuNTI3NSA4LjUyNzQ3QzIwLjM4NzQgOC42Njc1NiAyMC4xOTgxIDguNzQ3NDEgMjAgOC43NVoiIGZpbGw9IiNmZmZmZmYiLz4gPHBhdGggZD0iTTEzLjUgMTEuMjVDMTMuMzA3MSAxMS4yMzUyIDEzLjEyNzYgMTEuMTQ1NSAxMyAxMUMxMi44NzcgMTAuODYyNSAxMi44MDkgMTAuNjg0NSAxMi44MDkgMTAuNUMxMi44MDkgMTAuMzE1NSAxMi44NzcgMTAuMTM3NSAxMyAxMEwxOS41IDMuNUMxOS41Njg3IDMuNDI2MzEgMTkuNjUxNSAzLjM2NzIxIDE5Ljc0MzUgMy4zMjYyMkMxOS44MzU1IDMuMjg1MjMgMTkuOTM0OCAzLjI2MzE5IDIwLjAzNTUgMy4yNjE0MUMyMC4xMzYyIDMuMjU5NjMgMjAuMjM2MiAzLjI3ODE2IDIwLjMyOTYgMy4zMTU4OEMyMC40MjMgMy4zNTM2IDIwLjUwNzggMy40MDk3NCAyMC41NzkgMy40ODA5NkMyMC42NTAzIDMuNTUyMTggMjAuNzA2NCAzLjYzNzAxIDIwLjc0NDEgMy43MzA0QzIwLjc4MTggMy44MjM3OSAyMC44MDA0IDMuOTIzODIgMjAuNzk4NiA0LjAyNDUyQzIwLjc5NjggNC4xMjUyMyAyMC43NzQ4IDQuMjI0NTQgMjAuNzMzOCA0LjMxNjU0QzIwLjY5MjggNC40MDg1NCAyMC42MzM3IDQuNDkxMzQgMjAuNTYgNC41NkwxNCAxMUMxMy44NzI0IDExLjE0NTUgMTMuNjkyOSAxMS4yMzUyIDEzLjUgMTEuMjVaIiBmaWxsPSIjZmZmZmZmIi8%2BIDwvZz4KDTwvc3ZnPg%3D%3D"></a>
</div>

## ⚡️ Quick Start

AG Grid is easy to set up - all you need to do is provide your data and define your column structure. Read on for vanilla JavaScript installation instructions, or refer to our framework-specific guides for <strong><a href="https://github.com/ag-grid/ag-charts/tree/latest/packages/ag-charts-react"><img src="https://github.com/ag-grid/ag-grid/blob/latest/documentation/ag-grid-docs/public/images/fw-logos/react.svg?raw=true" height="16" width="16" alt="React Logo"> React</a></strong>, <strong><a href="https://github.com/ag-grid/ag-charts/tree/latest/packages/ag-charts-angular"><img src="https://github.com/ag-grid/ag-grid/blob/latest/documentation/ag-grid-docs/public/images/fw-logos/angular.svg?raw=true" height="16" width="16" alt="Angular Logo"> Angular</a></strong> and <strong><a href="https://github.com/ag-grid/ag-charts/tree/latest/packages/ag-charts-vue3"><img src="https://github.com/ag-grid/ag-grid/blob/latest/documentation/ag-grid-docs/public/images/fw-logos/vue.svg?raw=true" height="16" width="16" alt="Vue Logo"> Vue</a></strong>.

### Installation

```sh
$ npm install ag-charts-community
```

### Setup

1. Provide a Container

```html
<!doctype html>
<html lang="en">
    <head>
        <title>AG Charts Quick Start</title>
        <!-- JavaScript Charts Core Library -->
        <script src="https://cdn.jsdelivr.net/npm/ag-charts-community/dist/umd/ag-charts-community.js"></script>
    </head>
    <body>
        <!-- Container for Chart -->
        <div id="myChart"></div>
        <!-- Charts configuration file -->
        <script src="index.js"></script>
    </body>
</html>
```

2. Instantiate the JavaScript Chart

```js
// Chart Options
const options = {};

// Create Chart
const chart = agCharts.AgCharts.create(options);
```

3. Define Chart Data and Series

```js
// Chart Options
const options = {
    // Container: HTML Element to hold the chart
    container: document.getElementById('myChart'),
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
};
```

> [!IMPORTANT]
> For more information on building JavaScript Charts with AG Charts, refer to our [Documentation](https://charts.ag-grid.com/javascript/quick-start/).

## 🤝 Support

### Enterprise Support

AG Charts Enterprise customers have access to dedicated support via [ZenDesk](https://ag-grid.zendesk.com/hc/en-us), which is monitored by our engineering teams.

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

<p>AG Grid is our flagship product, a <strong>fully-featured</strong> and <strong>highly customizable</strong> JavaScript Data Grid. It delivers <strong>outstanding performance</strong>, has <strong>no third-party dependencies</strong> and comes with support for <strong><a href="https://github.com/ag-grid/ag-grid/tree/latest/packages/ag-grid-react"><img src="https://github.com/ag-grid/ag-grid/blob/latest/documentation/ag-grid-docs/public/images/fw-logos/react.svg?raw=true" height="16" width="16" alt="React Logo"> React</a></strong>, <strong><a href="https://github.com/ag-grid/ag-grid/tree/latest/packages/ag-grid-angular"><img src="https://github.com/ag-grid/ag-grid/blob/latest/documentation/ag-grid-docs/public/images/fw-logos/angular.svg?raw=true" height="16" width="16" alt="Angular Logo"> Angular</a></strong> and <strong><a href="https://github.com/ag-grid/ag-grid/tree/latest/packages/ag-grid-vue"><img src="https://github.com/ag-grid/ag-grid/blob/latest/documentation/ag-grid-docs/public/images/fw-logos/vue.svg?raw=true" height="16" width="16" alt="Vue Logo"> Vue</a></strong>.</p>

AG Charts is used within AG Grid to power the [Integrated Charting](https://www.ag-grid.com/javascript-data-grid/integrated-charts/) feature.

Learn more at [ag-grid.com](https://www.ag-grid.com/)

<div align="center">
    
<hr/>

<strong>Follow us to keep up to date with all the latest news from AG Grid:</strong>

<a href="https://x.com/ag_grid"><img src="https://img.shields.io/badge/-X%20(Twitter)-black?style=for-the-badge&logo=x" alt="Twitter Badge" height="36"></a>
<a href="https://www.linkedin.com/company/ag-grid/"><img src="https://img.shields.io/badge/-LinkedIn-blue?style=for-the-badge&logo=linkedin" alt="LinkedIn Badge" height="36"></a>
<a href="https://www.youtube.com/c/ag-grid"><img src="https://img.shields.io/badge/-YouTube-red?style=for-the-badge&logo=youtube" alt="YouTube Badge" height="36"></a>
<a href="https://blog.ag-grid.com"><img src="https://img.shields.io/badge/-Blog-grey?style=for-the-badge&logo=rss" alt="Blog Badge" height="36"></a>

</div>
