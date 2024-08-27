import { TextualPointStateMachine } from '../states/textualPointState';
import { CommentProperties } from './commentProperties';
import type { CommentScene } from './commentScene';

export class CommentStateMachine extends TextualPointStateMachine<CommentProperties, CommentScene> {
    protected override createDatum() {
        return new CommentProperties();
    }
}
