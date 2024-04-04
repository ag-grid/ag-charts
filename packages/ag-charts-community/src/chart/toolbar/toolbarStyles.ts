export const TOOLBAR_CLASS = 'ag-charts-toolbar';

export const toolbarStyles = `
.${TOOLBAR_CLASS} {
    background: #fff;
    border: 1px solid #ddd;
    display: flex;
    padding: 2px;
    position: absolute;
}

.${TOOLBAR_CLASS}--top {
    left: 0;
    top: 0;
}

.${TOOLBAR_CLASS}--right {
    right: 0;
    top: 0;
}

.${TOOLBAR_CLASS}--bottom {
    bottom: 0;
    left: 0;
}

.${TOOLBAR_CLASS}--left {
    left: 0;
    top: 0;
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
    height: 40px;
    width: 40px;
}

.${TOOLBAR_CLASS}__button:hover {
    background: rgb(33, 150, 243, 0.1);
}
`;
