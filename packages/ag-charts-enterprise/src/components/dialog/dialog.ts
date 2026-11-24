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

const MULTI_COLOR_CLASS = 'ag-charts-dialog__color-picker-button--multi-color';

function toColorWithOpacity(color: string, opacity: number | undefined) {
    const { r, g, b } = Color.fromString(color);
    return new Color(r, g, b, opacity).toHexString();
}

export type DialogCloseOutcome = 'applied' | 'cancelled' | 'unchanged';

export interface DialogOptions extends _ModuleSupport.PopoverOptions {
    /**
     * Whether the dialog, and the colour pickers in it, show Apply and Cancel buttons. Closing the dialog any other way
     * than Apply counts as Cancel.
     */
    showActionButtons?: boolean;
}

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
    /** The granularity of a `datetime-local` input, in seconds, or the amount a `number` input's spinner moves by. */
    step?: number;
    /** The bounds of a `number` input. */
    range?: { min: number; max: number };
    /** The id of the datalist the input suggests from. */
    list?: ElementID;
    /** Called when the user commits a value; a `date` or `datetime-local` input may commit one that has not changed. */
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
    onChangeHide: (cancelled: boolean) => void;
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
    private applyButton?: InputButtonWidget;

    /** Whether Apply and Cancel buttons are shown, as set by the options of the current show. */
    private showActionButtons = false;
    /** Whether the dialog is closing through Apply. */
    private applied = false;
    /** Whether anything has changed since the dialog opened. */
    private changed = false;

    constructor(ctx: DynamicContext<_ModuleSupport.ChartRegistry>, id: string) {
        super(ctx, id);
        this.cleanup.register(ctx.eventsHub.on('layout:complete', this.onLayoutComplete.bind(this)));
    }

    protected override showWithChildren(children: Widget[], options: Options): ContainerWidget {
        this.showActionButtons = options.showActionButtons ?? false;
        this.applied = false;
        this.changed = false;
        this.applyButton = undefined;
        if (this.showActionButtons) {
            children = [...children, this.createActionButtons()];
        }
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

    protected override onHide() {
        this.colorPicker.hide();
    }

    protected override updatePosition(position: Point): void {
        super.updatePosition(position);

        const { anchor, fallbackAnchor } = this.getColorPickerAnchors() ?? {};
        if (!anchor) return;

        this.colorPicker.setAnchor(anchor, fallbackAnchor);
    }

    /** Closes the dialog, keeping the changes made since it opened. */
    public apply() {
        this.applied = true;
        this.hide();
    }

    /** Enables the Apply button, once there is a change to apply. */
    public markChanged() {
        this.changed = true;
        this.applyButton?.setEnabled(true);
    }

    /** How the dialog closed, which is `unchanged` when there was nothing to apply or cancel. */
    protected get closeOutcome(): DialogCloseOutcome {
        if (!this.changed) return 'unchanged';
        return this.applied ? 'applied' : 'cancelled';
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

    /** Inputs side by side, such as the x and y of one point; a row that `follows` another sits close beneath it. */
    protected createInputRow(inputs: Widget[], follows = false) {
        const row = new ContainerWidget('ag-charts-dialog__input-row');
        if (follows) {
            row.addClass('ag-charts-dialog__input-row--follows');
        }
        for (const input of inputs) {
            row.addChild(input);
        }
        return row;
    }

    /** An input with its already translated label above it, or alongside it when `inline`. */
    protected createLabelledInput(label: string, input: InputWidget, inline: boolean, ...extras: Widget[]) {
        const group = new ContainerWidget('ag-charts-dialog__labelled-input');
        if (inline) {
            group.addClass('ag-charts-dialog__labelled-input--inline');
        }
        const labelWidget = new LabelWidget(label, 'ag-charts-dialog__input-group-label');
        input.id = createElementId();
        labelWidget.setFor(input.id);
        group.addChild(labelWidget);
        group.addChild(input);
        for (const extra of extras) {
            group.addChild(extra);
        }
        return group;
    }

    protected createInput({ ariaLabel, type, value, step, range, onChange, list }: InputOptions) {
        const input = new InputWidget(type, 'ag-charts-dialog__input');
        input.setStep(step);
        if (range) input.setRange(range.min, range.max);
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

    private createActionButtons() {
        const { localeManager } = this.ctx;
        const actions = new ContainerWidget('ag-charts-dialog__actions');
        const cancelButton = new InputButtonWidget(
            { label: localeManager.t('annotationsCancel') },
            'ag-charts-dialog__cancel-button'
        );
        const applyButton = new InputButtonWidget(
            { label: localeManager.t('annotationsApply') },
            'ag-charts-dialog__apply-button'
        );
        // There is nothing to apply until something changes.
        applyButton.setEnabled(false);
        cancelButton.addListener('click', () => this.hide());
        applyButton.addListener('click', () => this.apply());
        actions.addChild(cancelButton);
        actions.addChild(applyButton);
        this.applyButton = applyButton;
        return actions;
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
        // The colour the picker opens with, which changes as the user picks.
        const current = { color, opacity, isMultiColor };
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
            const opening = { ...current };
            let settled = { ...opening };
            let opened = false;
            const changeColor = (
                newColorOpacity: string,
                newColor: string,
                newOpacity: number,
                newIsMultiColor: boolean,
                restoring = false
            ) => {
                current.color = newColor;
                current.opacity = newOpacity;
                current.isMultiColor = newIsMultiColor;
                colorEl.setCSSVariable('--color', newColorOpacity);
                colorEl.toggleClass(MULTI_COLOR_CLASS, newIsMultiColor);
                onChange(newColorOpacity, newColor, newOpacity, newIsMultiColor);
                // The picker reports a default colour as it opens, and a cancel puts the colour back; neither is an edit.
                if (opened && !restoring) this.markChanged();
            };
            this.colorPicker.show({
                anchor,
                fallbackAnchor,
                color: opening.color,
                opacity: opening.opacity,
                isMultiColor: opening.isMultiColor,
                hasMultiColorOption,
                showActionButtons: this.showActionButtons,
                sourceEvent,
                onChange: (...args) => changeColor(...args),
                onChangeHide: (cancelled) => {
                    if (cancelled && this.showActionButtons) {
                        // The dialog holds back its history until Apply, so there is no record to revert to. Put the
                        // colour back to what the picker settled on as it opened, leaving the dialog's other changes alone.
                        const { color: c = '', opacity: o = 1, isMultiColor: m = false } = settled;
                        if (c !== '') changeColor(toColorWithOpacity(c, o), c, o, m, true);
                        return;
                    }
                    if (cancelled) {
                        // Cancelling undoes the colour change, so put the swatch back to how it was when the picker opened.
                        const { color: c, opacity: o, isMultiColor: m } = opening;
                        colorEl.setCSSVariable(
                            '--color',
                            !m && c != null && c !== '' ? toColorWithOpacity(c, o) : null
                        );
                        colorEl.toggleClass(MULTI_COLOR_CLASS, !!m);
                    }
                    onChangeHide(cancelled);
                },
            });
            // A colour that was unset has been given the picker's default by now.
            settled = { ...current };
            opened = true;
        });

        if (isMultiColor) {
            colorEl.addClass(MULTI_COLOR_CLASS);
        } else if (color != null && color !== '') {
            colorEl.setCSSVariable('--color', toColorWithOpacity(color, opacity));
        }

        group.addChild(colorEl);

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
        // A colour picker handles its own Enter and Escape, and prevents their default.
        if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return;

        if (event.key === 'Escape') {
            this.hide();
        } else if (event.key === 'Enter' && this.showActionButtons) {
            // A button, select or text area already does something with Enter.
            const tagName = (event.target as Element | null)?.tagName;
            if (tagName === 'BUTTON' || tagName === 'SELECT' || tagName === 'TEXTAREA') return;

            // Commit the field being edited before it closes with the dialog.
            (this.ctx.agDocument.document.activeElement as HTMLElement | null)?.blur();
            this.apply();
            // Closing returns focus to the toolbar button, which the Enter keypress would otherwise press.
            event.preventDefault();
        }
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
