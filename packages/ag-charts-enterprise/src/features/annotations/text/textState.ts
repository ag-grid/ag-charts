import { TextualPointStateMachine } from '../states/textualPointState';
import { type TextDatum, textDatum } from './textDatum';
import type { TextScene } from './textScene';

export class TextStateMachine extends TextualPointStateMachine<TextDatum, TextScene> {
    protected override createDatum() {
        return textDatum.create();
    }
}
