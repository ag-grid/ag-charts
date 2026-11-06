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

    it('setCentredThemeText centres its content inline in the theme font and text colour', () => {
        const container = new ContainerWidget();
        container.setCentredThemeText(8);
        const { style } = container.getElement();
        expect(style.display).toBe('flex');
        expect(style.alignItems).toBe('center');
        expect(style.justifyContent).toBe('center');
        expect(style.boxSizing).toBe('border-box');
        expect(style.height).toBe('100%');
        expect(style.margin).toBe('8px');
        expect(style.fontFamily).toBe('var(--ag-charts-font-family)');
        // jsdom's CSSStyleDeclaration rejects var() for font-size, font-weight and color, so those are not observable here.
    });
});
