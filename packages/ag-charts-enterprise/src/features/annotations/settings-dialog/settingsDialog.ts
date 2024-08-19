import { _ModuleSupport, _Util } from 'ag-charts-community';

import { Dialog, type DialogOptions } from '../../../components/dialog/dialog';
import type { LineProperties } from '../line/lineProperties';

interface LineSettingsDialogOptions extends DialogOptions {
    onChangeText?: (value: string) => void;
}

export class AnnotationSettingsDialog extends Dialog {
    constructor(ctx: _ModuleSupport.ModuleContext) {
        super(ctx, 'settings');
    }

    showLine(_datum: LineProperties, options: LineSettingsDialogOptions) {
        const header = this.createHeader('Text');
        const textArea = this.createTextArea({
            placeholder: 'Add Text',
            onChange: options.onChangeText,
        });

        const popover = this.showWithChildren([header, textArea], options);
        popover.classList.add('ag-charts-dialog--annotation-settings');
    }
}
