import { _ModuleSupport } from 'ag-charts-community';

const { OrdinalTimeScale, sortAndUniqueDates } = _ModuleSupport;

export class OrdinalTimeAxis extends _ModuleSupport.CategoryAxis<_ModuleSupport.OrdinalTimeScale> {
    static override readonly className = 'OrdinalTimeAxis' as const;
    static override readonly type = 'ordinal-time' as const;

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super(moduleCtx, new OrdinalTimeScale());
    }

    // @todo(AG-13422) Axis assumes setting the scale domain is free - but for OrdinalTimeScale, it's very expensive
    override normaliseDataDomain(domain: Date[]) {
        return { domain, clipped: false };
    }

    private _lastSetDomain: Date[] | undefined = undefined;
    override setDomain(d: Date[]): void {
        if (this._lastSetDomain === d) return;

        this._lastSetDomain = d;

        const domain = sortAndUniqueDates(d);
        super.setDomain(domain);
    }
}
