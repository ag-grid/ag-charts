import { _ModuleSupport, _Util } from 'ag-charts-community';

import { TextualStateMachine } from '../states/textualState';
import { TextProperties } from './textProperties';
import type { TextScene } from './textScene';

export class TextStateMachine extends TextualStateMachine<TextProperties, TextScene> {
    protected override createDatum() {
        return new TextProperties();
    }
}
