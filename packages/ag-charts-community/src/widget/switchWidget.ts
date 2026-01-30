import { type AgDocumentLike, setAttribute } from 'ag-charts-core';

import { ButtonWidget } from './buttonWidget';

export class SwitchWidget extends ButtonWidget {
    constructor(document?: AgDocumentLike) {
        super(document);
        setAttribute(this.elem, 'role', 'switch');
        this.setChecked(false);
    }

    setChecked(checked: boolean) {
        setAttribute(this.elem, 'aria-checked', checked);
    }
}
