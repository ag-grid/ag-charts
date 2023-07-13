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
    -   Enter `ag-grid/ag-charts`.
    -   Choose `latest` branch.

### Common commands

| Command     | Description                         |
| ----------- | ----------------------------------- |
| `nx dev`    | Run Astro dev server                |
| `nx build`  | Build all the packages              |
| `nx lint`   | Check all packages with ESLint      |
| `nx test`   | Run all tests                       |
| `nx format` | Reformat all packages with prettier |
| `nx reset`  | Clear the NX cache                  |

### Advanced Test Commands

| Command                                                    | Description                                     |
| ---------------------------------------------------------- | ----------------------------------------------- |
| `nx run-many -t test`                                      | Run all tests                                   |
| `nx run-many -t test --output-style stream`                | Run all tests and stream output                 |
| `nx run-many -t test -c update`                            | Update test snapshots                           |
| `nx test ag-charts-community -u`                           | Update test snapshots for `ag-charts-community` |
| `nx test ag-charts-community --watch`                      | Run Jest watch for `ag-charts-community`        |
| `nx test ag-charts-community --testFile dataModel.test.ts` | Run Jest for a specific file                    |

### Advanced Website Commands

| Command                            | Description                      |
| ---------------------------------- | -------------------------------- |
| `nx run ag-charts-website:build`   | Run the website build            |
| `nx run ag-charts-website:preview` | Preview the static website build |
