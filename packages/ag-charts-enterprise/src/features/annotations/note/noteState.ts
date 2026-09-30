import { TextualPointStateMachine } from '../states/textualPointState';
import { type NoteDatum, noteDatum } from './noteDatum';
import type { NoteScene } from './noteScene';

export class NoteStateMachine extends TextualPointStateMachine<NoteDatum, NoteScene> {
    protected override createDatum() {
        return noteDatum.create();
    }
}
