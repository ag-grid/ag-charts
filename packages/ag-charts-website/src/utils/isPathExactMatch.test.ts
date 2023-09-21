import { isPathExactMatch } from './isPathExactMatch';

describe('isPathExactMatch', () => {
    test.each`
        path                                        | pathItem       | pathMatcher               | expected
        ${[]}                                       | ${undefined}   | ${''}                     | ${false}
        ${[]}                                       | ${'axes'}      | ${'axes'}                 | ${true}
        ${[]}                                       | ${'notAxes'}   | ${'axes'}                 | ${false}
        ${['axes']}                                 | ${'something'} | ${'axes'}                 | ${false}
        ${['axes']}                                 | ${'something'} | ${'axes.*'}               | ${true}
        ${['axes', 'axesChild']}                    | ${'something'} | ${'axes.*'}               | ${false}
        ${['preAxes', 'axes']}                      | ${'something'} | ${'preAxes.axes.*'}       | ${true}
        ${['preAxes', 'axes', 'something']}         | ${'something'} | ${'axes.*'}               | ${false}
        ${['overrides', 'common']}                  | ${'axes'}      | ${'overrides.*.*'}        | ${true}
        ${['overrides', 'common', 'axes']}          | ${'something'} | ${'overrides.*.*'}        | ${false}
        ${['overrides', 'common', 'somethingElse']} | ${'anything'}  | ${'overrides.*.common.*'} | ${false}
        ${['overrides', 'anything']}                | ${'wrong'}     | ${'overrides.*.axes'}     | ${false}
    `('returns $expected for $path > $pathItem using $pathMatcher', ({ path, pathItem, pathMatcher, expected }) => {
        expect(isPathExactMatch({ path, pathMatcher, pathItem })).toBe(expected);
    });
});
