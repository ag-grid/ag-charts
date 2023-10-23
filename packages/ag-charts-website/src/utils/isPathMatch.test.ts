import { isPathMatch } from './isPathMatch';

describe('isPathMatch', () => {
    test.each`
        path                                               | pathItem       | pathMatcher               | expected
        ${[]}                                              | ${undefined}   | ${''}                     | ${false}
        ${[]}                                              | ${'axes'}      | ${'axes'}                 | ${true}
        ${[]}                                              | ${'notAxes'}   | ${'axes'}                 | ${false}
        ${['axes']}                                        | ${'something'} | ${'axes'}                 | ${false}
        ${['axes']}                                        | ${'something'} | ${'axes.*'}               | ${true}
        ${['axes', 'axesChild']}                           | ${'something'} | ${'axes.*'}               | ${true}
        ${['axes', 'axesChild', 'anotherAxesChild']}       | ${'something'} | ${'axes.*'}               | ${true}
        ${['preAxes', 'axes']}                             | ${'something'} | ${'preAxes.axes.*'}       | ${true}
        ${['preAxes', 'axes', 'something']}                | ${'something'} | ${'axes.*'}               | ${false}
        ${['overrides', 'anything', 'common']}             | ${'more'}      | ${'overrides.*.common.*'} | ${true}
        ${['overrides', 'anything', 'common', 'anything']} | ${'more'}      | ${'overrides.*.common.*'} | ${true}
        ${['overrides', 'anything', 'somethingElse']}      | ${'anything'}  | ${'overrides.*.common.*'} | ${false}
        ${['overrides', 'anything']}                       | ${'wrong'}     | ${'overrides.*.axes'}     | ${false}
    `('returns $expected for $path > $pathItem using $pathMatcher', ({ path, pathItem, pathMatcher, expected }) => {
        expect(isPathMatch({ path, pathMatcher, pathItem })).toBe(expected);
    });
});
