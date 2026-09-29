import { PointStateMachine } from '../states/pointState';
import { type ArrowDownDatum, arrowDownDatum } from './arrowDownDatum';
import type { ArrowDownScene } from './arrowDownScene';

export class ArrowDownStateMachine extends PointStateMachine<ArrowDownDatum, ArrowDownScene> {
    protected override createDatum() {
        return arrowDownDatum.create();
    }
}
