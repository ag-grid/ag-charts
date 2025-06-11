import { describe, expect, it } from '@jest/globals';

import { resolveOperation } from './integrated-charts-theme';

describe('Integrated Charts resolveOperation', () => {
    it('should resolve operations', () => {
        expect(resolveOperation({ $ref: 'backgroundColor' })).toEqual('white');
        expect(resolveOperation({ $palette: 'altUp.fill' })).toEqual('#5090dc');
        expect(resolveOperation({ $palette: 'divergingColors' })).toEqual(['#ffa03a', '#e1cc00', '#459d55']);
        expect(resolveOperation({ $mix: ['red', { $ref: 'backgroundColor' }, 0.7] })).toEqual('#ffb3b3');
    });
});
