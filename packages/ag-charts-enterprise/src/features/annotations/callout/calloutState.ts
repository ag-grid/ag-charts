import { TextualStartEndStateMachine } from '../states/textualStartEndState';
import { CalloutProperties } from './calloutProperties';
import type { CalloutScene } from './calloutScene';

export class CalloutStateMachine extends TextualStartEndStateMachine<CalloutProperties, CalloutScene> {
    protected override createDatum() {
        return new CalloutProperties();
    }
}
