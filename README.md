# AG Charts

## Development

Prerequisites:

0. Install Yarn and Nx: `npm i -g yarn nx`
1. Install all dependencies: `yarn install`
2. [Optional] Install the [Nx Console VS Code extension](https://marketplace.visualstudio.com/items?itemName=nrwl.angular-console) to run Nx commands within VS Code

## Development in a VSCode Devcontainer (includes all test dependencies)

-   Install [Docker Desktop](https://www.docker.com/products/docker-desktop).
-   Install [VSCode](https://code.visualstudio.com/).
    -   Install the [Remote-Containers extension](vscode:extension/ms-vscode-remote.remote-containers).
-   Launch the container:
    -   Open VSCode.
    -   Open the command-palette (`CMD`+`SHIFT`+`P`).
    -   Choose `Remote-Containers: Clone Repository in Container Volume...`.
    -   Choose `Clone a repository from GitHub in a Container Volume`.
    -   Enter `ag-grid/ag-charts-test`.
    -   Choose `latest` branch.

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
nx dev
```

To run the website build:

```
nx run ag-charts-website:build
```

To preview the built website:

```
nx run ag-charts-website:preview
```
