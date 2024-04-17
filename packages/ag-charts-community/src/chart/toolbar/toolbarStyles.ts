export const block = 'ag-charts-toolbar';
export const elements = {
    button: `${block}__button`,
    start: `${block}__start`,
    center: `${block}__center`,
    end: `${block}__end`,
    icon: `${block}__icon`,
    label: `${block}__label`,
};
export const modifiers = {
    top: `${block}--top`,
    right: `${block}--right`,
    bottom: `${block}--bottom`,
    left: `${block}--left`,
    hidden: `${block}--hidden`,
    preventFlash: `${block}--prevent-flash`,
    button: {
        hidden: `${elements.button}--hidden`,
    },
};

export const css = `
.${block} {
    background: var(--ag-charts-toolbar-background-color);
    border-bottom: var(--ag-charts-toolbar-border-critical);
    border-top: var(--ag-charts-toolbar-border-critical);
    border-left: var(--ag-charts-toolbar-border);
    border-right: var(--ag-charts-toolbar-border);
    display: flex;
    flex-wrap: wrap;
    position: absolute;
}

.${modifiers.hidden},
.${modifiers.preventFlash} {
    visibility: hidden;
}

.${modifiers.top}, .${modifiers.bottom} {
    flex-direction: row;
    height: var(--ag-charts-toolbar-size);
    padding: 0 var(--ag-charts-toolbar-padding);
}

.${modifiers.left}, .${modifiers.right} {
    flex-direction: column;
    padding: var(--ag-charts-toolbar-padding) 0;
    width: var(--ag-charts-toolbar-size);
}

.${elements.start}, .${elements.center}, .${elements.end} {
    display: flex;
    flex-direction: inherit;
    flex-wrap: inherit;
    max-width: 100%;
}

.${modifiers.top} .${elements.center},
.${modifiers.top} .${elements.end},
.${modifiers.bottom} .${elements.center},
.${modifiers.bottom} .${elements.end} {
    margin-left: auto;
}

.${modifiers.left} .${elements.center},
.${modifiers.left} .${elements.end},
.${modifiers.right} .${elements.center},
.${modifiers.right} .${elements.end} {
    margin-top: auto;
}

.${elements.button} {
    align-items: center;
    color: var(--ag-charts-toolbar-foreground-color);
    display: flex;
    font-weight: 500;
    height: 100%;
    justify-content: center;
    margin: 0;
    padding: 0;
}

.${modifiers.top} .${elements.button},
.${modifiers.bottom} .${elements.button} {
    min-width: var(--ag-charts-toolbar-size);
    padding: 0 var(--ag-charts-toolbar-padding);
}

.${modifiers.left} .${elements.button},
.${modifiers.right} .${elements.button} {
    height: var(--ag-charts-toolbar-size);
    max-width: 100%;
    overflow: hidden;
}

.${modifiers.button.hidden} {
    display: none;
}

.${elements.button}:hover {
    background: var(--ag-charts-toolbar-hover-color);
}

.${elements.button}:disabled {
    background: var(--ag-charts-toolbar-disabled-background-color);
    color: var(--ag-charts-toolbar-disabled-foreground-color);
}


.${elements.icon} + .${elements.label} {
    margin-left: var(--ag-charts-size);
}

`;
