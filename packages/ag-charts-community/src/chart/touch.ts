import type { DeepRequired } from 'ag-charts-core';
import type { AgTouchOptions } from 'ag-charts-types';

import { BaseProperties } from '../util/properties';
import { TempValidate, UNION } from '../util/validation';

type OptionsImp = DeepRequired<AgTouchOptions>;

export class Touch extends BaseProperties implements OptionsImp {
    @TempValidate(UNION(['none', 'drag', 'hover']))
    dragAction: OptionsImp['dragAction'] = 'drag';
}
