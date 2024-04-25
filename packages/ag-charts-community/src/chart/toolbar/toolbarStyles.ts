import { ToolbarPosition } from './toolbarTypes';

export const block = 'ag-charts-toolbar';
export const elements = {
    align: `${block}__align`,
    button: `${block}__button`,
    icon: `${block}__icon`,
    label: `${block}__label`,
};
export const modifiers = {
    [ToolbarPosition.Top]: `${block}--top`,
    [ToolbarPosition.Right]: `${block}--right`,
    [ToolbarPosition.Bottom]: `${block}--bottom`,
    [ToolbarPosition.Left]: `${block}--left`,
    [ToolbarPosition.FloatingTop]: `${block}--floating-top`,
    [ToolbarPosition.FloatingBottom]: `${block}--floating-bottom`,
    hidden: `${block}--hidden`,
    preventFlash: `${block}--prevent-flash`,
    floatingHidden: `${block}--floating-hidden`,
    align: {
        start: `${elements.align}--start`,
        center: `${elements.align}--center`,
        end: `${elements.align}--end`,
    },
    button: {
        hidden: `${elements.button}--hidden`,
    },
};

export const css = `
.${block} {
    align-items: center;
    background: var(--ag-charts-toolbar-background-color);
    border-bottom: var(--ag-charts-toolbar-border-critical);
    border-top: var(--ag-charts-toolbar-border-critical);
    border-left: var(--ag-charts-toolbar-border);
    border-right: var(--ag-charts-toolbar-border);
    display: flex;
    flex-wrap: nowrap;
    opacity: 1;
    position: absolute;
    transform: translateY(0);
    transition: opacity 0.2s ease-in-out, transform 0.2s ease-in-out;
}

.${modifiers.hidden},
.${modifiers.preventFlash} {
    visibility: hidden;
}

.${modifiers.floatingHidden} {
    opacity: 0;
    transition: opacity 0.4s ease-in-out;
}

.${modifiers[ToolbarPosition.Top]},
.${modifiers[ToolbarPosition.Bottom]} {
    flex-direction: row;
    height: var(--ag-charts-toolbar-size);
    padding: 0 var(--ag-charts-toolbar-padding);
    width: 100%;
}

.${modifiers[ToolbarPosition.Left]},
.${modifiers[ToolbarPosition.Right]} {
    flex-direction: column;
    padding: var(--ag-charts-toolbar-padding) 0;
    width: var(--ag-charts-toolbar-size);
}

.${modifiers[ToolbarPosition.FloatingTop]},
.${modifiers[ToolbarPosition.FloatingBottom]} {
    background: none;
    border: none;
    flex-direction: row;
    height: var(--ag-charts-toolbar-size);
    overflow: hidden;
    padding: 0 var(--ag-charts-toolbar-padding);
    pointer-events: none;
    width: 100%;
}

.${elements.align} {
    display: flex;
    flex-direction: inherit;
    flex-wrap: inherit;
    max-width: 100%;
}

.${modifiers.align.center},
.${modifiers.align.end} {
    margin-left: auto;
}

.${modifiers[ToolbarPosition.Left]} .${modifiers.align.center},
.${modifiers[ToolbarPosition.Left]} .${modifiers.align.end},
.${modifiers[ToolbarPosition.Right]} .${modifiers.align.center},
.${modifiers[ToolbarPosition.Right]} .${modifiers.align.end} {
    margin-left: 0;
    margin-top: auto;
}

.${modifiers[ToolbarPosition.FloatingTop]} .${elements.align},
.${modifiers[ToolbarPosition.FloatingBottom]} .${elements.align} {
    gap: var(--ag-charts-toolbar-gap);
    transition: transform 0.4s ease-in-out;
}

.${elements.button} {
    align-items: center;
    border-radius: var(--ag-charts-button-radius);
    color: var(--ag-charts-toolbar-foreground-color);
    display: flex;
    font-size: 14px;
    font-weight: 500;
    justify-content: center;
    margin: 0;
    padding: var(--ag-charts-button-padding);
    pointer-events: all;
    transition: background-color .25s ease-in-out;
}

.${modifiers[ToolbarPosition.Left]} .${elements.button},
.${modifiers[ToolbarPosition.Right]} .${elements.button} {
    height: var(--ag-charts-toolbar-size);
    max-width: 100%;
    overflow: hidden;
}

.${modifiers[ToolbarPosition.FloatingTop]} .${elements.button},
.${modifiers[ToolbarPosition.FloatingBottom]} .${elements.button} {
    background: var(--ag-charts-toolbar-background-color);
    border: var(--ag-charts-toolbar-border-critical);
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

.${elements.button}:not([disabled]) {
    cursor: pointer;
}

.${elements.icon} {
    height: 1.2em;
    width: 1.2em;
}

.${elements.icon} + .${elements.label} {
    margin-left: var(--ag-charts-size);
}

.${elements.icon},
.${elements.label} {
    pointer-events: none;
}

`;
