import { describe, expect, it } from 'vitest';

import { InputButtonWidget } from './inputButtonWidget';

describe('InputButtonWidget', () => {
    it('shows a text label after the base and extra classes', () => {
        const button = new InputButtonWidget({ label: 'Line' }, 'ag-charts-dialog__tab-button');
        const elem = button.getElement();
        expect(elem.tagName).toBe('BUTTON');
        expect(elem.className).toBe('ag-charts-input ag-charts-button ag-charts-dialog__tab-button');
        expect(elem.textContent).toBe('Line');
        expect(elem.hasAttribute('aria-label')).toBe(false);
    });

    it('shows an aria-hidden icon and takes its accessible name from altText when it has no label', () => {
        const button = new InputButtonWidget({ icon: 'close', altText: 'Close' });
        const elem = button.getElement();
        expect(elem.getAttribute('aria-label')).toBe('Close');
        expect(elem.innerHTML).toBe('<span class="ag-charts-icon ag-charts-icon-close" aria-hidden="true"></span>');
    });

    it('does not compile when an icon-only button has no altText', () => {
        // @ts-expect-error an icon-only button needs an accessible name
        const content: ConstructorParameters<typeof InputButtonWidget>[0] = { icon: 'close' };
        expect(content).toBeDefined();
    });

    it('reports a pointer click to its click listeners', () => {
        const button = new InputButtonWidget({ label: 'Line' });
        const clicks: string[] = [];
        button.addListener('click', (event) => clicks.push(event.type));

        button.getElement().click();

        expect(clicks).toEqual(['click']);
    });
});
