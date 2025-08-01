import { createElement, setAttribute } from 'ag-charts-core';

import { AbstractButtonWidget } from './abstractButtonWidget';

export class MenuItemWidget extends AbstractButtonWidget<HTMLDivElement> {
    constructor() {
        super(createElement('div'), 'menuitem');
    }
}

export class MenuItemRadioWidget extends AbstractButtonWidget<HTMLDivElement> {
    constructor() {
        super(createElement('div'), 'menuitemradio');
    }

    setChecked(checked: boolean) {
        setAttribute(this.elem, 'aria-checked', checked);
    }
}
