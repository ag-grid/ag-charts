import { describe, expect, it } from 'vitest';

import { splitSelectionAxisStyles } from './selectionAxes';

describe('splitSelectionAxisStyles', () => {
    const axisLabel = { visible: 'always', fill: 'red' };

    it('separates the axis styles of an annotation type, except the datum styles of a cross-line label', () => {
        expect(splitSelectionAxisStyles('line', { stroke: 'blue', axisLabel })).toEqual({
            styles: { stroke: 'blue' },
            stateless: { axisLabel, axisShading: undefined },
        });
        expect(splitSelectionAxisStyles('horizontal-line', { stroke: 'blue', axisLabel })).toEqual({
            styles: { stroke: 'blue', axisLabel: { fill: 'red' } },
            stateless: { axisLabel: { visible: 'always' } },
        });
    });

    it('leaves the `axisLabel` of options that are not annotation types, such as `lastPriceLine`', () => {
        const styles = { stroke: 'blue', axisLabel };
        expect(splitSelectionAxisStyles('lastPriceLine', styles)).toEqual({ styles });
    });
});
