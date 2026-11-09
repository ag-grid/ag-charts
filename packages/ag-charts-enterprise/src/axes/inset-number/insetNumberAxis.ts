import { _ModuleSupport } from 'ag-charts-community';
import type { AxisID, DomainWithMetadata, DynamicContext, NormalisedInsetNumberAxisOptions } from 'ag-charts-core';
import {
    LinearScale,
    normaliseNumberAxisDomain,
    numberAxisDatumFormatParams,
    numberAxisVisibleDomain,
} from 'ag-charts-core';
import type { AgNumericValue, FormatterParams } from 'ag-charts-types';

export class InsetNumberAxis extends _ModuleSupport.CartesianAxis<
    LinearScale,
    AgNumericValue,
    NormalisedInsetNumberAxisOptions
> {
    static readonly className = 'InsetNumberAxis';
    static readonly type = 'inset-number';

    protected override get tickLayoutIgnoresData() {
        return true;
    }

    constructor(
        moduleCtx: DynamicContext<_ModuleSupport.ChartRegistry>,
        id: AxisID,
        options: NormalisedInsetNumberAxisOptions
    ) {
        super(moduleCtx, id, new LinearScale(), options);
    }

    override get lengthRatio(): number {
        return this.options.lengthRatio;
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

    override tickFormatParams(
        domain: AgNumericValue[],
        _ticks: AgNumericValue[],
        fractionDigits?: number
    ): _ModuleSupport.AxisTickFormatParams {
        return { type: 'number', visibleDomain: numberAxisVisibleDomain(domain, this.visibleRange), fractionDigits };
    }

    override datumFormatParams(
        value: any,
        params: _ModuleSupport.FormatDatumParams,
        fractionDigits?: number
    ): FormatterParams<any> {
        const visibleDomain = numberAxisVisibleDomain(params.domain, this.visibleRange);
        return numberAxisDatumFormatParams(value, params, visibleDomain, fractionDigits);
    }
}
