import { _ModuleSupport, type _Scene, _Util } from 'ag-charts-community';
import type { AgIconName } from 'ag-charts-types';

import { ColorPicker } from '../../features/color-picker/colorPicker';
import { Popover, type PopoverOptions } from '../popover/popover';

const {
    createButton,
    createCheckbox,
    createElement,
    createIcon,
    createSelect,
    createTextArea,
    initRovingTabIndex,
    getWindow,
    mapValues,
} = _ModuleSupport;
const { Vec2 } = _Util;

export interface DialogOptions extends PopoverOptions {}

interface RadioGroupOptions<T extends string> {
    label: string;
    options: Array<{ icon: AgIconName; altText: string; value: T }>;
    value: T;
    onChange: (value: T) => void;
}

interface SelectOptions extends _ModuleSupport.SelectOptions {
    altText: string;
    label: string;
}

interface TextAreaOptions extends _ModuleSupport.TextAreaOptions {
    placeholder: string;
}

interface CheckboxOptions extends _ModuleSupport.CheckboxOptions {
    label: string;
}

interface ColorPickerOptions {
    altText: string;
    label: string;
    value: string | undefined;
    onChange: (colorOpacity: string, color: string, opacity: number) => void;
}

/**
 * A popover that opens at a given position but can be moved by the user. By default, it opens at the bottom right or
 * bottom middle of the chart on charts thinner or wider than 1000px respectively. It will reposition to be
 * constrained within the boundaries of the chart.
 *
 * Dialogs may also contain tabs, inputs and nested color pickers.
 */
export abstract class Dialog<Options extends DialogOptions = DialogOptions> extends Popover<Options> {
    private static readonly offset = 60;

    private readonly colorPicker = new ColorPicker(this.ctx, { detached: true });
    private colorPickerAnchorElement?: HTMLElement;
    private dragStartState?: { client: _Util.Vec2; position: _Util.Vec2 };
    private seriesRect?: _Scene.BBox;
    private initialFocus?: HTMLElement;

    constructor(ctx: _ModuleSupport.ModuleContext, id: string) {
        super(ctx, id);
        this.destroyFns.push(ctx.layoutManager.addListener('layout:complete', this.onLayoutComplete.bind(this)));
    }

    protected override showWithChildren(children: Array<HTMLElement>, options: Options) {
        options.initialFocus ??= this.initialFocus;

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

    protected override updatePosition(position: _Util.Vec2): void {
        super.updatePosition(position);

        const { anchor, fallbackAnchor } = this.getColorPickerAnchors() ?? {};
        if (!anchor) return;

        this.colorPicker.setAnchor(anchor, fallbackAnchor);
    }

    /**************
     * Containers *
     **************/
    protected createTabs<T extends Record<string, { label: string; content: HTMLElement; onShow?: () => void }>>(
        initial: keyof T,
        tabs: T
    ) {
        const element = createElement('div', 'ag-charts-dialog__tabs');

        const onPressTab = (active: keyof T) => {
            for (const [key, tab] of Object.entries(tabs)) {
                tab.content.classList.toggle('ag-charts-dialog__tab-content--active', key === active);
                tabButtons[key].classList.toggle('ag-charts-dialog__tab-button--active', key === active);
                if (key === active) tab.onShow?.();
            }
        };

        const header = createElement('div', 'ag-charts-dialog__header');
        const dragHandle = this.createHeaderDragHandle();
        const tabButtons = mapValues(tabs, (tab, key) =>
            createButton(
                {
                    label: this.ctx.localeManager.t(tab.label),
                    onPress: () => onPressTab(key),
                },
                'ag-charts-dialog__tab-button'
            )
        );
        const closeButton = this.createHeaderCloseButton();

        header.append(dragHandle, ...Object.values(tabButtons), closeButton);
        element.append(header, ...Object.values(tabs).map((t) => t.content));

        tabs[initial].content.classList.add('ag-charts-dialog__tab-content--active');
        tabs[initial].onShow?.();
        tabButtons[initial].classList.add('ag-charts-dialog__tab-button--active');

        initRovingTabIndex({ orientation: 'horizontal', buttons: Object.values(tabButtons) });

        this.initialFocus = tabButtons[initial];

        return element;
    }

    protected createTabContent() {
        return createElement('div', 'ag-charts-dialog__tab-content');
    }

    /**********
     * Inputs *
     **********/
    protected createInputGroupLine() {
        return createElement('div', 'ag-charts-dialog__input-group-line');
    }

    protected createRadioGroup<T extends string>({ label, options, value, onChange }: RadioGroupOptions<T>) {
        const group = this.createInputGroup(label);
        group.role = 'radiogroup';
        group.tabIndex = -1;
        group.ariaLabel = this.ctx.localeManager.t(label);

        const activeClass = 'ag-charts-dialog__button--active';
        const buttons: HTMLButtonElement[] = [];

        for (const button of options) {
            const altTextT = this.ctx.localeManager.t(button.altText);

            const buttonEl = createButton(
                {
                    label: createIcon(button.icon),
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
                    className: 'ag-charts-dialog__button',
                    role: 'radio',
                    ariaChecked: button.value === value ? 'true' : 'false',
                    ariaLabel: altTextT,
                    title: altTextT,
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
            { className: 'ag-charts-dialog__select', ariaLabel: altTextT, title: altTextT }
        );
        group.append(select);

        return group;
    }

    protected createTextArea({ placeholder, value, onChange }: TextAreaOptions) {
        const placeholderT = placeholder ? this.ctx.localeManager.t(placeholder) : undefined;
        const textArea = createTextArea({ value, onChange }, { placeholder: placeholderT });

        return textArea;
    }

    protected createCheckbox({ label, checked, onChange }: CheckboxOptions) {
        const id = `ag-charts__${label}`;
        const group = this.createInputGroup(label, { for: id });

        const checkbox = createCheckbox({ checked, onChange }, 'ag-charts-dialog__checkbox');
        checkbox.id = id;

        group.append(checkbox);

        return group;
    }

    protected createColorPicker({ value, label, altText, onChange }: ColorPickerOptions) {
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
                        color: defaultColor,
                        opacity: 1,
                        sourceEvent: event,
                        onChange: (colorOpacity: string, color: string, opacity: number) => {
                            defaultColor = colorOpacity;
                            colorEl.style.setProperty('--color', colorOpacity);
                            onChange(colorOpacity, color, opacity);
                        },
                    });
                },
            },
            {
                className: 'ag-charts-dialog__color-picker-button',
                ariaLabel: altTextT,
                title: altTextT,
                tabIndex: 0,
            }
        );

        if (value) colorEl.style.setProperty('--color', value);
        let defaultColor = value;

        group.append(colorEl);

        this.hideFns.push(() => {
            this.colorPicker.hide();
        });

        return group;
    }

    /***********
     * Private *
     ***********/
    private createHeaderDragHandle() {
        const dragHandle = createElement('div', 'ag-charts-dialog__drag-handle');
        const dragHandleIcon = createIcon('drag-handle');
        dragHandle.append(dragHandleIcon);
        dragHandle.addEventListener('mousedown', this.onDragStart.bind(this, dragHandle));

        return dragHandle;
    }

    private createHeaderCloseButton() {
        const closeButton = createButton(
            { label: createIcon('close'), onPress: () => this.hide() },
            'ag-charts-dialog__close-button'
        );

        return closeButton;
    }

    private createInputGroup(label: string, options?: { for?: string }) {
        const group = createElement('div', 'ag-charts-dialog__input-group');

        const labelEl = createElement('label', 'ag-charts-dialog__input-group-label');
        labelEl.innerText = this.ctx.localeManager.t(label);
        if (options?.for) labelEl.setAttribute('for', options.for);

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

    private onDragStart(dragHandle: HTMLDivElement, event: MouseEvent) {
        const popover = this.getPopoverElement();
        if (!popover) return;

        const {
            ctx: { domManager },
        } = this;

        // Prevent text selection while dragging
        event.preventDefault();

        this.dragStartState = {
            client: Vec2.from(event.clientX, event.clientY),
            position: Vec2.from(
                Number(popover.style.getPropertyValue('left').replace('px', '')),
                Number(popover.style.getPropertyValue('top').replace('px', ''))
            ),
        };
        dragHandle.classList.add('ag-charts-dialog__drag-handle--dragging');

        const onDrag = this.onDrag.bind(this);
        const onDragEnd = () => {
            domManager.removeEventListener('mousemove', onDrag);
            dragHandle.classList.remove('ag-charts-dialog__drag-handle--dragging');
        };

        domManager.addEventListener('mousemove', onDrag);
        domManager.addEventListener('mouseup', onDragEnd, { once: true });

        // Catch `mouseup` events that do not propagate beyond the overlay
        popover.addEventListener('mouseup', () => onDragEnd, { once: true });
    }

    private onDrag(event: MouseEvent) {
        const { dragStartState } = this;
        const popover = this.getPopoverElement();

        if (!dragStartState || !popover) return;

        const offset = Vec2.sub(Vec2.from(event.clientX, event.clientY), dragStartState.client);
        const position = Vec2.add(dragStartState.position, offset);

        const bounds = this.ctx.domManager.getBoundingClientRect();

        if (position.x >= bounds.x && position.x + popover.offsetWidth <= bounds.width) {
            popover.style.setProperty('left', `${position.x}px`);
        }

        if (position.y >= bounds.y && position.y + popover.offsetHeight <= bounds.height) {
            popover.style.setProperty('top', `${position.y}px`);
        }
    }

    private reposition() {
        const { seriesRect, ctx } = this;
        const clientRect = ctx.domManager.getBoundingClientRect();
        const popover = this.getPopoverElement();
        if (!seriesRect || !popover) return;

        // Position the dialog relative to the series rect height, to cater for the range buttons and other
        // paraphernalia at the bottom of the chart, but relative to the client width so the dialog
        // remains centered relative to the floating zoom buttons.
        const outerOffset = Vec2.from(0, seriesRect.y);
        const outerSize = Vec2.from(clientRect.width, seriesRect.height);
        const popoverSize = Vec2.from(popover);
        const halfWidth = Vec2.from(0.5, 1);

        let position: _Util.Vec2;
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
