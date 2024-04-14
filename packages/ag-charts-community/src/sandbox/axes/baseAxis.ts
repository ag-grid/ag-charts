import type { IAxis } from './axesTypes';

export abstract class BaseAxis implements IAxis {}

export class CartesianAxis extends BaseAxis {}

export class PolarAxis extends BaseAxis {}
