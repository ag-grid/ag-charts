import { removeTopLevelPath } from './removeTopLevelPath';

describe('removeTopLevelPath', () => {
    test.each`
        path                                     | keepTopLevelIfOnlyItem | expected
        ${undefined}                             | ${false}               | ${[]}
        ${undefined}                             | ${true}                | ${[]}
        ${[]}                                    | ${false}               | ${[]}
        ${[]}                                    | ${true}                | ${[]}
        ${['series']}                            | ${true}                | ${['series']}
        ${['series']}                            | ${false}               | ${[]}
        ${['series', 'item']}                    | ${false}               | ${['item']}
        ${['series', 'item']}                    | ${true}                | ${['item']}
        ${['series', "[type = 'line']"]}         | ${false}               | ${[]}
        ${['series', "[type = 'line']"]}         | ${true}                | ${['series', "[type = 'line']"]}
        ${['series', "[type = 'line']", 'item']} | ${false}               | ${['item']}
        ${['series', "[type = 'line']", 'item']} | ${true}                | ${['item']}
        ${['series', 'somethingElse', 'item']}   | ${false}               | ${['somethingElse', 'item']}
        ${['series', 'somethingElse', 'item']}   | ${true}                | ${['somethingElse', 'item']}
    `(
        'returns $expected for $path and keepTopLevelIfOnlyItem: $keepTopLevelIfOnlyItem',
        ({ path, keepTopLevelIfOnlyItem, expected }) => {
            expect(removeTopLevelPath({ path, keepTopLevelIfOnlyItem })).toEqual(expected);
        }
    );
});
