export const block = 'ag-charts-toolbar';
export const elements = {
    button: `${block}__button`,
};
export const modifiers = {
    top: `${block}--top`,
    right: `${block}--right`,
    bottom: `${block}--bottom`,
    left: `${block}--left`,
    button: {
        hidden: `${elements.button}--hidden`,
    },
};

export const css = `
.${block} {
    background: var(--ag-charts-header-background-color);
    border-bottom: var(--ag-charts-borders-critical);
    border-top: var(--ag-charts-borders-critical);
    border-left: var(--ag-charts-borders);
    border-right: var(--ag-charts-borders);
    border-color: var(--ag-charts-border-color);
    display: flex;
    overflow: hidden;
    position: absolute;
    visibility: hidden;
}

.${modifiers.top}, .${modifiers.bottom} {
    flex-direction: row;
    height: var(--ag-charts-header-height);
    padding: 0 var(--ag-charts-horizontal-padding);
}

.${modifiers.left}, .${modifiers.right} {
    flex-direction: column;
    padding: var(--ag-charts-horizontal-padding) 0;
    width: var(--ag-charts-header-height);
}

.${elements.button} {
    align-items: center;
    color: var(--ag-charts-header-foreground-color);
    display: flex;
    font-weight: 500;
    height: 100%;
    justify-content: center;
    min-width: var(--ag-charts-header-height);
    padding: 0 var(--ag-charts-horizontal-padding);
}

.${modifiers.left} .${elements.button}, .${modifiers.right} .${elements.button} {
    height: 48px;
}

.${modifiers.button.hidden} {
    display: none;
}

.${elements.button}:hover {
    background: var(--ag-charts-hover-color);
}
`;
