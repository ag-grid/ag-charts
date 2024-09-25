import { AxesCoordinator } from './axesCoordinator';
import { CartesianCoordinate } from './axesEnums';
import type { ICartesianAxis } from './axesTypes';

export class CartesianCoordinator extends AxesCoordinator<ICartesianAxis, CartesianCoordinate> {
    override getAxisCoordinate(axis: ICartesianAxis) {
        return axis.position === 'bottom' || axis.position === 'top'
            ? CartesianCoordinate.Horizontal
            : CartesianCoordinate.Vertical;
    }
}
