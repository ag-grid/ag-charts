export const TOOLBAR_CLASS = 'ag-charts-toolbar';

export const toolbarStyles = `
.${TOOLBAR_CLASS} {
    background: #fff;
    border: 1px solid #ddd;
    display: flex;
    padding: 2px;
    position: absolute;
    visibility: hidden;
}

.${TOOLBAR_CLASS}--top, .${TOOLBAR_CLASS}--bottom {
    flex-direction: row;
}

.${TOOLBAR_CLASS}--left, .${TOOLBAR_CLASS}--right {
    flex-direction: column;
}

.${TOOLBAR_CLASS}__button {
    background: none;
    border: 0;
    border-radius: 4px;
    display: none;
    height: 40px;
    min-width: 40px;
    padding: 0 6px;
}

.${TOOLBAR_CLASS}__button:hover {
    background: rgb(33, 150, 243, 0.1);
}
`;
