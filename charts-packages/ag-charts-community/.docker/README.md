# Docker-based ag-charts-community testing environment

## First initialisation

```bash
(cd charts-packages/ag-charts-community && npm run docker:init)
```

## Running tests (interactive mode)

```bash
(cd charts-packages/ag-charts-community && npm run docker:test-watch)
```

## Running tests (snapshot update mode)

```bash
(cd charts-packages/ag-charts-community && npm run docker:test-update)
```

## Cleaning setup

```bash
(cd charts-packages/ag-charts-community && npm run docker:clean)
```
