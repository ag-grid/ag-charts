import { createUnionNestedObjectPathItemRegex, getLastTopLevelPath } from './modelPath';

describe('createUnionNestedObjectPathItemRegex', () => {
    it('returns null for simple path items', () => {
        const regex = createUnionNestedObjectPathItemRegex();

        expect(regex.exec('something')).toBeNull();
    });

    it('returns value breakdown for discriminator paths', () => {
        const regex = createUnionNestedObjectPathItemRegex();

        expect(regex.exec("[type = 'number']")).toMatchInlineSnapshot(`
          [
            "[type = 'number']",
            "[type = '",
            "number",
            "']",
          ]
        `);
    });
});

describe('getLastTopLevelPath', () => {
    it('empty config returns []', () => {
        const path = [] as string[];
        const pathItem = 'something';

        expect(
            getLastTopLevelPath({
                path,
                pathItem,
            })
        ).toEqual([]);
    });

    test.each`
        topLevelParentProperties             | path                         | pathItem       | expected
        ${undefined}                         | ${[]}                        | ${'something'} | ${[]}
        ${[]}                                | ${[]}                        | ${'something'} | ${[]}
        ${['overrides']}                     | ${['overrides']}             | ${'axes'}      | ${['overrides']}
        ${['overrides']}                     | ${['overrides', 'axes']}     | ${'something'} | ${['overrides']}
        ${['overrides.common']}              | ${['overrides', 'axes']}     | ${'something'} | ${[]}
        ${['overrides.common']}              | ${['overrides', 'common']}   | ${'something'} | ${['overrides', 'common']}
        ${['overrides.common', 'overrides']} | ${['overrides', 'common']}   | ${'something'} | ${['overrides', 'common']}
        ${['overrides', 'overrides.common']} | ${['overrides', 'common']}   | ${'something'} | ${['overrides', 'common']}
        ${['something', 'overrides.common']} | ${['overrides', 'common']}   | ${'something'} | ${['overrides', 'common']}
        ${['something', 'somethingElse']}    | ${['overrides', 'common']}   | ${'something'} | ${[]}
        ${['overrides', 'overrides.*']}      | ${['overrides']}             | ${'anything'}  | ${['overrides', 'anything']}
        ${['overrides', 'overrides.*']}      | ${['overrides', 'anything']} | ${'something'} | ${['overrides', 'anything']}
    `(
        'returns $expected for $path > $pathItem with topLevelParentProperties: $topLevelParentProperties',
        ({ topLevelParentProperties, path, pathItem, expected }) => {
            expect(
                getLastTopLevelPath({
                    config: {
                        topLevelParentProperties,
                    },
                    path,
                    pathItem,
                })
            ).toEqual(expected);
        }
    );
});
