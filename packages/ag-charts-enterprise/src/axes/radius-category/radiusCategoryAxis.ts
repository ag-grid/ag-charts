import { type FormatterParams, _ModuleSupport } from 'ag-charts-community';
import type { AxisID, DomainWithMetadata, DynamicContext, NormalisedRadiusCategoryAxisOptions } from 'ag-charts-core';

import { RadiusAxis } from '../radius/radiusAxis';

const { CategoryScale } = _ModuleSupport;
export class RadiusCategoryAxis extends RadiusAxis {
    static readonly className = 'RadiusCategoryAxis';
    static readonly type = 'radius-category' as const;

    override get shape(): 'circle' {
        return 'circle';
    }

    get groupPaddingInner(): number {
        return (this.options as { groupPaddingInner?: number }).groupPaddingInner ?? 0;
    }

    get paddingInner(): number {
        return (this.options as { paddingInner?: number }).paddingInner ?? 0;
    }

    get paddingOuter(): number {
        return (this.options as { paddingOuter?: number }).paddingOuter ?? 0;
    }

    constructor(
        moduleCtx: DynamicContext<_ModuleSupport.ChartRegistry>,
        id: AxisID,
        options: NormalisedRadiusCategoryAxisOptions
    ) {
        super(moduleCtx, id, new CategoryScale(), options as any);
    }

    protected override updateScale(): void {
        super.updateScale();
        // Propagate padding options to the underlying band scale.
        if (CategoryScale.is(this.scale)) {
            this.scale.paddingInner = this.paddingInner;
            this.scale.paddingOuter = this.paddingOuter;
        }
    }

    override hasDefinedDomain(): boolean {
        return false;
    }

    override normaliseDataDomain(d: DomainWithMetadata<string | object>) {
        return { domain: d.domain, clipped: false };
    }

    protected prepareGridPathTickData(data: _ModuleSupport.TickDatum[]): _ModuleSupport.TickDatum[] {
        return data.slice().reverse();
    }

    protected getTickRadius(tickDatum: _ModuleSupport.TickDatum): number {
        const { scale, innerRadiusRatio } = this;

        const maxRadius = scale.range[0];
        const minRadius = maxRadius * innerRadiusRatio;

        if (CategoryScale.is(scale)) {
            const ticks = scale.domain;
            const index = ticks.length - 1 - ticks.indexOf(tickDatum.tick);
            return index === 0 ? minRadius : scale.inset + scale.step * (index - 0.5) + scale.bandwidth / 2;
        } else {
            const tickRange = (maxRadius - minRadius) / scale.domain.length;
            return maxRadius - tickDatum.translation + minRadius - tickRange / 2;
        }
    }

    override tickFormatParams(): _ModuleSupport.AxisTickFormatParams {
        return { type: 'category' };
    }

    override datumFormatParams(value: any, params: _ModuleSupport.FormatDatumParams): FormatterParams<any> {
        const { datum, seriesId, legendItemName, key, source, property, domain, boundSeries } = params;
        return { type: 'category', value, datum, seriesId, legendItemName, key, source, property, domain, boundSeries };
    }
}
