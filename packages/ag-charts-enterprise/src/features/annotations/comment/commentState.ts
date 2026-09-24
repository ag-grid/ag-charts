import { TextualPointStateMachine } from '../states/textualPointState';
import { type CommentDatum, commentDatum } from './commentDatum';
import type { CommentScene } from './commentScene';

export class CommentStateMachine extends TextualPointStateMachine<CommentDatum, CommentScene> {
    protected override createDatum() {
        return commentDatum.create();
    }
}
