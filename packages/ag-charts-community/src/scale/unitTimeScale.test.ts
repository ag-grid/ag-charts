import { UnitTimeScale } from './unitTimeScale';

describe('UnitTimeScale', () => {
    it('converts a value in the final band', () => {
        const scale = new UnitTimeScale();
        scale.range = [0, 100];
        scale.domain = [new Date(2022, 0, 1), new Date(2022, 0, 7)];
        scale.interval = { unit: 'day', step: 1 };

        const lastBandValue = new Date(2022, 0, 7, 12);
        const convertedValue = scale.convert(lastBandValue);

        expect(convertedValue).toBeCloseTo(86, 0);
    });
});
