import { _ModuleSupport } from 'ag-charts-community';

import { Dialog, type DialogOptions } from '../../../components/dialog/dialog';
import type { ChannelPropertiesType, LinePropertiesType } from '../annotationsSuperTypes';

const { focusCursorAtEnd } = _ModuleSupport;

interface LineSettingsDialogOptions extends DialogOptions {
    onChange: (props: LineSettingsDialogChangeProps) => void;
}

export interface LineSettingsDialogChangeProps {
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

    showLineOrChannel(datum: LinePropertiesType | ChannelPropertiesType, options: LineSettingsDialogOptions) {
        const header = this.createHeader('Text');
        const textTabContent = this.createTabContent();

        const textArea = this.createTextArea({
            placeholder: 'Add Text',
            value: datum.text.label,
            onChange: (label) => options.onChange({ label }),
        });

        const fontSizeAndColor = this.createInputGroupLine();
        const fontSize = this.createFontSizeSelect(datum.text.fontSize, (value: number) =>
            options.onChange({ fontSize: value })
        );
        const colorPicker = this.createColorPickerInput(datum.text.color, (color) => {
            options.onChange({ color });
        });
        fontSizeAndColor.append(fontSize, colorPicker);

        const positionAndAlignment = this.createInputGroupLine();
        const textPosition = datum.text.position === 'inside' ? 'center' : datum.text.position;
        const position = this.createPositionButtonGroup(textPosition!, (value: string) =>
            options.onChange({ position: value })
        );
        const alignment = this.createAlignmentButtonGroup(datum.text.alignment!, (value: string) =>
            options.onChange({ alignment: value })
        );
        positionAndAlignment.append(position, alignment);

        textTabContent.append(textArea, fontSizeAndColor, positionAndAlignment);

        const popover = this.showWithChildren([header, textTabContent], options);
        popover.classList.add('ag-charts-dialog--annotation-settings');

        focusCursorAtEnd(textArea);
    }

    private createColorPickerInput(color: string | undefined, onChangeColor: (color: string) => void) {
        return this.createColorPicker({
            label: 'Color',
            color,
            onChange: (color) => onChangeColor(color),
        });
    }

    private createFontSizeSelect(fontSize: number, onChangeFontSize: (fontSize: number) => void) {
        return this.createSelect({
            label: 'Size',
            options: [10, 12, 14, 16, 18, 22, 28, 36, 46].map((n) => ({ label: `${n}px`, value: `${n}` })),
            value: `${fontSize}`,
            onChange: (value) => onChangeFontSize(Number(value)),
        });
    }

    private createPositionButtonGroup(position: string, onChangePosition: (position: string) => void) {
        return this.createRadioGroup({
            label: 'Position',
            options: [
                { icon: 'position-top', altText: 'iconAltTextPositionTop', value: 'top' },
                { icon: 'position-center', altText: 'iconAltTextPositionCenter', value: 'center' },
                { icon: 'position-bottom', altText: 'iconAltTextPositionBottom', value: 'bottom' },
            ],
            value: position,
            onChange: onChangePosition,
        });
    }

    private createAlignmentButtonGroup(alignment: string, onChangeAlignment: (alignment: string) => void) {
        return this.createRadioGroup({
            label: 'Align',
            options: [
                { icon: 'align-left', altText: 'iconAltTextAlignLeft', value: 'left' },
                { icon: 'align-center', altText: 'iconAltTextAlignCenter', value: 'center' },
                { icon: 'align-right', altText: 'iconAltTextAlignRight', value: 'right' },
            ],
            value: alignment,
            onChange: onChangeAlignment,
        });
    }
}
