import type { DeepRequired } from 'ag-charts-core';
import type { AgTouchOptions } from 'ag-charts-types';

import { BaseProperties } from '../util/properties';
import { UNION, Validate } from '../util/validation';

type OptionsImp = DeepRequired<AgTouchOptions>;

export class Touch extends BaseProperties implements OptionsImp {
    @Validate(UNION(['pan', 'hover']))
    dragAction: OptionsImp['dragAction'] = 'hover';
}
