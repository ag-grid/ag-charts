# AG Charts

## Development

Prerequisites:

1. Install all dependencies: `npm install`
2. [Optional] Install `nx` globally: `npm install --g nx`

    Or alternatively use `npx nx`

3. [Optional] Install the [Nx Console VS Code extension](https://marketplace.visualstudio.com/items?itemName=nrwl.angular-console) to run Nx commands within VS Code

### AG Charts Website

To run the local dev server:

```
nx run ag-charts-website:watch:dev

# This runs a nx watcher to build `ag-charts-community`, and the website dev server
# ie, it combines the following commands:
nx run ag-charts-community:watch:build
nx run ag-charts-website:dev
```

To run the website build:

```
nx run ag-charts-website:build
```

To preview the built website:

```
nx run ag-charts-website:preview
```
