import { _ModuleSupport } from 'ag-charts-community';
import type { BBox, DynamicContext, ElementID, InputWidgetType, SelectWidgetOption } from 'ag-charts-core';
import {
    CheckboxWidget,
    Color,
    ContainerWidget,
    IconWidget,
    InputButtonWidget,
    InputWidget,
    LabelWidget,
    type Point,
    RadioGroupWidget,
    SelectWidget,
    TabListWidget,
    TextAreaWidget,
    Vec2,
    type Widget,
    createElementId,
    entries,
    mapValues,
} from 'ag-charts-core';
import type { AgIconName } from 'ag-charts-types';

import { ColorPicker } from '../color-picker/colorPicker';

const { DraggablePopover } = _ModuleSupport;

export interface DialogOptions extends _ModuleSupport.PopoverOptions {}

interface RadioGroupOptions<T extends string> {
    label: string;
    options: Array<{ icon: AgIconName; altText: string; value: T }>;
    value: T;
    onChange: (value: T) => void;
}

interface SelectOptions {
    altText: string;
    label: string;
    options: SelectWidgetOption[];
    value: string;
    onChange: (value: string, event: Event) => void;
}

interface InputOptions {
    /** Already translated, as it is built from more than one locale string. */
    ariaLabel: string;
    type: InputWidgetType;
    value: string;
    /** The granularity of a `datetime-local` input, in seconds. */
    step?: number;
    /** The id of the datalist the input suggests from. */
    list?: ElementID;
    /** Called when the user commits a value; a `datetime-local` input may commit a value that has not changed. */
    onChange: (value: string, event: Event) => void;
}

interface TextAreaOptions {
    placeholder: string;
    value: string;
    onChange: (value: string, event: Event) => void;
}

interface CheckboxOptions {
    label: string;
    checked: boolean;
    onChange: (checked: boolean, event: Event) => void;
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
    private colorPickerAnchor?: Widget;
    private colorPickerButtonMouseDown?: Event;
    private seriesRect?: BBox;

    constructor(ctx: DynamicContext<_ModuleSupport.ChartRegistry>, id: string) {
        super(ctx, id);
        this.cleanup.register(ctx.eventsHub.on('layout:complete', this.onLayoutComplete.bind(this)));
    }

    protected override showWithChildren(children: Widget[], options: Options): ContainerWidget {
        const popover = super.showWithChildren(children, options);
        popover.addClass('ag-charts-dialog');
        popover.setAriaRole('dialog');

        popover.addListener('mousedown', ({ sourceEvent }) => {
            // A colour picker button toggles the picker from its own click listener.
            if (sourceEvent === this.colorPickerButtonMouseDown) return;
            this.colorPicker.hide();
        });
        popover.addListener('keydown', ({ sourceEvent }) => this.onKeyDown(sourceEvent));

        // Give the dialog's dimensions a chance to be calculated before positioning
        this.ctx.agDocument.requestAnimationFrame(() => this.reposition());

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
    protected createTabs<T extends Record<string, { label: string; panel: Widget; onShow?: () => void }>>(
        tablistLabel: string,
        initial: keyof T,
        tabs: T
    ) {
        const element = new ContainerWidget('ag-charts-dialog__tabs');

        const tabButtonIds = mapValues(tabs, () => createElementId());
        const tabPanelIds = mapValues(tabs, () => createElementId());

        for (const [key, tab] of entries(tabs)) {
            tab.panel.id = tabPanelIds[key];
            tab.panel.setAriaRole('tabpanel');
            tab.panel.setAriaLabelledBy(tabButtonIds[key]);
        }

        const onPressTab = (active: keyof T) => {
            for (const [key, tab] of entries(tabs)) {
                tab.panel.toggleClass('ag-charts-dialog__tab-panel--active', key === active);
                tabButtons[key].toggleClass('ag-charts-dialog__tab-button--active', key === active);
                tabButtons[key].setAriaSelected(key === active);
                if (key === active) tab.onShow?.();
            }
        };

        const header = new ContainerWidget('ag-charts-dialog__header');
        const dragHandle = new DragHandleWidget();
        this.setDragHandle(dragHandle);
        const tabButtons = mapValues(tabs, (tab, key) => {
            const button = new InputButtonWidget(
                { label: this.ctx.localeManager.t(tab.label) },
                'ag-charts-dialog__tab-button'
            );
            button.id = tabButtonIds[key];
            button.setAriaRole('tab');
            button.setAriaControls(tabPanelIds[key]);
            button.addListener('click', () => onPressTab(key));
            return button;
        });

        const tabList = new TabListWidget();
        tabList.addClass('ag-charts-dialog__tab-list');
        tabList.setAriaLabel(this.ctx.localeManager.t(tablistLabel));
        for (const button of Object.values(tabButtons)) {
            tabList.addChild(button);
        }

        header.addChild(dragHandle);
        header.addChild(tabList);
        header.addChild(this.createHeaderCloseButton());
        element.addChild(header);
        for (const tab of Object.values(tabs)) {
            element.addChild(tab.panel);
        }

        onPressTab(initial);

        return { tabs: element, initialFocus: tabButtons[initial] };
    }

    protected createTabPanel() {
        return new ContainerWidget('ag-charts-dialog__tab-panel');
    }

    /**********
     * Inputs *
     **********/
    protected createInputGroupLine() {
        return new ContainerWidget('ag-charts-dialog__input-group-line');
    }

    protected createRadioGroup<T extends string>({ label, options, value, onChange }: RadioGroupOptions<T>) {
        const group = new RadioGroupWidget(this.createInputGroupLabel(label));
        group.addClass('ag-charts-dialog__input-group');
        group.setTabIndex(-1);
        group.setAriaLabel(this.ctx.localeManager.t(label));

        const activeClass = 'ag-charts-dialog__button--active';
        const buttons: InputButtonWidget[] = [];

        for (const option of options) {
            const altText = this.ctx.localeManager.t(option.altText);
            const button = new InputButtonWidget({ icon: option.icon, altText }, 'ag-charts-dialog__button');
            button.setAriaChecked(option.value === value);
            button.setAriaRole('radio');
            button.setTitle(altText);
            button.toggleClass(activeClass, option.value === value);
            button.addListener('click', () => {
                for (const b of buttons) {
                    b.removeClass(activeClass);
                    b.setAriaChecked(false);
                }
                button.addClass(activeClass);
                button.setAriaChecked(true);
                onChange(option.value);
            });

            group.addChild(button);
            buttons.push(button);
        }

        return group;
    }

    protected createSelect({ altText, label, options, value, onChange }: SelectOptions) {
        const group = this.createInputGroup(label);
        const altTextT = this.ctx.localeManager.t(altText);
        const select = new SelectWidget(options, 'ag-charts-dialog__select');
        select.value = value;
        select.setAriaLabel(altTextT);
        select.setTitle(altTextT);
        select.addListener('change', ({ sourceEvent }) => onChange(select.value, sourceEvent));
        group.addChild(select);

        return group;
    }

    /** A labelled row of inputs, for values that belong together such as the x and y of one point. */
    protected createInputRow(label: string, inputs: Widget[]) {
        const group = this.createInputGroup(label);
        group.addClass('ag-charts-dialog__input-group--inputs');
        for (const input of inputs) {
            group.addChild(input);
        }
        return group;
    }

    protected createInput({ ariaLabel, type, value, step, onChange, list }: InputOptions) {
        const input = new InputWidget(type, 'ag-charts-dialog__input');
        if (step != null) input.setStep(step);
        input.value = value;
        input.addCommitListener((event) => onChange(input.value, event));
        input.setAriaLabel(ariaLabel);
        input.setTitle(ariaLabel);
        input.setList(list);
        return input;
    }

    protected createTextArea({ placeholder, value, onChange }: TextAreaOptions) {
        const textArea = new TextAreaWidget();
        textArea.value = value;
        textArea.setPlaceholder(placeholder === '' ? undefined : this.ctx.localeManager.t(placeholder));
        textArea.addListener('input', ({ sourceEvent }) => onChange(textArea.value, sourceEvent));
        return textArea;
    }

    protected createCheckbox({ label, checked, onChange }: CheckboxOptions) {
        const id = createElementId();
        const group = this.createInputGroup(label, id);

        const checkbox = new CheckboxWidget('ag-charts-dialog__checkbox');
        checkbox.checked = checked;
        checkbox.setAriaRole('switch');
        checkbox.id = id;
        checkbox.addListener('change', ({ sourceEvent }) => onChange(checkbox.checked, sourceEvent));

        group.addChild(checkbox);

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
        const colorEl = new InputButtonWidget({ label: altTextT }, 'ag-charts-dialog__color-picker-button');
        colorEl.setAriaLabel(altTextT);
        colorEl.setTabIndex(0);
        colorEl.setTitle(altTextT);
        colorEl.addListener('mousedown', ({ sourceEvent }) => {
            this.colorPickerButtonMouseDown = sourceEvent;
        });
        colorEl.addListener('click', ({ sourceEvent }) => {
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
                sourceEvent,
                onChange: (newColorOpacity: string, newColor: string, newOpacity: number, newIsMultiColor: boolean) => {
                    colorEl.setCSSVariable('--color', newColorOpacity);
                    colorEl.toggleClass('ag-charts-dialog__color-picker-button--multi-color', newIsMultiColor);
                    onChange(newColorOpacity, newColor, newOpacity, newIsMultiColor);
                },
                onChangeHide,
            });
        });

        if (isMultiColor) {
            colorEl.addClass('ag-charts-dialog__color-picker-button--multi-color');
        } else if (color != null && color !== '') {
            const hex = Color.fromString(color);
            const hexWithOpacity = new Color(hex.r, hex.g, hex.b, opacity);
            colorEl.setCSSVariable('--color', hexWithOpacity.toHexString());
        }

        group.addChild(colorEl);

        this.hideFns.push(() => {
            this.colorPicker.hide();
        });

        return group;
    }

    /***********
     * Private *
     ***********/

    private createHeaderCloseButton() {
        const button = new InputButtonWidget(
            { icon: 'close', altText: this.ctx.localeManager.t('iconAltTextClose') },
            'ag-charts-dialog__close-button'
        );
        button.addListener('click', () => this.hide());
        return button;
    }

    private createInputGroupLabel(label: string) {
        return new LabelWidget(this.ctx.localeManager.t(label), 'ag-charts-dialog__input-group-label');
    }

    private createInputGroup(label: string, controlId?: ElementID) {
        const group = new ContainerWidget('ag-charts-dialog__input-group');
        const labelWidget = this.createInputGroupLabel(label);
        labelWidget.setFor(controlId);
        group.addChild(labelWidget);
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
        const popover = this.getPopoverWidget();
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

    private getColorPickerAnchors(anchorWidget?: Widget) {
        if (anchorWidget) this.colorPickerAnchor = anchorWidget;
        if (!this.colorPickerAnchor) return;

        const rect = this.colorPickerAnchor.getBoundingClientRect();
        const canvasRect = this.ctx.domManager.getBoundingClientRect();

        const topLeft = Vec2.sub(Vec2.from(rect.x, rect.y), Vec2.from(canvasRect.left, canvasRect.top));
        const anchor = Vec2.add(topLeft, Vec2.from(0, rect.height + 5));
        const fallbackAnchor = Vec2.sub(topLeft, Vec2.from(0, 5));

        return { anchor, fallbackAnchor };
    }
}

class DragHandleWidget extends ContainerWidget {
    constructor() {
        super('ag-charts-dialog__drag-handle');
        this.addChild(IconWidget.fromName('drag-handle'));
    }
}
