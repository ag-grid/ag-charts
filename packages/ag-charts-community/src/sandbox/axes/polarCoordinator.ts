import { AxesCoordinator } from './axesCoordinator';
import { PolarCoordinate } from './axesEnums';
import type { IPolarAxis } from './axesTypes';

export class PolarCoordinator extends AxesCoordinator<IPolarAxis, PolarCoordinate> {
    override getAxisCoordinate(axis: IPolarAxis) {
        return axis.position as PolarCoordinate;
    }
}
