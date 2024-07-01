import { _ModuleSupport, _Util } from 'ag-charts-community';
import type { Point } from '../annotationTypes';
import { DisjointChannelAnnotation } from './disjointChannelProperties';
export declare class DisjointChannelStateMachine extends _ModuleSupport.StateMachine<'start' | 'end' | 'height', 'click' | 'hover' | 'drag' | 'cancel'> {
    debug: _Util.DebugLogger;
    constructor(appendDatum: (datum: DisjointChannelAnnotation) => void, validateDatumPoint: (point: Point) => boolean);
}
