import { describe, expect, it } from 'vitest';

import { ButtonWidget } from './buttonWidget';
import { CodeWidget } from './codeWidget';
import { ContainerWidget } from './containerWidget';
import { TextSpanWidget } from './textSpanWidget';

// A chart in a popup window must create its elements in the popup's document, not the global one.
describe('widgets created in another document', () => {
    const popupDocument = document.implementation.createHTMLDocument('popup');

    it('ContainerWidget uses the given document and still takes class names', () => {
        const container = new ContainerWidget(popupDocument, 'ag-charts-a', 'ag-charts-b');
        expect(container.getElement().ownerDocument).toBe(popupDocument);
        expect(container.getElement().className).toBe('ag-charts-a ag-charts-b');
    });

    it('TextSpanWidget uses the given document and still takes text and class names', () => {
        const span = new TextSpanWidget(popupDocument, 'Revenue', 'ag-charts-label');
        expect(span.getElement().ownerDocument).toBe(popupDocument);
        expect(span.getElement().textContent).toBe('Revenue');
        expect(span.getElement().className).toBe('ag-charts-label');
    });

    it('ButtonWidget uses the given document', () => {
        const button = new ButtonWidget(popupDocument);
        expect(button.getElement().ownerDocument).toBe(popupDocument);
        expect(button.getElement().tagName).toBe('BUTTON');
    });

    it('CodeWidget uses the given document for both inline and block code', () => {
        const inline = CodeWidget.inline(popupDocument, 'xKey', 'ag-charts-term');
        const block = CodeWidget.block(popupDocument, 'series[0]', 'ag-charts-snippet');
        expect(inline.getElement().ownerDocument).toBe(popupDocument);
        expect(inline.getElement().textContent).toBe('xKey');
        expect(inline.getElement().className).toBe('ag-charts-term');
        expect(block.getElement().ownerDocument).toBe(popupDocument);
        expect(block.getElement().tagName).toBe('PRE');
    });

    it('defaults to the global document', () => {
        expect(new ContainerWidget('ag-charts-a').getElement().ownerDocument).toBe(document);
        expect(new TextSpanWidget().getElement().ownerDocument).toBe(document);
        expect(new ButtonWidget().getElement().ownerDocument).toBe(document);
        expect(CodeWidget.inline('xKey').getElement().ownerDocument).toBe(document);
    });
});
