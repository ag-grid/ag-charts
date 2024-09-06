import { _ModuleSupport, type _Scene, _Util } from 'ag-charts-community';
import type { AgIconName } from 'ag-charts-types';

import { ColorPicker } from '../../features/color-picker/colorPicker';
import { Popover, type PopoverOptions } from '../popover/popover';

const { createElement, initRovingTabIndex } = _ModuleSupport;
const { Vec2 } = _Util;

export interface DialogOptions extends PopoverOptions {}

interface RadioGroupOptions {
    label: string;
    options: Array<{ icon: AgIconName; altText: string; value: string }>;
    value: string;
    onChange: (value: string) => void;
}

interface SelectOptions {
    altText: string;
    label: string;
    options: Array<{ label: string; value: string }>;
    value: string;
    onChange: (value: string) => void;
}

interface TextAreaOptions {
    placeholder?: string;
    value?: string;
    onChange?: (value: string) => void;
}

interface ColorPickerOptions {
    altText: string;
    label: string;
    value: string | undefined;
    onChange: (colorOpacity: string, color: string, opacity: number) => void;
}

/**
 * A popover that opens at the bottom right of the chart but can be moved by the user.
 */
export abstract class Dialog<Options extends DialogOptions = DialogOptions> extends Popover<Options> {
    private static readonly offset = 60;

    private readonly colorPicker = new ColorPicker(this.ctx, { detached: true });
    private colorPickerAnchorElement?: HTMLElement;
    private dragStartState?: { client: _Util.Vec2; position: _Util.Vec2 };
    private seriesRect?: _Scene.BBox;

    constructor(ctx: _ModuleSupport.ModuleContext, id: string) {
        super(ctx, id);
        this.destroyFns.push(
            ctx.layoutManager.addListener('layout:complete', this.onLayoutComplete.bind(this)),
            ctx.interactionManager.addListener('keydown', this.onKeyDown.bind(this))
        );
    }

    protected override showWithChildren(children: Array<HTMLElement>, options: Options) {
        const popover = super.showWithChildren(children, options);
        popover.classList.add('ag-charts-dialog');
        popover.setAttribute('role', 'dialog');

        popover.addEventListener('mousedown', (event) => {
            if ((event.target as any).classList?.contains('ag-charts-dialog__color-picker-button')) return;
            this.colorPicker.hide();
        });

        // Give the dialog's dimensions a chance to be calculated before positioning
        requestAnimationFrame(() => this.reposition());

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
    protected createHeader(label: string) {
        const header = createElement('div', 'ag-charts-dialog__header');
        const dragHandle = this.createHeaderDragHandle();
        const tabGroup = this.createHeaderTabGroup(label);
        const closeButton = this.createHeaderCloseButton();

        header.append(dragHandle, tabGroup, closeButton);

        return header;
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

    protected createRadioGroup({ label, options, value, onChange }: RadioGroupOptions) {
        const group = this.createInputGroup(label);
        group.role = 'radiogroup';
        group.tabIndex = -1;
        group.ariaLabel = this.ctx.localeManager.t(label);

        const activeClass = 'ag-charts-dialog__button--active';
        const buttons: HTMLButtonElement[] = [];

        for (const button of options) {
            const buttonEl = createElement('button', `ag-charts-dialog__button`);
            const iconEl = createElement('span', this.ctx.domManager.getIconClassNames(button.icon));
            const altTextT = this.ctx.localeManager.t(button.altText);
            buttonEl.role = 'radio';
            buttonEl.ariaLabel = altTextT;
            buttonEl.title = altTextT;
            iconEl.ariaHidden = 'true';
            if (button.value === value) {
                buttonEl.classList.add(activeClass);
                buttonEl.ariaChecked = 'true';
            } else {
                buttonEl.ariaChecked = 'false';
            }
            buttonEl.appendChild(iconEl);
            buttonEl.addEventListener('click', () => {
                for (const b of Array.from(group.children)) {
                    b.classList.remove(activeClass);
                    b.ariaChecked = 'false';
                }
                buttonEl.classList.add(activeClass);
                buttonEl.ariaChecked = 'true';
                onChange(button.value);
            });
            group.appendChild(buttonEl);
            buttons.push(buttonEl);
        }

        initRovingTabIndex({ orientation: 'horizontal', buttons });
        return group;
    }

    protected createSelect({ altText, label, options, value, onChange }: SelectOptions) {
        const group = this.createInputGroup(label);

        const select = createElement('select', 'ag-charts-dialog__select');
        const altTextT = this.ctx.localeManager.t(altText);
        select.ariaLabel = altTextT;
        select.title = altTextT;
        for (const option of options) {
            const optionEl = createElement('option');
            optionEl.value = option.value;
            optionEl.label = option.label;
            select.append(optionEl);
        }

        select.value = value;

        select.addEventListener('change', () => {
            onChange(select.value);
        });

        group.append(select);

        return group;
    }

    protected createTextArea(options: TextAreaOptions) {
        const textArea = createElement('div', 'ag-charts-dialog__textarea');

        try {
            textArea.contentEditable = 'plaintext-only';
        } catch (_) {
            // Fallback to default content editable if plaintext is not available (Firefox)
            textArea.contentEditable = 'true';
        }

        if (options.placeholder != null) {
            textArea.setAttribute('placeholder', this.ctx.localeManager.t(options.placeholder));
        }

        if (options.value != null) {
            textArea.innerText = options.value;
        }

        if (options.onChange != null) {
            textArea.addEventListener('input', () => {
                options.onChange?.(textArea.innerText.trim());
            });
        }

        return textArea;
    }

    protected createColorPicker({ value, label, altText, onChange }: ColorPickerOptions) {
        const group = this.createInputGroup(label);

        const colorEl = createElement('button', 'ag-charts-dialog__color-picker-button');
        const altTextT = this.ctx.localeManager.t(altText);
        colorEl.ariaLabel = altTextT;
        colorEl.title = altTextT;

        if (value) colorEl.style.setProperty('--color', value);
        let defaultColor = value;

        colorEl.addEventListener('click', (sourceEvent) => {
            // Retrieve the anchor for this particular color picker element, and use it when repositioning if the chart
            // is resized. When a different color picker trigger element is clicked that one will take over this task.
            const { anchor, fallbackAnchor } = this.getColorPickerAnchors(colorEl) ?? {};
            this.colorPicker.show({
                anchor,
                fallbackAnchor,
                color: defaultColor,
                opacity: 1,
                sourceEvent,
                onChange: (colorOpacity: string, color: string, opacity: number) => {
                    defaultColor = colorOpacity;
                    colorEl.style.setProperty('--color', colorOpacity);
                    onChange(colorOpacity, color, opacity);
                },
            });
        });

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
        const dragHandleIcon = createElement('span', this.ctx.domManager.getIconClassNames('drag-handle'));
        dragHandle.append(dragHandleIcon);
        dragHandle.addEventListener('mousedown', this.onDragStart.bind(this, dragHandle));

        return dragHandle;
    }

    private createHeaderTabGroup(label: string) {
        const title = createElement('div', 'ag-charts-dialog__title');
        title.textContent = this.ctx.localeManager.t(label);

        return title;
    }

    private createHeaderCloseButton() {
        const closeButton = createElement('button', 'ag-charts-dialog__close-button');
        const closeButtonIcon = createElement('span', this.ctx.domManager.getIconClassNames('close'));
        closeButton.append(closeButtonIcon);
        closeButton.addEventListener('click', () => {
            this.hide();
        });

        return closeButton;
    }

    private createInputGroup(label: string) {
        const group = createElement('div', 'ag-charts-dialog__input-group');

        const labelEl = createElement('div', 'ag-charts-dialog__input-group-label');
        labelEl.innerText = this.ctx.localeManager.t(label);
        group.appendChild(labelEl);

        return group;
    }

    private onLayoutComplete(event: _ModuleSupport.LayoutCompleteEvent) {
        this.seriesRect = event.series.paddedRect;
        this.reposition();
    }

    private onKeyDown(event: _ModuleSupport.KeyInteractionEvent<'keydown'>) {
        if (event.sourceEvent.key !== 'Escape') return;
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
