import { _ModuleSupport, _Util } from 'ag-charts-community';

import { PointStateMachine } from '../states/pointState';
import { ArrowUpProperties } from './arrowUpProperties';
import type { ArrowUpScene } from './arrowUpScene';

export class ArrowUpStateMachine extends PointStateMachine<ArrowUpProperties, ArrowUpScene> {
    protected override createDatum() {
        return new ArrowUpProperties();
    }
}
