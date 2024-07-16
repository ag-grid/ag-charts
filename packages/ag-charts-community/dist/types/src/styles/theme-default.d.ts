declare const _default: "\n.ag-charts-theme-default,\n.ag-charts-theme-default-dark {\n    /* Colors */\n    --ag-charts-active-color: var(--ag-active-color, #2196f3);\n    --ag-charts-background-color: var(--ag-background-color, #fff);\n    --ag-charts-foreground-color: var(--ag-foreground-color, #181d1f);\n    --ag-charts-border-color: var(--ag-border-color, #dddddd);\n\n    /* Sizing */\n    --ag-charts-font-size: var(--ag-font-size, 14px);\n    --ag-charts-size: var(--ag-grid-size, 8px);\n\n    /* Borders */\n    --ag-charts-border: var(--ag-borders, solid 1px);\n    --ag-charts-border-critical: var(--ag-borders-critical, solid 1px);\n\n    /* Toolbar */\n    --ag-charts-toolbar-foreground-color: var(--ag-header-foreground-color, var(--ag-charts-foreground-color));\n    --ag-charts-toolbar-background-color: var(\n        --ag-header-background-color,\n        color-mix(in srgb, var(--ag-charts-background-color), var(--ag-charts-foreground-color) 2%)\n    );\n    --ag-charts-toolbar-size: var(--ag-header-height, 48px);\n    --ag-charts-toolbar-padding: calc(var(--ag-charts-size) * 2);\n    --ag-charts-toolbar-border: var(--ag-charts-border, solid 1px) var(--ag-charts-border-color);\n    --ag-charts-toolbar-border-critical: var(--ag-charts-border-critical, solid 1px) var(--ag-charts-border-color);\n    --ag-charts-toolbar-hover-color: color-mix(in srgb, var(--ag-charts-background-color), var(--ag-charts-active-color) 12%);\n    --ag-charts-toolbar-disabled-foreground-color: var(\n        --ag-disabled-foreground-color,\n        color-mix(in srgb, transparent, var(--ag-charts-toolbar-foreground-color) 50%)\n    );\n    --ag-charts-toolbar-disabled-background-color: var(\n        --ag-input-disabled-background-color,\n        color-mix(in srgb, var(--ag-charts-toolbar-background-color), var(--ag-charts-toolbar-foreground-color) 6%)\n    );\n    --ag-charts-toolbar-gap: var(--ag-charts-size);\n\n    /* Buttons */\n    --ag-charts-button-padding: var(--ag-charts-size);\n    --ag-charts-button-radius: var(--ag-border-radius, 4px);\n\n    /* Focus Indicator */\n    --ag-charts-focus-border: solid 2px var(--ag-input-focus-border-color, var(--ag-charts-active-color));\n    --ag-charts-focus-border-shadow: var(--ag-input-focus-box-shadow, 0 0 0 3px color-mix(in srgb, transparent, var(--ag-charts-focus-border) 47%));\n\n    /* Icons */\n    --ag-charts-icon-font-family: 'agChartsDefault';\n    --ag-charts-icon-font-weight: normal;\n    --ag-charts-icon-font-color: color-mix(in srgb, transparent, var(--ag-charts-foreground-color), 90%);\n}\n\n";
export default _default;
