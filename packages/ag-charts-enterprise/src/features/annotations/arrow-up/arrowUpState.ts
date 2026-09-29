import { PointStateMachine } from '../states/pointState';
import { type ArrowUpDatum, arrowUpDatum } from './arrowUpDatum';
import type { ArrowUpScene } from './arrowUpScene';

export class ArrowUpStateMachine extends PointStateMachine<ArrowUpDatum, ArrowUpScene> {
    protected override createDatum() {
        return arrowUpDatum.create();
    }
}
