import { describe, expect, it } from 'vitest';

import type { AgGaugeOptions } from 'ag-charts-types';

import { createGauge } from './gaugePreset';

describe('createGauge', () => {
    it.each([
        ['radial', { type: 'radial-gauge', value: 50, scale: { min: 0, max: 100 } }],
        ['linear', { type: 'linear-gauge', value: 50, scale: { min: 0, max: 100 } }],
    ] as const)('forwards enableShadowDom to the %s gauge chart options', (_, options) => {
        const chartOptions = createGauge({ ...options, enableShadowDom: true } as AgGaugeOptions, undefined);

        expect(chartOptions).toMatchObject({ enableShadowDom: true });
    });
});
