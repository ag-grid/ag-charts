import { describe, expect, it } from '@jest/globals';

import { AgDocument, EventEmitter, getDocument } from 'ag-charts-core';

import type { EventsHub } from '../core/eventsHub';
import { DOMManager } from './domManager';

describe('DOMManager', () => {
    const doc = new AgDocument(getDocument());

    beforeEach(() => {
        // Prevent bleed of state between tests.
        doc.head.innerHTML = '';
        (DOMManager as any).headStyles?.clear?.();
    });

    const eventsHub: EventsHub = new EventEmitter();

    describe('for normal container cases', () => {
        it('should initialize the expected DOM', () => {
            const container = doc.createElement('div');
            doc.body.append(container);

            const dm = new DOMManager(eventsHub, { styleNonce: '416d1177' }, doc, container);
            dm.addStyles('test', '.test { width: 100% }');

            expect(container).toMatchSnapshot();
            expect(doc.head).toMatchSnapshot();
        });
    });

    describe('for disconnected container cases', () => {
        it('should initialize the expected DOM', () => {
            const container = doc.createElement('div');
            const dm = new DOMManager(eventsHub, { styleNonce: '416d1171' }, doc, container);
            dm.addStyles('test', '.test { width: 100% }');

            expect(container).toMatchSnapshot();
            expect(doc.head).toMatchInlineSnapshot(`<head />`);
        });
    });

    describe('for shadow-DOM container cases', () => {
        it('should initialize the expected DOM', () => {
            const component = doc.createElement('div');
            const container = doc.createElement('div');
            doc.body.append(component);
            const shadow = component.attachShadow({ mode: 'open' });
            shadow.appendChild(container);

            const dm = new DOMManager(eventsHub, { styleNonce: '416d1177' }, doc, container);
            dm.addStyles('test', '.test { width: 100% }');

            expect(container).toMatchSnapshot();
            expect(doc.head).toMatchInlineSnapshot(`<head />`);
        });
    });

    describe('when connecting after initialisation', () => {
        it('should move styles to head when the container is attached to the document', () => {
            const container = doc.createElement('div');
            const dm = new DOMManager(eventsHub, { styleNonce: 'late-416d' }, doc, container);
            dm.addStyles('late-test', '.test { width: 100% }');

            expect(container.querySelector('style[data-ag-charts="late-test"]')).not.toBeNull();
            expect(doc.head.querySelector('style[data-ag-charts="late-test"]')).toBeNull();

            doc.body.append(container);
            dm.postRenderUpdate();

            expect(container.querySelector('style[data-ag-charts="late-test"]')).toBeNull();
            expect(doc.head.querySelector('style[data-ag-charts="late-test"]')).not.toBeNull();
            expect(doc.head.querySelector('style[data-ag-charts="ag-charts-community"]')).not.toBeNull();
        });

        it('should keep styles inside the shadow root when attached to a shadow DOM', () => {
            const component = doc.createElement('div');
            const container = doc.createElement('div');
            doc.body.append(component);
            const shadow = component.attachShadow({ mode: 'open' });

            const dm = new DOMManager(eventsHub, { styleNonce: 'late-416d' }, doc, container);
            dm.addStyles('late-test', '.test { width: 100% }');

            shadow.appendChild(container);
            dm.postRenderUpdate();

            expect(shadow.querySelector('style[data-ag-charts="late-test"]')).not.toBeNull();
            expect(shadow.querySelector('style[data-ag-charts="ag-charts-community"]')).not.toBeNull();
            expect(doc.head.querySelector('style[data-ag-charts="late-test"]')).toBeNull();
            expect(doc.head.querySelector('style[data-ag-charts="ag-charts-community"]')).toBeNull();
        });
    });
});
