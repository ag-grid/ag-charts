import type { IAxis } from './axesTypes';

export abstract class AxesCoordinator<TAxis extends IAxis, TCoordinate> {
    abstract getAxisCoordinate(axis: TAxis): TCoordinate;
}
