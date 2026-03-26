import type { DeepRequired } from 'ag-charts-core';
import { BaseProperties, Property } from 'ag-charts-core';
import type { AgTouchOptions } from 'ag-charts-types';

type OptionsImp = DeepRequired<AgTouchOptions>;

export class Touch extends BaseProperties implements OptionsImp {
    @Property
    dragAction: OptionsImp['dragAction'] = 'drag';
}
