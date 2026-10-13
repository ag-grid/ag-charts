import { bezier2DDistance } from './bezier';

test('bezier2DDistance', () => {
    expect(bezier2DDistance(0, 0, 100, 0, 300, 200, 300, 300, 300, 0)).toBeCloseTo(159, 0);
    expect(bezier2DDistance(0, 0, 100, 0, 300, 200, 300, 300, 150, 0)).toBeCloseTo(61, 0);
    expect(bezier2DDistance(0, 0, 100, 0, 300, 200, 300, 300, 300, 150)).toBeCloseTo(61, 0);
});
