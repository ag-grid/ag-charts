import { type AgAnnotationLineStyleType, _ModuleSupport } from 'ag-charts-community';

import { Dialog, type DialogOptions } from '../../../components/dialog/dialog';
import type { AnnotationLineStyle } from '../annotationTypes';
import { LINE_STROKE_WIDTH_ITEMS, TEXT_SIZE_ITEMS } from '../annotationsMenuOptions';
import type { ChannelPropertiesType, LinePropertiesType } from '../annotationsSuperTypes';
import { isChannelType } from '../utils/types';

const { focusCursorAtEnd } = _ModuleSupport;

interface LinearSettingsDialogOptions extends DialogOptions {
    onChangeLine: (props: LinearSettingsDialogLineChangeProps) => void;
    onChangeLineStyle: (lineStyle: AnnotationLineStyle) => void;
    onChangeText: (props: LinearSettingsDialogTextChangeProps) => void;
}

export interface LinearSettingsDialogLineChangeProps {
    extendStart?: boolean;
    extendEnd?: boolean;
    stroke?: string;
}

export interface LinearSettingsDialogTextChangeProps {
    alignment?: string;
    color?: string;
    fontSize?: number;
    position?: string;
    label?: string;
}

export class AnnotationSettingsDialog extends Dialog {
    constructor(ctx: _ModuleSupport.ModuleContext) {
        super(ctx, 'settings');
    }

    showLineOrChannel(datum: LinePropertiesType | ChannelPropertiesType, options: LinearSettingsDialogOptions) {
        const lineTab = this.createLinearLineTab(datum, options);
        const textTab = this.createLinearTextTab(datum, options);

        const tabs = this.createTabs('line', {
            line: {
                label: isChannelType(datum) ? 'dialogHeaderChannel' : 'dialogHeaderLine',
                content: lineTab,
            },
            text: {
                label: 'dialogHeaderText',
                content: textTab.content,
                onShow: textTab.onShow,
            },
        });

        const popover = this.showWithChildren([tabs], options);
        popover.classList.add('ag-charts-dialog--annotation-settings');
    }

    private createLinearLineTab(
        datum: LinePropertiesType | ChannelPropertiesType,
        options: LinearSettingsDialogOptions
    ) {
        const content = this.createTabContent();

        const colorAndStrokeWidth = this.createInputGroupLine();
        const colorPicker = this.createColorPickerInput(datum.getDefaultColor('line-color'), (value) => {
            options.onChangeLine({ stroke: value });
        });
        const strokeWidth = this.createStrokeWidthSelect(datum.strokeWidth ?? 2, (value) => {
            options.onChangeLineStyle({ strokeWidth: value });
        });
        colorAndStrokeWidth.append(colorPicker, strokeWidth);

        const lineStyle = this.createLineStyleRadioGroup(datum.lineStyle ?? 'solid', (value) =>
            options.onChangeLineStyle({ type: value })
        );

        content.append(colorAndStrokeWidth, lineStyle);

        if ('extendStart' in datum && 'extendEnd' in datum) {
            content.append(
                this.createCheckbox({
                    label: isChannelType(datum) ? 'Extend channel start' : 'Extend line start',
                    checked: datum.extendStart ?? false,
                    onChange: (extendStart) => options.onChangeLine({ extendStart }),
                }),
                this.createCheckbox({
                    label: isChannelType(datum) ? 'Extend channel end' : 'Extend line end',
                    checked: datum.extendEnd ?? false,
                    onChange: (extendEnd) => options.onChangeLine({ extendEnd }),
                })
            );
        }

        return content;
    }

    private createLinearTextTab(
        datum: LinePropertiesType | ChannelPropertiesType,
        options: LinearSettingsDialogOptions
    ) {
        const content = this.createTabContent();

        const textArea = this.createTextArea({
            placeholder: 'dialogInputTextareaPlaceholder',
            value: datum.text.label,
            onChange: (value) => options.onChangeText({ label: value }),
        });

        const fontSizeAndColor = this.createInputGroupLine();
        const fontSize = this.createFontSizeSelect(datum.text.fontSize, (value) =>
            options.onChangeText({ fontSize: value })
        );
        const colorPicker = this.createColorPickerInput(datum.text.color, (value) => {
            options.onChangeText({ color: value });
        });
        fontSizeAndColor.append(fontSize, colorPicker);

        const positionAndAlignment = this.createInputGroupLine();
        const textPosition = datum.text.position === 'inside' ? 'center' : datum.text.position;
        const position = this.createPositionRadioGroup(textPosition ?? 'top', (value) =>
            options.onChangeText({ position: value })
        );
        const alignment = this.createAlignmentRadioGroup(datum.text.alignment ?? 'center', (value) =>
            options.onChangeText({ alignment: value })
        );
        positionAndAlignment.append(position, alignment);

        content.append(textArea, fontSizeAndColor, positionAndAlignment);

        return { content, onShow: () => focusCursorAtEnd(textArea) };
    }

    private createColorPickerInput(color: string | undefined, onChange: (value: string) => void) {
        return this.createColorPicker({
            label: 'dialogInputColorPicker',
            altText: 'dialogInputColorPickerAltText',
            value: color,
            onChange,
        });
    }

    private createStrokeWidthSelect(strokeWidth: number, onChange: (value: number) => void) {
        return this.createSelect({
            label: 'dialogInputStrokeWidth',
            altText: 'dialogInputStrokeWidthAltText',
            options: LINE_STROKE_WIDTH_ITEMS.map(({ label, value }) => ({ label: label!, value: `${value}` })),
            value: String(strokeWidth),
            onChange: (value) => onChange(Number(value)),
        });
    }

    private createLineStyleRadioGroup(
        lineStyle: AgAnnotationLineStyleType,
        onChange: (value: AgAnnotationLineStyleType) => void
    ) {
        return this.createRadioGroup({
            label: 'dialogInputLineStyle',
            options: [
                { icon: 'line-style-solid', altText: 'iconAltTextLineStyleSolid', value: 'solid' },
                { icon: 'line-style-dashed', altText: 'iconAltTextLineStyleDashed', value: 'dashed' },
                { icon: 'line-style-dotted', altText: 'iconAltTextLineStyleDotted', value: 'dotted' },
            ],
            value: lineStyle,
            onChange,
        });
    }

    private createFontSizeSelect(fontSize: number, onChange: (value: number) => void) {
        return this.createSelect({
            label: 'dialogInputFontSize',
            altText: 'dialogInputFontSizeAltText',
            options: TEXT_SIZE_ITEMS.map(({ label, value }) => ({ label: label!, value: String(value) })),
            value: String(fontSize),
            onChange: (value) => onChange(Number(value)),
        });
    }

    private createPositionRadioGroup(position: string, onChange: (value: string) => void) {
        return this.createRadioGroup({
            label: 'dialogInputPosition',
            options: [
                { icon: 'position-top', altText: 'iconAltTextPositionTop', value: 'top' },
                { icon: 'position-center', altText: 'iconAltTextPositionCenter', value: 'center' },
                { icon: 'position-bottom', altText: 'iconAltTextPositionBottom', value: 'bottom' },
            ],
            value: position,
            onChange,
        });
    }

    private createAlignmentRadioGroup(alignment: string, onChange: (value: string) => void) {
        return this.createRadioGroup({
            label: 'dialogInputAlign',
            options: [
                { icon: 'align-left', altText: 'iconAltTextAlignLeft', value: 'left' },
                { icon: 'align-center', altText: 'iconAltTextAlignCenter', value: 'center' },
                { icon: 'align-right', altText: 'iconAltTextAlignRight', value: 'right' },
            ],
            value: alignment,
            onChange,
        });
    }
}
