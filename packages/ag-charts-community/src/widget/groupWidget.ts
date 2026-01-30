import { type AgDocumentLike, setAttribute, toAgDocument } from 'ag-charts-core';

import { Widget } from './widget';

export class GroupWidget extends Widget<HTMLDivElement> {
    constructor(document?: AgDocumentLike) {
        const resolvedDocument = toAgDocument(document);
        if (!resolvedDocument) {
            throw new Error('AG Charts - unable to resolve document');
        }
        const element = resolvedDocument.createElement('div');
        super(element);
        setAttribute(this.elem, 'role', 'group');
    }
    protected override destructor() {
        // Nothing to destroy.
    }
}
