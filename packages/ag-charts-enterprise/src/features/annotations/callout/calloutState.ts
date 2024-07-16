import { _ModuleSupport, _Util } from 'ag-charts-community';

import { TextualStateMachine } from '../states/textualState';
import { CalloutProperties } from './calloutProperties';
import type { CalloutScene } from './calloutScene';

export class CalloutStateMachine extends TextualStateMachine<CalloutProperties, CalloutScene> {
    protected override createDatum() {
        return new CalloutProperties();
    }
}
