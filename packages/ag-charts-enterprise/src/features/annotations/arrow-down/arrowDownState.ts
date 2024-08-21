import { _ModuleSupport, _Util } from 'ag-charts-community';

import { PointStateMachine } from '../states/pointState';
import { ArrowDownProperties } from './arrowDownProperties';
import type { ArrowDownScene } from './arrowDownScene';

export class ArrowDownStateMachine extends PointStateMachine<ArrowDownProperties, ArrowDownScene> {
    protected override createDatum() {
        return new ArrowDownProperties();
    }
}
