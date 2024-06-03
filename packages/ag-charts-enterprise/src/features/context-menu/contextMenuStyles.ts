export const DEFAULT_CONTEXT_MENU_CLASS = 'ag-chart-context-menu';
export const DEFAULT_CONTEXT_MENU_DARK_CLASS = `ag-charts-dark-context-menu`;

export const defaultContextMenuCss = `
.${DEFAULT_CONTEXT_MENU_CLASS} {
    background: rgb(248, 248, 248);
    border: 1px solid #babfc7;
    border-radius: 5px;
    box-shadow: 0 1px 4px 1px rgba(186, 191, 199, 0.4);
    color: rgb(24, 29, 31);
    font: 13px Verdana, sans-serif;
    transition: transform 0.1s ease;
    white-space: nowrap;
    z-index: 99999;
}

.${DEFAULT_CONTEXT_MENU_CLASS}.${DEFAULT_CONTEXT_MENU_DARK_CLASS} {
    color: white;
    background: #15181c;
}

.${DEFAULT_CONTEXT_MENU_CLASS}__cover {
    position: fixed;
    left: 0px;
    top: 0px;
}

.${DEFAULT_CONTEXT_MENU_CLASS}__menu {
    display: flex;
    flex-direction: column;
    padding: 0.5em 0;
}

.${DEFAULT_CONTEXT_MENU_CLASS}__item {
    background: none;
    border: none;
    box-sizing: border-box;
    font: inherit;
    padding: 0.5em 1em;
    text-align: left;
    -webkit-appearance: none;
    -moz-appearance: none;
}

.${DEFAULT_CONTEXT_MENU_CLASS}__item.${DEFAULT_CONTEXT_MENU_DARK_CLASS} {
    color: white;
}

.${DEFAULT_CONTEXT_MENU_CLASS}__item:hover {
    background: rgb(33, 150, 243, 0.1);
}

.${DEFAULT_CONTEXT_MENU_CLASS}__item:hover.${DEFAULT_CONTEXT_MENU_DARK_CLASS} {
    background: rgb(33, 150, 243, 0.1);
}

.${DEFAULT_CONTEXT_MENU_CLASS}__item:active {
    background: rgb(33, 150, 243, 0.2);
}

.${DEFAULT_CONTEXT_MENU_CLASS}__item:active.${DEFAULT_CONTEXT_MENU_DARK_CLASS} {
    background: rgb(33, 150, 243, 0.1);
}

.${DEFAULT_CONTEXT_MENU_CLASS}__item[disabled] {
    border: none;
    opacity: 0.5;
    text-align: left;
}

.${DEFAULT_CONTEXT_MENU_CLASS}__item[disabled]:hover {
    background: inherit;
    cursor: inherit;
}

.${DEFAULT_CONTEXT_MENU_CLASS}__divider {
    margin: 5px 0;
    background: #babfc7;
    height: 1px;
}

.${DEFAULT_CONTEXT_MENU_CLASS}__divider.${DEFAULT_CONTEXT_MENU_DARK_CLASS} {
    background: rgb(33, 150, 243, 0.1);
}
`;
