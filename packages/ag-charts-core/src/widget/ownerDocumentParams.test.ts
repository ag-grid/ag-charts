import { describe, expect, it } from 'vitest';

import { ButtonWidget } from './buttonWidget';
import { ContainerWidget } from './containerWidget';
import { LabelWidget } from './labelWidget';
import { SwitchWidget } from './switchWidget';
import { TextSpanWidget } from './textSpanWidget';

// A chart in a popup window must create its elements in the popup's document, not the global one.
describe('existing widgets created in another document', () => {
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

    it('LabelWidget uses the given document and still takes text and class names', () => {
        const label = new LabelWidget(popupDocument, 'Colour', 'ag-charts-field');
        expect(label.getElement().ownerDocument).toBe(popupDocument);
        expect(label.getElement().textContent).toBe('Colour');
        expect(label.getElement().className).toBe('ag-charts-field');
    });

    it('ButtonWidget and SwitchWidget use the given document', () => {
        const button = new ButtonWidget(popupDocument);
        const toggle = new SwitchWidget(popupDocument);
        expect(button.getElement().ownerDocument).toBe(popupDocument);
        expect(toggle.getElement().ownerDocument).toBe(popupDocument);
        expect(toggle.getElement().getAttribute('role')).toBe('switch');
    });

    it('defaults to the global document', () => {
        expect(new ContainerWidget('ag-charts-a').getElement().ownerDocument).toBe(document);
        expect(new TextSpanWidget().getElement().ownerDocument).toBe(document);
        expect(new LabelWidget('Colour').getElement().ownerDocument).toBe(document);
        expect(new SwitchWidget().getElement().ownerDocument).toBe(document);
    });
});
