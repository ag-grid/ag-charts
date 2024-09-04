import { _ModuleSupport, _Util } from 'ag-charts-community';
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
    label: string;
    color: string | undefined;
    onChange: (colorOpacity: string, color: string, opacity: number) => void;
}

/**
 * A popover that opens at the bottom right of the chart but can be moved by the user.
 */
export abstract class Dialog<Options extends DialogOptions = DialogOptions> extends Popover<Options> {
    private static readonly offset = 100;

    private colorPicker = new ColorPicker(this.ctx);
    private colorPickerAnchorElement?: HTMLElement;
    private dragStartState?: { client: _Util.Vec2; position: _Util.Vec2 };

    constructor(ctx: _ModuleSupport.ModuleContext, id: string) {
        super(ctx, id);
        this.destroyFns.push(ctx.domManager.addListener('resize', () => this.reposition()));
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
        group.ariaLabel = label;

        const activeClass = 'ag-charts-dialog__button--active';
        const buttons: HTMLButtonElement[] = [];

        for (const button of options) {
            const buttonEl = createElement('button', `ag-charts-dialog__button`);
            const iconEl = createElement('span', this.ctx.domManager.getIconClassNames(button.icon));
            buttonEl.role = 'radio';
            buttonEl.ariaLabel = this.ctx.localeManager.t(button.altText ?? '');
            iconEl.ariaHidden = 'true';
            if (button.value === value) {
                buttonEl.classList.add(activeClass);
                buttonEl.ariaChecked = 'true';
            } else {
                buttonEl.ariaChecked = 'false';
            }
            buttonEl.ariaLabel = this.ctx.localeManager.t(button.altText);
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

    protected createSelect({ label, options, value, onChange }: SelectOptions) {
        const group = this.createInputGroup(label);

        const select = createElement('select', 'ag-charts-dialog__select');
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
            textArea.setAttribute('placeholder', options.placeholder);
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

    protected createColorPicker({ color, label, onChange }: ColorPickerOptions) {
        const group = this.createInputGroup(label);

        const colorEl = createElement('button', 'ag-charts-dialog__color-picker-button');
        if (color) colorEl.style.setProperty('--color', color);

        let defaultColor = color;

        colorEl.addEventListener('click', (sourceEvent) => {
            const { anchor, fallbackAnchor } = this.getColorPickerAnchors(colorEl) ?? {};
            this.colorPicker.show({
                anchor,
                fallbackAnchor,
                color: defaultColor,
                opacity: 1,
                sourceEvent,
                nested: true,
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
        title.textContent = label;

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
        labelEl.innerText = label;
        group.appendChild(labelEl);

        return group;
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
        const bbox = this.ctx.domManager.getBoundingClientRect();
        const popover = this.getPopoverElement();
        if (!popover) return;

        let position: _Util.Vec2;
        if (bbox.width > 1000) {
            const bottomCenter = Vec2.from(bbox.width / 2, bbox.height);
            const popoverOffset = Vec2.from(popover.offsetWidth / 2, popover.offsetHeight);
            position = Vec2.sub(Vec2.sub(bottomCenter, popoverOffset), Vec2.from(0, Dialog.offset));
        } else {
            const bottomRight = Vec2.sub(Vec2.from(bbox), Vec2.from(popover));
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
