import { _ModuleSupport } from 'ag-charts-community';
import type {
    CheckboxOptions as CoreCheckboxOptions,
    SelectOptions as CoreSelectOptions,
    TextAreaOptions as CoreTextAreaOptions,
} from 'ag-charts-core';
import {
    Color,
    type ElementID,
    type Point,
    Vec2,
    createButton,
    createCheckbox,
    createElement,
    createElementId,
    createSelect,
    createTextArea,
    entries,
    getIconClassNames,
    getWindow,
    initRovingTabIndex,
    mapValues,
    setAttribute,
    setAttributes,
} from 'ag-charts-core';
import type { AgIconName } from 'ag-charts-types';

import { ColorPicker } from '../color-picker/colorPicker';

const { DraggablePopover, NativeWidget } = _ModuleSupport;

export interface DialogOptions extends _ModuleSupport.PopoverOptions {}

interface RadioGroupOptions<T extends string> {
    label: string;
    options: Array<{ icon: AgIconName; altText: string; value: T }>;
    value: T;
    onChange: (value: T) => void;
}

interface SelectOptions extends CoreSelectOptions {
    altText: string;
    label: string;
}

interface TextAreaOptions extends CoreTextAreaOptions {
    placeholder: string;
}

interface CheckboxOptions extends CoreCheckboxOptions {
    label: string;
}

interface ColorPickerOptions {
    altText: string;
    label: string;
    color?: string;
    opacity?: number;
    isMultiColor?: boolean;
    hasMultiColorOption: boolean;
    onChange: (colorOpacity: string, color: string, opacity: number, isMultiColor: boolean) => void;
    onChangeHide: () => void;
}

/**
 * A popover that opens at a given position but can be moved by the user. By default, it opens at the bottom right or
 * bottom middle of the chart on charts thinner or wider than 1000px respectively. It will reposition to be
 * constrained within the boundaries of the chart.
 *
 * Dialogs may also contain tabs, inputs and nested color pickers.
 */
export abstract class Dialog<Options extends DialogOptions = DialogOptions> extends DraggablePopover<Options> {
    private static readonly offset = 60;

    override dragHandleDraggingClass = 'ag-charts-dialog__drag-handle--dragging';

    private readonly colorPicker = new ColorPicker(this.ctx, { detached: true });
    private colorPickerAnchorElement?: HTMLElement;
    private seriesRect?: _ModuleSupport.BBox;

    constructor(ctx: _ModuleSupport.ModuleContext, id: string) {
        super(ctx, id);
        this.cleanup.register(ctx.eventsHub.on('layout:complete', this.onLayoutComplete.bind(this)));
    }

    protected override showWithChildren(children: Array<HTMLElement>, options: Options) {
        const popover = super.showWithChildren(children, options);
        popover.classList.add('ag-charts-dialog');
        popover.setAttribute('role', 'dialog');

        popover.addEventListener('mousedown', (event) => {
            if ((event.target as any).classList?.contains('ag-charts-dialog__color-picker-button')) return;
            this.colorPicker.hide();
        });
        popover.addEventListener('keydown', this.onKeyDown.bind(this));

        // Give the dialog's dimensions a chance to be calculated before positioning
        getWindow().requestAnimationFrame(() => this.reposition());

        this.colorPicker.attachTo(this);

        return popover;
    }

    protected override updatePosition(position: Point): void {
        super.updatePosition(position);

        const { anchor, fallbackAnchor } = this.getColorPickerAnchors() ?? {};
        if (!anchor) return;

        this.colorPicker.setAnchor(anchor, fallbackAnchor);
    }

    /**************
     * Containers *
     **************/
    protected createTabs<T extends Record<string, { label: string; panel: HTMLElement; onShow?: () => void }>>(
        tablistLabel: string,
        initial: keyof T,
        tabs: T
    ) {
        const element = createElement('div', 'ag-charts-dialog__tabs');

        const tabButtonIds = mapValues(tabs, () => createElementId());
        const tabPanelIds = mapValues(tabs, () => createElementId());

        for (const [key, tab] of entries(tabs)) {
            setAttributes(tab.panel, {
                id: tabPanelIds[key],
                role: 'tabpanel',
                'aria-labelledby': tabButtonIds[key],
            });
        }

        const onPressTab = (active: keyof T) => {
            for (const [key, tab] of entries(tabs)) {
                tab.panel.classList.toggle('ag-charts-dialog__tab-panel--active', key === active);
                tabButtons[key].classList.toggle('ag-charts-dialog__tab-button--active', key === active);
                setAttribute(tabButtons[key], 'aria-selected', key === active);
                if (key === active) tab.onShow?.();
            }
        };

        const header = new NativeWidget(createElement('div', 'ag-charts-dialog__header'));
        header.addListener('drag-start', (event) => {
            const { sourceEvent } = event;
            // Only start dragging when an empty part of the header is dragged
            if (
                sourceEvent.target instanceof Element &&
                sourceEvent.target.classList.contains('ag-charts-dialog__header')
            ) {
                this.onDragStart(event);
            }
        });
        header.addListener('drag-move', (event) => this.onDragMove(event));
        header.addListener('drag-end', () => this.onDragEnd());

        const dragHandle = new DragHandleWidget();
        this.setDragHandle(dragHandle);
        const tabButtons = mapValues(tabs, (tab, key) =>
            createButton(
                {
                    label: this.ctx.localeManager.t(tab.label),
                    onPress: () => onPressTab(key),
                },
                {
                    id: tabButtonIds[key],
                    class: 'ag-charts-dialog__tab-button',
                    role: 'tab',
                    'aria-controls': tabPanelIds[key],
                }
            )
        );

        const tabList = createElement('div', 'ag-charts-dialog__tab-list');
        setAttributes(tabList, { role: 'tablist', 'aria-label': this.ctx.localeManager.t(tablistLabel) });
        tabList.append(...Object.values(tabButtons));

        const closeButton = this.createHeaderCloseButton();

        header.getElement().append(dragHandle.getElement(), tabList, closeButton);
        element.append(header.getElement(), ...Object.values(tabs).map((t) => t.panel));

        onPressTab(initial);
        initRovingTabIndex({ orientation: 'horizontal', buttons: Object.values(tabButtons) });

        return { tabs: element, initialFocus: tabButtons[initial] };
    }

    protected createTabPanel() {
        return createElement('div', 'ag-charts-dialog__tab-panel');
    }

    /**********
     * Inputs *
     **********/
    protected createInputGroupLine() {
        return createElement('div', 'ag-charts-dialog__input-group-line');
    }

    protected createRadioGroup<T extends string>({ label, options, value, onChange }: RadioGroupOptions<T>) {
        const group = this.createInputGroup(label);
        setAttributes(group, {
            role: 'radiogroup',
            tabindex: -1,
            'aria-label': this.ctx.localeManager.t(label),
        });

        const activeClass = 'ag-charts-dialog__button--active';
        const buttons: HTMLButtonElement[] = [];

        for (const button of options) {
            const { icon, altText: altTextKey } = button;
            const altText = this.ctx.localeManager.t(altTextKey);

            const buttonEl = createButton(
                {
                    icon,
                    altText,
                    onPress: () => {
                        for (const b of Array.from(group.children)) {
                            b.classList.remove(activeClass);
                            b.ariaChecked = 'false';
                        }
                        buttonEl.classList.add(activeClass);
                        buttonEl.ariaChecked = 'true';
                        onChange(button.value);
                    },
                },
                {
                    'aria-checked': button.value === value,
                    class: 'ag-charts-dialog__button',
                    role: 'radio',
                    title: altText,
                }
            );

            if (button.value === value) {
                buttonEl.classList.add(activeClass);
            }

            group.appendChild(buttonEl);
            buttons.push(buttonEl);
        }

        initRovingTabIndex({ orientation: 'horizontal', buttons });

        return group;
    }

    protected createSelect({ altText, label, options, value, onChange }: SelectOptions) {
        const group = this.createInputGroup(label);
        const altTextT = this.ctx.localeManager.t(altText);
        const select = createSelect(
            { value, options, onChange },
            { class: 'ag-charts-dialog__select', 'aria-label': altTextT, title: altTextT }
        );
        group.append(select);

        return group;
    }

    protected createTextArea({ placeholder, value, onChange }: TextAreaOptions) {
        const placeholderT = placeholder ? this.ctx.localeManager.t(placeholder) : undefined;
        return createTextArea({ value, onChange }, { placeholder: placeholderT });
    }

    protected createCheckbox({ label, checked, onChange }: CheckboxOptions) {
        const id = createElementId();
        const group = this.createInputGroup(label, { for: id });

        const checkbox = createCheckbox(
            { checked, onChange },
            { class: 'ag-charts-dialog__checkbox', role: 'switch', id }
        );

        group.append(checkbox);

        return group;
    }

    protected createColorPicker({
        color,
        opacity,
        label,
        altText,
        onChange,
        onChangeHide,
        isMultiColor,
        hasMultiColorOption,
    }: ColorPickerOptions) {
        const group = this.createInputGroup(label);

        const altTextT = this.ctx.localeManager.t(altText);
        const colorEl = createButton(
            {
                label: altTextT,
                onPress: (event) => {
                    // Retrieve the anchor for this particular color picker element, and use it when repositioning if the chart
                    // is resized. When a different color picker trigger element is clicked that one will take over this task.
                    const { anchor, fallbackAnchor } = this.getColorPickerAnchors(colorEl) ?? {};
                    this.colorPicker.show({
                        anchor,
                        fallbackAnchor,
                        color,
                        opacity,
                        isMultiColor,
                        hasMultiColorOption,
                        sourceEvent: event,
                        onChange: (
                            newColorOpacity: string,
                            newColor: string,
                            newOpacity: number,
                            newIsMultiColor: boolean
                        ) => {
                            colorEl.style.setProperty('--color', newColorOpacity);
                            colorEl.classList.toggle(
                                'ag-charts-dialog__color-picker-button--multi-color',
                                newIsMultiColor
                            );
                            onChange(newColorOpacity, newColor, newOpacity, newIsMultiColor);
                        },
                        onChangeHide,
                    });
                },
            },
            {
                'aria-label': altTextT,
                tabindex: 0,
                class: 'ag-charts-dialog__color-picker-button',
                title: altTextT,
            }
        );

        if (isMultiColor) {
            colorEl.classList.toggle('ag-charts-dialog__color-picker-button--multi-color');
        } else if (color) {
            const hex = Color.fromString(color);
            const hexWithOpacity = new Color(hex.r, hex.g, hex.b, opacity);
            colorEl.style.setProperty('--color', hexWithOpacity.toHexString());
        }

        group.append(colorEl);

        this.hideFns.push(() => {
            this.colorPicker.hide();
        });

        return group;
    }

    /***********
     * Private *
     ***********/

    private createHeaderCloseButton() {
        return createButton(
            { icon: 'close', altText: this.ctx.localeManager.t('iconAltTextClose'), onPress: () => this.hide() },
            { class: 'ag-charts-dialog__close-button' }
        );
    }

    private createInputGroup(label: string, options?: { for?: ElementID }) {
        const group = createElement('div', 'ag-charts-dialog__input-group');

        const labelEl = createElement('label', 'ag-charts-dialog__input-group-label');
        labelEl.innerText = this.ctx.localeManager.t(label);
        setAttribute(labelEl, 'for', options?.for);

        group.appendChild(labelEl);

        return group;
    }

    private onLayoutComplete(event: _ModuleSupport.LayoutCompleteEvent) {
        this.seriesRect = event.series.paddedRect;
        this.reposition();
    }

    private onKeyDown(event: KeyboardEvent) {
        if (event.altKey || event.ctrlKey || event.metaKey || event.isComposing || event.key !== 'Escape') return;
        this.hide();
    }

    private reposition() {
        const { seriesRect, ctx } = this;
        const popover = this.getPopoverElement();
        if (!seriesRect || !popover) return;

        // Avoid triggering a layout change when getting the client rect unless absolutely necessary..
        const clientRect = ctx.domManager.getBoundingClientRect();

        // Position the dialog relative to the series rect height, to cater for the range buttons and other
        // paraphernalia at the bottom of the chart, but relative to the client width so the dialog
        // remains centered relative to the floating zoom buttons.
        const outerOffset = Vec2.from(0, seriesRect.y);
        const outerSize = Vec2.from(clientRect.width, seriesRect.height);
        const popoverSize = Vec2.from(popover);
        const halfWidth = Vec2.from(0.5, 1);

        let position: Point;
        if (seriesRect.width > 1000) {
            const bottomCenter = Vec2.sub(
                Vec2.add(outerOffset, Vec2.multiply(outerSize, halfWidth)),
                Vec2.multiply(popoverSize, halfWidth)
            );
            position = Vec2.sub(bottomCenter, Vec2.from(0, Dialog.offset));
        } else {
            const bottomRight = Vec2.sub(Vec2.add(outerOffset, outerSize), popoverSize);
            position = Vec2.sub(bottomRight, Dialog.offset);
        }

        this.updatePosition(position);
    }

    private getColorPickerAnchors(element?: HTMLElement) {
        if (element) this.colorPickerAnchorElement = element;
        if (!this.colorPickerAnchorElement) return;

        const rect = this.colorPickerAnchorElement.getBoundingClientRect();
        const canvasRect = this.ctx.domManager.getBoundingClientRect();

        const topLeft = Vec2.sub(Vec2.from(rect.x, rect.y), Vec2.from(canvasRect.left, canvasRect.top));
        const anchor = Vec2.add(topLeft, Vec2.from(0, rect.height + 5));
        const fallbackAnchor = Vec2.sub(topLeft, Vec2.from(0, 5));

        return { anchor, fallbackAnchor };
    }
}

class DragHandleWidget extends NativeWidget {
    constructor() {
        super(createElement('div', 'ag-charts-dialog__drag-handle'));
        const icon = new NativeWidget<HTMLElement>(createElement('span', getIconClassNames('drag-handle')));
        icon.setAriaHidden(true);
        this.addChild(icon);
    }
}
