import { createElement } from '../dom/domElements';
import { AbstractButtonWidget } from './abstractButtonWidget';

export class ButtonWidget extends AbstractButtonWidget<HTMLButtonElement> {
    constructor() {
        super(createElement('button'));
    }
}
