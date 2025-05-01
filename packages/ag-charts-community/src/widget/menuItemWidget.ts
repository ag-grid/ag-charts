import { createElement } from 'ag-charts-core';

import { AbstractButtonWidget } from './abstractButtonWidget';

export class MenuItemWidget extends AbstractButtonWidget<HTMLDivElement> {
    constructor() {
        super(createElement('div'), 'menuitem');
    }
}
