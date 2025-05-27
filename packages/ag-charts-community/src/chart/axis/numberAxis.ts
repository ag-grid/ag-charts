import type { FormatterParams } from 'ag-charts-types';

import type { ModuleContext } from '../../module/moduleContext';
import { LinearScale } from '../../scale/linearScale';
import type { LogScale } from '../../scale/logScale';
import { normalisedExtentWithMetadata } from '../../util/extent';
import { Property } from '../../util/properties';
import { tickFormat } from '../../util/ticks';
import type { FormatDatumParams } from '../chartAxis';
import type { AxisTickFormatParams } from './axis';
import { CartesianAxis } from './cartesianAxis';

export class NumberAxis extends CartesianAxis<LinearScale | LogScale, number> {
    static readonly className: string = 'NumberAxis';
    static readonly type: string = 'number';

    @Property
    min?: number;

    @Property
    max?: number;

    constructor(moduleCtx: ModuleContext, scale = new LinearScale() as LinearScale | LogScale) {
        super(moduleCtx, scale);
    }

    override normaliseDataDomain(d: number[]) {
        const { min, max } = this;
        const { extent, clipped } = normalisedExtentWithMetadata(d, min, max);

        return { domain: extent, clipped };
    }

    protected override createDatumFormatter(
        _domain: number[],
        ticks: number[]
    ): ((value: any) => string | undefined) | undefined {
        const { format } = this.label;
        return typeof format === 'number' ? tickFormat(ticks, format) : undefined;
    }

    override tickFormatParams(_domain: number[], _ticks: number[], fractionDigits?: number): AxisTickFormatParams {
        return { type: 'number', fractionDigits };
    }

    override datumFormatParams(value: any, params: FormatDatumParams, fractionDigits?: number): FormatterParams<any> {
        const { datum, key, source, property } = params;
        return {
            type: 'number',
            value,
            datum,
            key,
            source,
            property,
            fractionDigits,
        };
    }
}
