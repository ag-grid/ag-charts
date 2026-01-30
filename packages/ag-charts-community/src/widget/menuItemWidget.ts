import { type AgDocumentLike, setAttribute, toAgDocument } from 'ag-charts-core';

import { AbstractButtonWidget } from './abstractButtonWidget';

export class MenuItemWidget extends AbstractButtonWidget<HTMLDivElement> {
    constructor(document?: AgDocumentLike) {
        const resolvedDocument = toAgDocument(document);
        if (!resolvedDocument) {
            throw new Error('AG Charts - unable to resolve document');
        }
        const element = resolvedDocument.createElement('div');
        super(element, 'menuitem');
    }
}

export class MenuItemRadioWidget extends AbstractButtonWidget<HTMLDivElement> {
    constructor(document?: AgDocumentLike) {
        const resolvedDocument = toAgDocument(document);
        if (!resolvedDocument) {
            throw new Error('AG Charts - unable to resolve document');
        }
        const element = resolvedDocument.createElement('div');
        super(element, 'menuitemradio');
    }

    setChecked(checked: boolean) {
        setAttribute(this.elem, 'aria-checked', checked);
    }
}
