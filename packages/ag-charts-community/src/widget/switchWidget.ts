import { setAttribute } from '../util/attributeUtil';
import { ButtonWidget } from './buttonWidget';

export class SwitchWidget extends ButtonWidget {
    constructor() {
        super();
        setAttribute(this.elem, 'role', 'switch');
        this.setChecked(false);
    }

    setChecked(checked: boolean) {
        setAttribute(this.elem, 'aria-checked', checked);
    }
}
