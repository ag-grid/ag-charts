import { describe, expect, it } from 'vitest';

import { CodeWidget } from './codeWidget';

describe('CodeWidget', () => {
    it('inline creates a code element with text and classes', () => {
        const code = CodeWidget.inline('series[0].xKey', 'ag-charts-term');
        const elem = code.getElement();
        expect(elem.tagName).toBe('CODE');
        expect(elem.className).toBe('ag-charts-term');
        expect(elem.textContent).toBe('series[0].xKey');
    });

    it('block creates a pre element that keeps line breaks in its text', () => {
        const code = CodeWidget.block('{\n  xKey: "x"\n}', 'ag-charts-snippet');
        const elem = code.getElement();
        expect(elem.tagName).toBe('PRE');
        expect(elem.className).toBe('ag-charts-snippet');
        expect(elem.textContent).toBe('{\n  xKey: "x"\n}');
    });
});
