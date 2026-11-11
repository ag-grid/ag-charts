import { describe, expect, it } from 'vitest';

import { setupEnterpriseModules } from '../setup';
import { resolveSeries } from '../test/seriesHelpers';

setupEnterpriseModules();

describe('label overflow defaults (enterprise)', () => {
    it.each([
        ['range-bar', { type: 'range-bar', xKey: 'x', yLowKey: 'lo', yHighKey: 'hi' }, false],
        ['range-area', { type: 'range-area', xKey: 'x', yLowKey: 'lo', yHighKey: 'hi' }, false],
        ['map-marker', { type: 'map-marker', latitudeKey: 'lat', longitudeKey: 'lon' }, true],
        ['map-line', { type: 'map-line', idKey: 'id' }, true],
        ['map-shape', { type: 'map-shape', idKey: 'id', labelKey: 'label' }, true],
        ['sankey', { type: 'sankey', fromKey: 'from', toKey: 'to', sizeKey: 'size' }, true],
    ])('%s wraps on space and resolves truncate to %s', (_name, series, truncate) => {
        expect(resolveSeries({ ...series, label: { maxWidth: 80 } }).label).toMatchObject({
            wrapping: 'on-space',
            truncate,
        });
    });
});
