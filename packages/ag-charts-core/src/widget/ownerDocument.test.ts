import { describe, expect, it } from 'vitest';

import { ButtonWidget } from './buttonWidget';
import { CodeWidget } from './codeWidget';
import { ContainerWidget } from './containerWidget';
import { ContentEditableWidget } from './contentEditableWidget';
import { LabelWidget } from './labelWidget';
import { RangeInputWidget } from './rangeInputWidget';
import { Slider2DWidget } from './slider2DWidget';
import { SwitchWidget } from './switchWidget';
import { TextFieldWidget } from './textFieldWidget';
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

    it('LabelWidget uses the given document and still takes text and class names', () => {
        const label = new LabelWidget(popupDocument, 'Colour', 'ag-charts-field');
        expect(label.getElement().ownerDocument).toBe(popupDocument);
        expect(label.getElement().textContent).toBe('Colour');
        expect(label.getElement().className).toBe('ag-charts-field');
    });

    it('ButtonWidget uses the given document', () => {
        const button = new ButtonWidget(popupDocument);
        expect(button.getElement().ownerDocument).toBe(popupDocument);
        expect(button.getElement().tagName).toBe('BUTTON');
    });

    it('SwitchWidget uses the given document', () => {
        const toggle = new SwitchWidget(popupDocument);
        expect(toggle.getElement().ownerDocument).toBe(popupDocument);
        expect(toggle.getElement().getAttribute('role')).toBe('switch');
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

    it('ContentEditableWidget uses the given document and still takes class names', () => {
        const widget = new ContentEditableWidget(popupDocument, 'ag-charts-text');
        expect(widget.getElement().ownerDocument).toBe(popupDocument);
        expect(widget.getElement().className).toBe('ag-charts-text');
    });

    it('RangeInputWidget uses the given document and still takes class names', () => {
        const range = new RangeInputWidget(popupDocument, 'ag-charts-hue');
        expect(range.getElement().ownerDocument).toBe(popupDocument);
        expect(range.getElement().className).toBe('ag-charts-hue');
    });

    it('Slider2DWidget uses the given document and still takes class names', () => {
        const slider = new Slider2DWidget(popupDocument, 'ag-charts-palette');
        expect(slider.getElement().ownerDocument).toBe(popupDocument);
        expect(slider.getElement().className).toBe('ag-charts-palette');
    });

    it('TextFieldWidget uses the given document and still takes class names', () => {
        const field = new TextFieldWidget(popupDocument, 'ag-charts-field');
        expect(field.getElement().ownerDocument).toBe(popupDocument);
        expect(field.getElement().className).toBe('ag-charts-field');
    });

    it('defaults to the global document', () => {
        expect(new ContainerWidget('ag-charts-a').getElement().ownerDocument).toBe(document);
        expect(new TextSpanWidget().getElement().ownerDocument).toBe(document);
        expect(new LabelWidget('Colour').getElement().ownerDocument).toBe(document);
        expect(new ButtonWidget().getElement().ownerDocument).toBe(document);
        expect(new SwitchWidget().getElement().ownerDocument).toBe(document);
        expect(CodeWidget.inline('xKey').getElement().ownerDocument).toBe(document);
    });
});
