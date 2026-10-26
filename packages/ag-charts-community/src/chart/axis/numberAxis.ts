import type { AxisID, DomainWithMetadata, DynamicContext, LogScale, NormalisedNumberAxisOptions } from 'ag-charts-core';
import {
    LinearScale,
    normaliseNumberAxisDomain,
    numberAxisDatumFormatParams,
    numberAxisVisibleDomain,
} from 'ag-charts-core';
import type { AgNumericValue, FormatterParams } from 'ag-charts-types';

import type { ChartRegistry } from '../../module/moduleContext';
import type { FormatDatumParams } from '../chartAxis';
import type { AxisTickFormatParams } from './axis';
import { CartesianAxis } from './cartesianAxis';

export class NumberAxis<
    TOptions extends NormalisedNumberAxisOptions = NormalisedNumberAxisOptions,
> extends CartesianAxis<LinearScale | LogScale, AgNumericValue, TOptions> {
    static readonly className: string = 'NumberAxis';
    static readonly type: string = 'number';

    protected override get tickLayoutIgnoresData() {
        return true;
    }

    constructor(
        moduleCtx: DynamicContext<ChartRegistry>,
        id: AxisID,
        scale: LinearScale | LogScale,
        options: TOptions
    ) {
        super(moduleCtx, id, scale, options);
    }

    override hasDefinedDomain(): boolean {
        const { min, max } = this.options;
        return min != null && max != null && min < max;
    }

    protected override getLabelFormat() {
        return this.options.label.format;
    }

    override normaliseDataDomain(d: DomainWithMetadata<AgNumericValue>) {
        return normaliseNumberAxisDomain(d, this.options);
    }

    override getDomainExtentsNice(): [boolean, boolean] {
        return [this.options.min == null && this.nice, this.options.max == null && this.nice];
    }

    protected getVisibleDomain(domain: AgNumericValue[]): [number, number] {
        return numberAxisVisibleDomain(domain, this.visibleRange);
    }

    override tickFormatParams(
        domain: AgNumericValue[],
        _ticks: AgNumericValue[],
        fractionDigits?: number
    ): AxisTickFormatParams {
        return { type: 'number', visibleDomain: this.getVisibleDomain(domain), fractionDigits };
    }

    override datumFormatParams(value: any, params: FormatDatumParams, fractionDigits?: number): FormatterParams<any> {
        return numberAxisDatumFormatParams(value, params, this.getVisibleDomain(params.domain), fractionDigits);
    }
}
