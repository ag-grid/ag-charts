import { ToolbarPosition } from './toolbarTypes';

export const block = 'ag-charts-toolbar';
export const elements = {
    align: 'ag-charts-toolbar__align',
    section: 'ag-charts-toolbar__section',
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
    small: 'ag-charts-toolbar--small',
    normal: 'ag-charts-toolbar--normal',
    hidden: 'ag-charts-toolbar--hidden',
    preventFlash: 'ag-charts-toolbar--prevent-flash',
    floatingHidden: 'ag-charts-toolbar--floating-hidden',
    align: {
        start: 'ag-charts-toolbar__align--start',
        center: 'ag-charts-toolbar__align--center',
        end: 'ag-charts-toolbar__align--end',
    },
    button: {
        first: 'ag-charts-toolbar__button--first',
        last: 'ag-charts-toolbar__button--last',
        active: 'ag-charts-toolbar__button--active',
        hiddenValue: 'ag-charts-toolbar__button--hidden-value',
        hiddenToggled: 'ag-charts-toolbar__button--hidden-toggled',
        fillVisible: 'ag-charts-toolbar__button--fill-visible',
        strokeWidthVisible: 'ag-charts-toolbar__button--stroke-width-visible',
        withTransition: 'ag-charts-toolbar__button--with-transition',
        dragHandle: 'ag-charts-toolbar__button--drag-handle',
    },
};
