import { describe, expect, it } from 'vitest';

import { numericBandsOf } from 'ag-charts-community-test';
import { OrdinalTimeScale } from 'ag-charts-core';

import { ApproximateOrdinalTimeScale } from './approximateOrdinalTimeScale';

const minutes = (count: number, step = 1) => Array.from({ length: count }, (_, i) => new Date(2024, 0, 1, 0, i * step));

// With a source scale the domain lives on the source, so the temporary-domain round trip must reach it.
describe('ApproximateOrdinalTimeScale temporary domain round trip', () => {
    function create() {
        const source = new OrdinalTimeScale();
        const domain = minutes(3000);
        source.domain = domain;
        source.range = [0, 1000];

        const approximate = new ApproximateOrdinalTimeScale();
        approximate.setSourceScale(source);
        return { source, approximate, domain };
    }

    it('restores the source scale domain', () => {
        const { source, approximate, domain } = create();

        const snapshot = approximate.snapshotDomain();
        approximate.domain = minutes(40, 7);
        expect(source.domain).toHaveLength(40);
        approximate.restoreDomain(snapshot);

        expect(snapshot).toBe(domain);
        expect(source.domain).toBe(domain);
        expect(approximate.domain).toBe(domain);
        expect(approximate.bands).toBe(source.bands);
        expect(approximate.bands).toHaveLength(3000);
    });

    it('keeps the source scale band caches', () => {
        const { source, approximate } = create();
        const { bands } = source;
        const numericBands = numericBandsOf(source);

        const snapshot = approximate.snapshotDomain();
        approximate.domain = minutes(40, 7);
        expect(approximate.bands).toHaveLength(40);
        approximate.restoreDomain(snapshot);

        expect(source.bands).toBe(bands);
        expect(numericBandsOf(source)).toBe(numericBands);
    });

    it('answers as it did before the round trip', () => {
        const { approximate, domain } = create();
        const probe = [domain[0], domain[1500], domain[2999]];
        const before = probe.map((d) => ({ index: approximate.findIndex(d), px: approximate.convert(d) }));

        const snapshot = approximate.snapshotDomain();
        approximate.domain = minutes(40, 7);
        approximate.restoreDomain(snapshot);

        expect(approximate.bandCount()).toBe(3000);
        expect(probe.map((d) => ({ index: approximate.findIndex(d), px: approximate.convert(d) }))).toEqual(before);
    });

    it('round trips its own domain when no source scale is set', () => {
        const scale = new ApproximateOrdinalTimeScale();
        const domain = minutes(100);
        scale.domain = domain;
        const { bands } = scale;

        const snapshot = scale.snapshotDomain();
        scale.domain = minutes(10);
        scale.restoreDomain(snapshot);

        expect(scale.domain).toBe(domain);
        expect(scale.bands).toBe(bands);
    });
});
