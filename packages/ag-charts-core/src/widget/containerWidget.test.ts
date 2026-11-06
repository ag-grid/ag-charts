import { describe, expect, it } from 'vitest';

import { ContainerWidget } from './containerWidget';
import { TextSpanWidget } from './textSpanWidget';

describe('ContainerWidget', () => {
    it('creates a div with classes and no role', () => {
        const container = new ContainerWidget('ag-charts-popover', 'ag-charts-dialog');
        const elem = container.getElement();
        expect(elem.tagName).toBe('DIV');
        expect(elem.className).toBe('ag-charts-popover ag-charts-dialog');
        expect(elem.hasAttribute('role')).toBe(false);
    });

    it('holds child widgets', () => {
        const container = new ContainerWidget();
        const label = new TextSpanWidget('Colour');
        container.addChild(label);
        expect(container.getElement().firstElementChild).toBe(label.getElement());
    });
});
