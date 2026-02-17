# AG Charts Server-Side Rendering Examples

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/ag-grid/ag-charts-server-side-example)

Render AG Charts to PNG and JPEG images in Node.js, without a browser. See the [documentation](https://www.ag-grid.com/charts/server-side-rendering/) for full details.

## Quick Start

```bash
npm install
npm run basic
```

The rendered chart is written to `output/chart.png`.

## Examples

| Script                 | Command          | Description                                                      |
| ---------------------- | ---------------- | ---------------------------------------------------------------- |
| `01-basic-render.ts`   | `npm run basic`  | Renders a bar chart to PNG                                       |
| `02-jpeg-output.ts`    | `npm run jpeg`   | JPEG output with quality and high-DPI settings                   |
| `03-express-server.ts` | `npm run server` | HTTP endpoint serving chart images at `localhost:3000/chart.png` |

## Codespaces

Click the badge above to launch a ready-to-use environment. Once open:

```bash
npm run server
```

Codespaces auto-forwards port 3000 and provides a URL to view the chart in your browser.

## Requirements

-   Node.js 20.0.0 or later
-   `skia-canvas` native dependencies (included in the Codespaces image)
