import type { IScale } from '../scales/scaleTypes';
import type { CssColor } from '../types/commonTypes';
import type { IAxis } from './axesTypes';

export abstract class BaseAxis<S extends IScale<any, any>> implements IAxis {
    lineColor?: CssColor;
    lineSize?: number;

    constructor(public readonly scale: S) {}
}
