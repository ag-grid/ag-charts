import { _ModuleSupport, _Util } from 'ag-charts-community';

import { TextualStateMachine } from '../states/textualState';
import { CommentProperties } from './commentProperties';
import type { CommentScene } from './commentScene';

export class CommentStateMachine extends TextualStateMachine<CommentProperties, CommentScene> {
    protected override createDatum() {
        return new CommentProperties();
    }
}
