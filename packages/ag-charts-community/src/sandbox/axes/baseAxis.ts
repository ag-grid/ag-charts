import type { IAxis } from '../types';

export abstract class BaseAxis implements IAxis {}

export class CartesianAxis extends BaseAxis {}
