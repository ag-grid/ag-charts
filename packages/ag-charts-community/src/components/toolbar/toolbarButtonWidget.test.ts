import { describe, expect, it } from 'vitest';

import { EventEmitter, Logger } from 'ag-charts-core';

import type { EventsHubMap } from '../../core/eventsHub';
import { LocaleManager } from '../../locale/localeManager';
import { ToolbarButtonWidget, type ToolbarButtonWidgetOptions, getToolbarIconSize } from './toolbarButtonWidget';

describe('getToolbarIconSize', () => {
    it('keeps the natural 20px icon at the default button size', () => {
        expect(getToolbarIconSize(34)).toBe(20);
        expect(getToolbarIconSize(24, 24)).toBe(20);
    });

    it.each([
        [10, 6],
        [44, 26],
        [45, 27],
        [60, 36],
    ])('scales the icon with a %spx button to %spx', (buttonSize, iconSize) => {
        expect(getToolbarIconSize(buttonSize)).toBe(iconSize);
    });

    it.each([10, 22.5, 33, 44, 44.4, 44.6, 47, 61.25])(
        'returns a whole-pixel icon with a whole-pixel inset for a %spx button',
        (buttonSize) => {
            const iconSize = getToolbarIconSize(buttonSize);
            expect(Number.isInteger(iconSize)).toBe(true);
            expect((Math.round(buttonSize) - iconSize) % 2).toBe(0);
        }
    );
});

describe('ToolbarButtonWidget', () => {
    const createButton = (options: Omit<ToolbarButtonWidgetOptions, 'value'>) => {
        const widget = new ToolbarButtonWidget(
            new LocaleManager(new EventEmitter<EventsHubMap>(), new Logger()),
            false
        );
        const update = (next: Omit<ToolbarButtonWidgetOptions, 'value'>) =>
            widget.update({ value: 'reset', ...next }, { isRtl: false });
        update(options);
        return { elem: widget.getElement(), update };
    };

    const childClasses = (elem: HTMLElement) => Array.from(elem.children, (child) => child.className);

    it('renders the label as text', () => {
        const { elem } = createButton({ label: '< 1M & <b>x</b>' });

        expect(elem.querySelector('b')).toBeNull();
        expect(elem.querySelector('.ag-charts-toolbar__label')?.textContent).toBe('< 1M & <b>x</b>');
    });

    it('places the icon before the label unless it is positioned after', () => {
        expect(childClasses(createButton({ icon: 'zoom-in', label: 'Zoom' }).elem)).toEqual([
            'ag-charts-icon ag-charts-icon-zoom-in ag-charts-toolbar__icon',
            'ag-charts-toolbar__label',
        ]);
        expect(childClasses(createButton({ icon: 'zoom-in', iconPosition: 'after', label: 'Zoom' }).elem)).toEqual([
            'ag-charts-toolbar__label',
            'ag-charts-icon ag-charts-icon-zoom-in ag-charts-toolbar__icon',
        ]);
    });

    it('rebuilds the content only when it changes', () => {
        const { elem, update } = createButton({ icon: 'zoom-in', label: 'Zoom' });
        const [icon, label] = Array.from(elem.children);

        update({ icon: 'zoom-in', label: 'Zoom' });
        expect(Array.from(elem.children)).toEqual([icon, label]);

        update({ icon: 'zoom-in', label: 'Zoom more' });
        expect(elem.children[1]).not.toBe(label);
        expect(elem.children[1].textContent).toBe('Zoom more');
    });
});
