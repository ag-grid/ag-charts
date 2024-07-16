import { _ModuleSupport, _Util } from 'ag-charts-community';

import { TextualStateMachine } from '../states/textualState';
import { NoteProperties } from './noteProperties';
import type { NoteScene } from './noteScene';

export class NoteStateMachine extends TextualStateMachine<NoteProperties, NoteScene> {
    protected override createDatum() {
        return new NoteProperties();
    }
}
