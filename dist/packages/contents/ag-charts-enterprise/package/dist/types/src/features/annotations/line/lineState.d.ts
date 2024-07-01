import { _ModuleSupport, _Util } from 'ag-charts-community';
import { LineAnnotation } from './lineProperties';
export declare class LineStateMachine extends _ModuleSupport.StateMachine<'start' | 'end', 'click' | 'hover' | 'drag' | 'cancel'> {
    debug: _Util.DebugLogger;
    constructor(appendDatum: (datum: LineAnnotation) => void);
}
