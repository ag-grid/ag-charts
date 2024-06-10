import { ToolbarPosition } from './toolbarTypes';

export const block = 'ag-charts-toolbar';
export const elements = {
    align: 'ag-charts-toolbar__align',
    button: 'ag-charts-toolbar__button',
    icon: 'ag-charts-toolbar__icon',
    label: 'ag-charts-toolbar__label',
};
export const modifiers = {
    [ToolbarPosition.Top]: 'ag-charts-toolbar--top',
    [ToolbarPosition.Right]: 'ag-charts-toolbar--right',
    [ToolbarPosition.Bottom]: 'ag-charts-toolbar--bottom',
    [ToolbarPosition.Left]: 'ag-charts-toolbar--left',
    [ToolbarPosition.Floating]: 'ag-charts-toolbar--floating',
    [ToolbarPosition.FloatingTop]: 'ag-charts-toolbar--floating-top',
    [ToolbarPosition.FloatingBottom]: 'ag-charts-toolbar--floating-bottom',
    hidden: 'ag-charts-toolbar--hidden',
    preventFlash: 'ag-charts-toolbar--prevent-flash',
    floatingHidden: 'ag-charts-toolbar--floating-hidden',
    align: {
        start: 'ag-charts-toolbar__align--start',
        center: 'ag-charts-toolbar__align--center',
        end: 'ag-charts-toolbar__align--end',
    },
    button: {
        active: `ag-charts-toolbar__button--active`,
        hiddenValue: `ag-charts-toolbar__button--hidden-value`,
        hiddenToggled: `ag-charts-toolbar__button--hidden-toggled`,
    },
};

export const css = `
.${block} {
    align-items: center;
    background: none;
    border: none;
    display: flex;
    flex-wrap: nowrap;
    opacity: 1;
    padding: 0 var(--ag-charts-toolbar-padding);
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
    width: 100%;
}

.${modifiers[ToolbarPosition.Left]},
.${modifiers[ToolbarPosition.Right]} {
    flex-direction: column;
    padding: var(--ag-charts-toolbar-padding) 0;
}

.${modifiers[ToolbarPosition.Floating]},
.${modifiers[ToolbarPosition.FloatingTop]},
.${modifiers[ToolbarPosition.FloatingBottom]} {
    background: none;
    border: none;
    flex-direction: row;
    overflow: hidden;
    pointer-events: none;
    width: 100%;
}

.${modifiers[ToolbarPosition.Floating]} {
    padding: 0;
    width: auto;
}

.${modifiers[ToolbarPosition.FloatingTop]} {
    height: calc(var(--ag-charts-toolbar-size) + 10px);
    padding-top: 10px;
}

.${modifiers[ToolbarPosition.FloatingBottom]} {
    height: calc(var(--ag-charts-toolbar-size) + 10px);
    padding-bottom: 10px;
}

.${elements.align} {
    display: flex;
    flex-direction: inherit;
    flex-wrap: inherit;
    gap: var(--ag-charts-toolbar-gap);
    max-width: 100%;
    width: 100%;
}

.${modifiers.align.start} {
    justify-content: start;
}

.${modifiers.align.center} {
    justify-content: center;
}

.${modifiers.align.end} {
    justify-content: end;
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
    transition: transform 0.4s ease-in-out;
    width: auto;
}

.${elements.button} {
    align-items: center;
    background: var(--ag-charts-toolbar-background-color);
    border: var(--ag-charts-toolbar-border);
    border-radius: var(--ag-charts-button-radius);
    color: var(--ag-charts-toolbar-foreground-color);
    display: flex;
    font-size: 14px;
    font-weight: 500;
    height: var(--ag-charts-toolbar-size);
    justify-content: center;
    margin: 0;
    pointer-events: all;
    transition: background-color .25s ease-in-out;
    width: var(--ag-charts-toolbar-size);
}

.${modifiers[ToolbarPosition.Left]} .${elements.button},
.${modifiers[ToolbarPosition.Right]} .${elements.button} {
    max-width: 100%;
    overflow: hidden;
}

.${modifiers[ToolbarPosition.Floating]} .${elements.button},
.${modifiers[ToolbarPosition.FloatingTop]} .${elements.button},
.${modifiers[ToolbarPosition.FloatingBottom]} .${elements.button} {
    background: var(--ag-charts-toolbar-background-color);
    border: var(--ag-charts-toolbar-border);
}

.${modifiers.button.hiddenValue},
.${modifiers.button.hiddenToggled} {
    display: none;
}

.${elements.button}:hover,
.${elements.button}:focus,
.${modifiers.button.active} {
    background: var(--ag-charts-toolbar-active-color);
}

.${elements.button}[aria-disabled="true"] {
    background: var(--ag-charts-toolbar-disabled-background-color);
    color: var(--ag-charts-toolbar-disabled-foreground-color);
}

.${elements.button}:not([aria-disabled="true"]) {
    cursor: pointer;
}

.${elements.icon} {
    height: 1.2em;
    width: 1.2em;
}

.${elements.icon} + .${elements.label} {
    margin-left: var(--ag-charts-toolbar-gap);
}

.${elements.icon},
.${elements.label} {
    pointer-events: none;
}

`;
