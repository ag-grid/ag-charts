import { TextualStartEndStateMachine } from '../states/textualStartEndState';
import { type CalloutDatum, calloutDatum } from './calloutDatum';
import type { CalloutScene } from './calloutScene';

export class CalloutStateMachine extends TextualStartEndStateMachine<CalloutDatum, CalloutScene> {
    protected override createDatum() {
        return calloutDatum.create();
    }
}
