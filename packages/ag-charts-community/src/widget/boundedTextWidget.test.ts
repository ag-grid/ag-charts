import { describe, expect, it } from 'vitest';

import { BoundedTextWidget } from './boundedTextWidget';

describe('BoundedTextWidget', () => {
    it('forces the default cursor on the SVG text to avoid the Safari I-beam', () => {
        const widget = new BoundedTextWidget();

        const text = widget.getElement().querySelector('text');
        expect(text).not.toBeNull();
        expect(text!.style.cursor).toBe('default');
    });
});
