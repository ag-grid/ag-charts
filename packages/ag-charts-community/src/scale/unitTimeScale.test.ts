import { UnitTimeScale } from './unitTimeScale';

describe('UnitTimeScale', () => {
    it('converts a monthly value in the final band', () => {
        const scale = new UnitTimeScale();
        scale.range = [0, 100];
        scale.domain = [new Date(2022, 0, 1), new Date(2022, 11, 1)];
        scale.interval = 'month';

        const lastBandValue = new Date(2022, 11, 31);
        const convertedValue = scale.convert(lastBandValue);

        expect(convertedValue).toBeCloseTo(92, 0);
    });
});
