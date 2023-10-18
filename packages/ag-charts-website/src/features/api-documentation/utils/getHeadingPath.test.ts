import { removeTopLevelPath } from './removeTopLevelPath';

describe('removeTopLevelPath', () => {
    test.each`
        path                                     | expected
        ${undefined}                             | ${[]}
        ${[]}                                    | ${[]}
        ${['series']}                            | ${[]}
        ${['series', 'item']}                    | ${['item']}
        ${['series', "[type = 'line']"]}         | ${[]}
        ${['series', "[type = 'line']", 'item']} | ${['item']}
        ${['series', 'somethingElse', 'item']}   | ${['somethingElse', 'item']}
    `('returns $expected for $path', ({ path, expected }) => {
        expect(removeTopLevelPath(path)).toEqual(expected);
    });
});
