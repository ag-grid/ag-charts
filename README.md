# AG Charts

## Development

Prerequisites:

1. Install all dependencies: `npm install`
2. [Optional] Install `nx` globally: `npm install --g nx`

    Or alternatively use `npx nx`

3. [Optional] Install the [Nx Console VS Code extension](https://marketplace.visualstudio.com/items?itemName=nrwl.angular-console) to run Nx commands within VS Code

### Common commands

| Command                 | Description                      |
| ----------------------- | -------------------------------- |
| `nx build`              | Build all the packages           |
| `nx test`               | Run all tests                    |
| `nx lint`               | Check all packages with ESLint   |
| `nx format:check --all` | Check all packages with prettier |
| `nx reset`              | Clear the NX cache               |

### AG Charts Website

To run the local dev server:

```
nx run ag-charts-website:watch:dev
```

To run the website build:

```
nx run ag-charts-website:build
```

To preview the built website:

```
nx run ag-charts-website:preview
```
