import { type AgDocumentLike, toAgDocument } from 'ag-charts-core';

import { AbstractButtonWidget } from './abstractButtonWidget';

export class ButtonWidget extends AbstractButtonWidget<HTMLButtonElement> {
    constructor(document?: AgDocumentLike) {
        const resolvedDocument = toAgDocument(document);
        if (!resolvedDocument) {
            throw new Error('AG Charts - unable to resolve document');
        }
        const element = resolvedDocument.createElement('button');
        super(element);
    }
}
