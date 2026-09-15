import { describe, expect, it } from 'vitest';

import { enterpriseRegistry } from 'ag-charts-core';

import './main';

describe('enterprise setup', () => {
    it('installs only the non-module hooks; features reach the chart as modules with option contributions', () => {
        expect(new Set(Object.keys(enterpriseRegistry))).toEqual(
            new Set(['styles', 'licenseManager', 'injectWatermark', 'createBackground', 'createForeground'])
        );
    });
});
