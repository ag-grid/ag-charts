import { _ModuleSupport, _Util } from 'ag-charts-community';

import { TextualPointStateMachine } from '../states/textualPointState';
import { NoteProperties } from './noteProperties';
import type { NoteScene } from './noteScene';

export class NoteStateMachine extends TextualPointStateMachine<NoteProperties, NoteScene> {
    protected override createDatum() {
        return new NoteProperties();
    }
}
