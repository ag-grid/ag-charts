import { createElement } from 'ag-charts-core';

import { AbstractButtonWidget } from './abstractButtonWidget';

export class ButtonWidget extends AbstractButtonWidget<HTMLButtonElement> {
    constructor() {
        super(createElement('button'));
    }
}
