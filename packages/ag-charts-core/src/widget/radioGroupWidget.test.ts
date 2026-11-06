import { afterEach, describe, expect, it } from 'vitest';

import { InputButtonWidget } from './inputButtonWidget';
import { LabelWidget } from './labelWidget';
import { RadioGroupWidget } from './radioGroupWidget';
import { TabListWidget } from './tabListWidget';

function pressKey(widget: InputButtonWidget, key: string) {
    const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key });
    widget.getElement().dispatchEvent(event);
}

describe('RadioGroupWidget', () => {
    afterEach(() => {
        document.body.replaceChildren();
    });

    it('places the label before the radios, outside the tab order', () => {
        const label = new LabelWidget('Dash');
        const group = new RadioGroupWidget(label);
        const solid = new InputButtonWidget({ icon: 'line-style-solid', altText: 'Solid' });
        const dashed = new InputButtonWidget({ icon: 'line-style-dashed', altText: 'Dashed' });
        group.addChild(solid);
        group.addChild(dashed);

        const elem = group.getElement();
        expect(elem.getAttribute('role')).toBe('radiogroup');
        expect(Array.from(elem.children)).toEqual([label.getElement(), solid.getElement(), dashed.getElement()]);
        expect(label.getElement().hasAttribute('tabindex')).toBe(false);
        expect(solid.getElement().tabIndex).toBe(0);
        expect(dashed.getElement().tabIndex).toBe(-1);
    });

    it('moves focus and the single tab stop with the arrow keys, without wrapping', () => {
        const group = new RadioGroupWidget(new LabelWidget('Dash'));
        const solid = new InputButtonWidget({ icon: 'line-style-solid', altText: 'Solid' });
        const dashed = new InputButtonWidget({ icon: 'line-style-dashed', altText: 'Dashed' });
        group.addChild(solid);
        group.addChild(dashed);
        document.body.append(group.getElement());

        solid.focus();
        pressKey(solid, 'ArrowRight');
        expect(dashed.isFocused()).toBe(true);
        expect(solid.getElement().tabIndex).toBe(-1);
        expect(dashed.getElement().tabIndex).toBe(0);

        pressKey(dashed, 'ArrowRight');
        expect(dashed.isFocused()).toBe(true);

        pressKey(dashed, 'ArrowLeft');
        expect(solid.isFocused()).toBe(true);
    });

    it('keeps its label first when cleared and refilled', () => {
        const label = new LabelWidget('Dash');
        const group = new RadioGroupWidget(label);
        group.addChild(new InputButtonWidget({ icon: 'line-style-solid', altText: 'Solid' }));

        group.clear();
        const dotted = new InputButtonWidget({ icon: 'line-style-dotted', altText: 'Dotted' });
        group.addChild(dotted);

        expect(Array.from(group.getElement().children)).toEqual([label.getElement(), dotted.getElement()]);
        expect(dotted.getElement().tabIndex).toBe(0);
    });

    it('destroys its label', () => {
        const label = new LabelWidget('Dash');
        let labelDestroyed = false;
        label.destroyListener = () => (labelDestroyed = true);
        const group = new RadioGroupWidget(label);

        group.destroy();

        expect(labelDestroyed).toBe(true);
    });
});

describe('TabListWidget', () => {
    afterEach(() => {
        document.body.replaceChildren();
    });

    it('is a horizontal tablist whose first tab is the tab stop', () => {
        const tabList = new TabListWidget();
        const line = new InputButtonWidget({ label: 'Line' });
        const text = new InputButtonWidget({ label: 'Text' });
        tabList.addChild(line);
        tabList.addChild(text);
        document.body.append(tabList.getElement());

        expect(tabList.getElement().getAttribute('role')).toBe('tablist');
        expect(tabList.orientation).toBe('horizontal');
        expect(line.getElement().tabIndex).toBe(0);
        expect(text.getElement().tabIndex).toBe(-1);

        line.focus();
        pressKey(line, 'ArrowRight');
        expect(text.isFocused()).toBe(true);
    });
});
