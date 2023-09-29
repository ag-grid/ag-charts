# AG Charts Development

Prerequisites:

0. Install Yarn and Nx: `npm i -g yarn nx`
1. Install all dependencies: `yarn install`
2. [Optional] Install the [Nx Console VS Code extension](https://marketplace.visualstudio.com/items?itemName=nrwl.angular-console) to run Nx commands within VS Code

## Common commands

| Command              | Description                                                              |
| -------------------- | ------------------------------------------------------------------------ |
| `nx dev`             | Run Astro dev server                                                     |
| `nx build`           | Build all the packages                                                   |
| `nx lint`            | Check all packages with ESLint                                           |
| `nx run lint -c fix` | Fix all auto-fixable ESLint errors                                       |
| `nx test`            | Run all tests                                                            |
| `nx format --all`    | Reformat all packages with prettier                                      |
| `nx blt`             | Run all `build`, `lint`, `format` and `test` targets                     |
| `nx reset`           | Clear the NX cache                                                       |
| `nx build-tsc`       | Run alternative `tsc` compile (provides more complete compile reporting) |

To skip the `nx` cache use `--skip-nx-cache`.

## Advanced Test Commands

| Command                                                    | Description                                     |
| ---------------------------------------------------------- | ----------------------------------------------- |
| `nx run-many -t test`                                      | Run all tests                                   |
| `nx run-many -t test --output-style stream`                | Run all tests and stream output                 |
| `nx run-many -t test -c update`                            | Update test snapshots                           |
| `nx test ag-charts-community -u`                           | Update test snapshots for `ag-charts-community` |
| `nx test ag-charts-community --watch`                      | Run Jest watch for `ag-charts-community`        |
| `nx test ag-charts-community --testFile dataModel.test.ts` | Run Jest for a specific file                    |

## Advanced Website Commands

| Command                                            | Description                                                |
| -------------------------------------------------- | ---------------------------------------------------------- |
| `nx build ag-charts-website`                       | Run the local website build                                |
| `nx preview ag-charts-website`                     | Preview the static local website build                     |
| `nx build ag-charts-website -c staging`            | Run the website build for staging env                      |
| `nx preview ag-charts-website -c staging`          | Preview the static website build for staging env           |
| `nx build ag-charts-website -c production`         | Run the website build for production env                   |
| `nx preview ag-charts-website -c production`       | Preview the static website build for production env        |
| `nx generate-gallery-thumbnails ag-charts-website` | Generate gallery thumbnails in `public/gallery/thumbnails` |

## Troubleshooting

### MacOS Development Machine Setup

Recommended machine setup:

-   Install [Homebrew](https://brew.sh/) as a package manager.
-   Install NVM to manage Node.js version:
    ```bash
    brew install nvm
    ```
-   Install Node.js 18:
    ```
    nvm install 18
    ```

### Yarn/NPM install of `canvas` fails on `node-gyp` compile step (M1/M2 processor).

Try installing `cairo` and other dependencies using Homebrew:

```bash
$ brew install pkg-config cairo pango libpng jpeg giflib librsvg
```
