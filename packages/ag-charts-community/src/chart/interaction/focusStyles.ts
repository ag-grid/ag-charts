export const block = 'ag-charts-focus';
export const elements = {
    indicator: `${block}__indicator`,
};
export const modifiers = {
    hidden: `${block}--hidden`,
};

export const css = `
.${block} {
    position: absolute;
    display: block;
    pointer-events: none;
    user-select: none;
    border: var(--ag-charts-focus-border);
    box-shadow: var(--ag-charts-focus-border-shadow);
}

.${modifiers.hidden} {
    visibility: hidden;
}
`;
