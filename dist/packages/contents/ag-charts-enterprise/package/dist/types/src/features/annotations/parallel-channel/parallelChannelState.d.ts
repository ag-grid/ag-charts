import { _ModuleSupport, _Util } from 'ag-charts-community';
import type { Point } from '../annotationTypes';
import { ParallelChannelAnnotation } from './parallelChannelProperties';
export declare class ParallelChannelStateMachine extends _ModuleSupport.StateMachine<'start' | 'end' | 'height', 'click' | 'hover' | 'drag' | 'cancel'> {
    debug: _Util.DebugLogger;
    constructor(appendDatum: (datum: ParallelChannelAnnotation) => void, validateDatumPoint: (point: Point) => boolean);
}
