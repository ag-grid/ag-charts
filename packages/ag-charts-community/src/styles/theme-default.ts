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

    /* Layout */
    --ag-charts-align: center;
    --ag-charts-justify: center;

    /* Toolbar */
    --ag-charts-toolbar-foreground-color: var(--ag-header-foreground-color, var(--ag-charts-foreground-color));
    --ag-charts-toolbar-background-color: var(
        --ag-header-background-color,
        color-mix(in srgb, var(--ag-charts-background-color), var(--ag-charts-foreground-color) 2%)
    );
    --ag-charts-toolbar-size: 34px;
    --ag-charts-toolbar-padding: calc(var(--ag-charts-size) * 2);
    --ag-charts-toolbar-border: var(--ag-charts-border-critical, solid 1px) var(--ag-charts-border-color);
    --ag-charts-toolbar-hover-color: color-mix(in srgb, var(--ag-charts-background-color), var(--ag-charts-active-color) 12%);
    --ag-charts-toolbar-disabled-foreground-color: var(
        --ag-disabled-foreground-color,
        color-mix(in srgb, transparent, var(--ag-charts-toolbar-foreground-color) 50%)
    );
    --ag-charts-toolbar-disabled-background-color: var(
        --ag-input-disabled-background-color,
        color-mix(in srgb, var(--ag-charts-toolbar-background-color), var(--ag-charts-toolbar-foreground-color) 6%)
    );
    --ag-charts-toolbar-gap: var(--ag-charts-size);

    /* Buttons */
    --ag-charts-button-radius: var(--ag-border-radius, 4px);

    /* Focus Indicator */
    --ag-charts-focus-border: solid 2px var(--ag-input-focus-border-color, var(--ag-charts-active-color));
    --ag-charts-focus-border-shadow: var(--ag-input-focus-box-shadow, 0 0 0 3px color-mix(in srgb, transparent, var(--ag-charts-focus-border) 47%));

    /* Icons */
    --ag-charts-icon-font-family: 'agChartsDefault';
    --ag-charts-icon-font-weight: normal;
    --ag-charts-icon-font-color: color-mix(in srgb, transparent, var(--ag-charts-foreground-color), 90%);
}

`;
