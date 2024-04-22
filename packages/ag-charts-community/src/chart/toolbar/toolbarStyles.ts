import { ToolbarPosition } from './toolbarTypes';

export const block = 'ag-charts-toolbar';
export const elements = {
    group: `${block}__group`,
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
    group: {
        start: `${elements.group}--start`,
        center: `${elements.group}--center`,
        end: `${elements.group}--end`,
    },
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
    align-items: center;
    position: absolute;
}

.${modifiers.hidden},
.${modifiers.preventFlash},
.${modifiers.floatingHidden} {
    visibility: hidden;
}

.${modifiers[ToolbarPosition.Top]},
.${modifiers[ToolbarPosition.Bottom]} {
    flex-direction: row;
    height: var(--ag-charts-toolbar-size);
    padding: 0 var(--ag-charts-toolbar-padding);
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
    padding: 0 var(--ag-charts-toolbar-padding);
}

.${elements.group} {
    display: flex;
    flex-direction: inherit;
    flex-wrap: inherit;
    max-width: 100%;
}

.${modifiers.group.center},
.${modifiers.group.end} {
    margin-left: auto;
}

.${modifiers[ToolbarPosition.Left]} .${modifiers.group.center},
.${modifiers[ToolbarPosition.Left]} .${modifiers.group.end},
.${modifiers[ToolbarPosition.Right]} .${modifiers.group.center},
.${modifiers[ToolbarPosition.Right]} .${modifiers.group.end} {
    margin-left: 0;
    margin-top: auto;
}

.${modifiers[ToolbarPosition.FloatingTop]} .${elements.group},
.${modifiers[ToolbarPosition.FloatingBottom]} .${elements.group} {
    gap: var(--ag-charts-toolbar-gap);
}

.${elements.button} {
    align-items: center;
    color: var(--ag-charts-toolbar-foreground-color);
    display: flex;
    font-weight: 500;
    justify-content: center;
    margin: 0;
    padding: var(--ag-charts-button-padding);
    border-radius: var(--ag-charts-button-radius);
    transition: background-color .25s ease-in-out;
}

.${modifiers[ToolbarPosition.Top]} .${elements.button},
.${modifiers[ToolbarPosition.Bottom]} .${elements.button},
.${modifiers[ToolbarPosition.FloatingTop]} .${elements.button},
.${modifiers[ToolbarPosition.FloatingBottom]} .${elements.button} {
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

.${elements.icon} + .${elements.label} {
    margin-left: var(--ag-charts-size);
}

`;
