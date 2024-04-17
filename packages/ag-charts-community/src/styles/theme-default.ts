export default `
.ag-charts-theme-default,
.ag-charts-theme-default-dark {
    /* Colors */
    --ag-charts-active-color: var(--ag-active-color, #2196f3);
    --ag-charts-background-color: var(--ag-background-color, #fff);
    --ag-charts-foreground-color: var(--ag-foreground-color, #181d1f);
    --ag-charts-border-color: var(--ag-border-color, #dddddd);

    /* Sizing */
    --ag-charts-font-size: var(--ag-font-size, 14px);
    --ag-charts-size: var(--ag-grid-size, 8px);

    /* Borders */
    --ag-charts-border: var(--ag-borders, solid 1px);
    --ag-charts-border-critical: var(--ag-borders-critical, solid 1px);

    /* Toolbar */
    --ag-charts-toolbar-foreground-color: var(--ag-header-foreground-color, var(--ag-charts-foreground-color));
    --ag-charts-toolbar-background-color: var(
        --ag-header-background-color,
        color-mix(in srgb, var(--ag-charts-background-color), var(--ag-charts-foreground-color) 2%)
    );
    --ag-charts-toolbar-size: var(--ag-header-height, 48px);
    --ag-charts-toolbar-padding: calc(var(--ag-charts-size) * 2);
    --ag-charts-toolbar-border: var(--ag-charts-border, solid 1px) var(--ag-charts-border-color);
    --ag-charts-toolbar-border-critical: var(--ag-charts-border-critical, solid 1px) var(--ag-charts-border-color);
    --ag-charts-toolbar-hover-color: var(
        --ag-row-hover-color,
        color-mix(in srgb, transparent, var(--ag-charts-active-color) 12%)
    );

    /* Icons */
    --ag-charts-icon-font-family: 'agChartsDefault';
    --ag-charts-icon-font-weight: normal;
    --ag-charts-icon-font-color: color-mix(in srgb, transparent, var(--ag-charts-foreground-color), 90%);
}

`;
