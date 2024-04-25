export const block = 'ag-charts-focus';
export const elements = {
    wrapper: `${block}__wrapper`,
    indicator: `${block}__indicator`,
};
export const modifiers = {
    hidden: `${block}--hidden`,
};

export const css = `
.${block}.${elements.wrapper} {
    position: absolute;
    display: block;
    pointer-events: none;
    user-select: none;
    overflow: hidden;
    top: 0;
    left: 0;
}

.${block}.${elements.indicator} {
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
