import { type Direction, _ModuleSupport, _Util } from 'ag-charts-community';
import { type CrossLineAnnotation } from './crossLineProperties';
export declare function isHorizontalAxis(region: any): boolean;
export declare class CrossLineStateMachine extends _ModuleSupport.StateMachine<'start', 'click' | 'cancel'> {
    debug: _Util.DebugLogger;
    constructor(direction: Direction, appendDatum: (datum: CrossLineAnnotation, direction?: any) => void, onExit: () => void);
}
