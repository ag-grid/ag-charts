import { type DomainWithMetadata, type NormalizedDomain } from 'ag-charts-core';

import { BandScale } from './bandScale';

export class IrregularBandScale<D = string, I = number> extends BandScale<D, I> {
    readonly type = 'category' as const; // TODO: 'irregular-band'?
    readonly defaultTickCount = 0;

    private _hasFixedWidth = false;
    private _paddingInnerWidth = 0;

    protected _domain: D[] = [];
    set domain(values: D[]) {
        if (this._domain === values) return;

        if (values.length === 0) {
            this._bandRanges.clear();
            this._hasFixedWidth = false;
        }

        this.invalid = true;
        this._domain = values;
    }

    get domain() {
        return this._domain;
    }

    get bands() {
        return this.domain;
    }

    protected _bandRanges = new Map<number, Map<number, I | undefined>>();
    addBand(groupIndex: number, stackIndex: number, value: I | undefined) {
        this._domain.push(this.getDomainValue(groupIndex, stackIndex));

        if (!this._bandRanges.has(groupIndex)) {
            this._bandRanges.set(groupIndex, new Map());
        }
        this._bandRanges.get(groupIndex)!.set(stackIndex, value);

        this._hasFixedWidth ||= value != null;
        this.invalid = true;
    }

    getDomainValue(groupIndex: number, stackIndex: number): D {
        return `${groupIndex}-${stackIndex}` as D;
    }

    override findIndex(value: D): number | undefined {
        // Find the index of the domain value in the band range keys. This is only used when has no fixed widths and is
        // called from `BandScale`.
        let index = 0;
        for (const key of this._bandRanges.keys()) {
            if (key === (value as number)) return index;
            index++;
        }
    }

    override convert(domainValue: D): number {
        const { _bandwidth, _bandRanges, _inset, _paddingInnerWidth } = this;

        let value = _inset;

        const valueDs = (domainValue as string).split('-');
        const valueGroupIndex = Number(valueDs[0]);

        if (!this._hasFixedWidth) {
            return super.convert(valueGroupIndex as D);
        }

        for (let i = 0; i < valueGroupIndex; i++) {
            const stacks = _bandRanges.get(i);
            if (!stacks) {
                value += _paddingInnerWidth;
                continue;
            }
            let maxStackWidth = 0;
            for (const width of stacks.values()) {
                maxStackWidth = Math.max(maxStackWidth, width == null ? _bandwidth : (width as number));
            }
            value += maxStackWidth + _paddingInnerWidth;
        }

        // Do not clamp the value, to allow it to overflow and expand the range.
        return value;
    }

    override invert(_value: number, _nearest?: boolean): D | undefined {
        // Not used.
        return;
    }

    protected override getBandCountForUpdate(): number {
        // The number of groups (i.e. ignoring stacks)
        return this._bandRanges.size;
    }

    override update(): void {
        if (!this._hasFixedWidth) {
            return super.update();
        }

        const [r0, r1] = this.range;
        let { paddingInner } = this;
        const bandCount = this.getBandCountForUpdate();
        if (bandCount === 0) return;

        let totalBandRange = 0;
        let bandCountWithUnfixedWidths = bandCount;
        let bandCountWithOnlyFixedWidths = bandCount;
        for (const stacks of this._bandRanges.values()) {
            let maxStackWidth = 0;
            let hasUnfixed = false;
            for (const width of stacks.values()) {
                if (width == null) {
                    hasUnfixed = true;
                    continue;
                }
                maxStackWidth = Math.max(maxStackWidth, width as number);
            }
            if (hasUnfixed) {
                bandCountWithOnlyFixedWidths -= 1;
            } else {
                bandCountWithUnfixedWidths -= 1;
                totalBandRange += maxStackWidth;
            }
        }

        if (bandCount === 1) {
            paddingInner = 0;
        }

        const targetRangeDistance = r1 - r0;
        const paddingInnerWidth = (targetRangeDistance / bandCount) * paddingInner;

        const actualRangeDistance = totalBandRange + paddingInnerWidth * (bandCount - 1);
        const rangeDiff = targetRangeDistance - actualRangeDistance;

        let inset = r0;
        let rawBandwidth =
            bandCountWithUnfixedWidths > 0 && rangeDiff >= 0
                ? rangeDiff / bandCountWithUnfixedWidths
                : targetRangeDistance / bandCount;
        let bandwidth = rawBandwidth;

        if (bandCountWithOnlyFixedWidths === bandCount && rangeDiff > 0) {
            inset += rangeDiff / 2;
        }

        const round = this.round && Math.floor(bandwidth) > 0;
        if (round) {
            inset = Math.round(inset);
            bandwidth = Math.round(bandwidth);
        }

        if (rangeDiff < 0) {
            rawBandwidth = 0;
            bandwidth = 0;
        }

        this._inset = inset;
        this._bandwidth = bandwidth;
        this._rawBandwidth = rawBandwidth;
        this._paddingInnerWidth = paddingInnerWidth;
    }

    override normalizeDomains(..._domains: DomainWithMetadata<D>[]): NormalizedDomain<D> {
        return { domain: [], animatable: false };
    }

    override toDomain(_value: number): D | undefined {
        return undefined;
    }
}
