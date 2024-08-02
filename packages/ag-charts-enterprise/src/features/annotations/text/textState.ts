import { _ModuleSupport, _Util } from 'ag-charts-community';

import { TextualPointStateMachine } from '../states/textualPointState';
import { TextProperties } from './textProperties';
import type { TextScene } from './textScene';

export class TextStateMachine extends TextualPointStateMachine<TextProperties, TextScene> {
    protected override createDatum() {
        return new TextProperties();
    }
}
