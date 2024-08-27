import type { _ModuleSupport } from 'ag-charts-community';

import { Dialog, type DialogOptions } from '../../../components/dialog/dialog';
import type { ChannelPropertiesType, LinePropertiesType } from '../annotationsSuperTypes';

interface LineSettingsDialogOptions extends DialogOptions {
    onChange: (props: { alignment?: string; fontSize?: number; position?: string; label?: string }) => void;
}

export class AnnotationSettingsDialog extends Dialog {
    constructor(ctx: _ModuleSupport.ModuleContext) {
        super(ctx, 'settings');
    }

    showLine(datum: LinePropertiesType | ChannelPropertiesType, options: LineSettingsDialogOptions) {
        const header = this.createHeader('Text');
        const textTabContent = this.createTabContent();

        const textArea = this.createTextArea({
            placeholder: 'Add Text',
            value: datum.text.label,
            onChange: (label) => options.onChange({ label }),
        });

        const fontSize = this.createFontSizeSelect(datum.text.fontSize, (value: number) =>
            options.onChange({ fontSize: value })
        );

        const textPosition = datum.text.position === 'inside' ? 'center' : datum.text.position;
        const position = this.createPositionButtonGroup(textPosition!, (value: string) =>
            options.onChange({ position: value })
        );
        const alignment = this.createAlignmentButtonGroup(datum.text.alignment!, (value: string) =>
            options.onChange({ alignment: value })
        );

        textTabContent.append(textArea, fontSize, position, alignment);

        const popover = this.showWithChildren([header, textTabContent], options);
        popover.classList.add('ag-charts-dialog--annotation-settings');
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
        return this.createButtonGroup({
            label: 'Position',
            options: [
                { icon: 'position-top', value: 'top' },
                { icon: 'position-center', value: 'center' },
                { icon: 'position-bottom', value: 'bottom' },
            ],
            value: position,
            onChange: onChangePosition,
        });
    }

    private createAlignmentButtonGroup(alignment: string, onChangeAlignment: (alignment: string) => void) {
        return this.createButtonGroup({
            label: 'Align',
            options: [
                { icon: 'align-left', value: 'left' },
                { icon: 'align-center', value: 'center' },
                { icon: 'align-right', value: 'right' },
            ],
            value: alignment,
            onChange: onChangeAlignment,
        });
    }
}
