import { getShouldLimitParent } from './getShouldLimitParent';

describe('getShouldLimitParent', () => {
    it('is false for no config', () => {
        const options = {
            path: [],
            pathItem: 'axes',
        };

        expect(getShouldLimitParent(options)).toEqual(false);
    });

    it('is false if path item does not match', () => {
        const options = {
            config: {
                limitChildrenProperties: ['not-axes'],
            },
            path: [],
            pathItem: 'axes',
        };

        expect(getShouldLimitParent(options)).toEqual(false);
    });

    it('is false if path has no wildcard', () => {
        const options = {
            config: {
                limitChildrenProperties: ['axes'],
            },
            path: ['axes'],
            pathItem: 'something',
        };

        expect(getShouldLimitParent(options)).toEqual(false);
    });

    it('is true if path matches with wildcard', () => {
        const options = {
            config: {
                limitChildrenProperties: ['axes.*'],
            },
            path: ['axes'],
            pathItem: 'something',
        };

        expect(getShouldLimitParent(options)).toEqual(true);
    });

    it('is false if start path does not match even with wildcard', () => {
        const options = {
            config: {
                limitChildrenProperties: ['axes.*'],
            },
            path: ['other'],
            pathItem: 'something',
        };

        expect(getShouldLimitParent(options)).toEqual(false);
    });

    it('is false if start of long path does not match even with wildcard', () => {
        const options = {
            config: {
                limitChildrenProperties: ['axes.*'],
            },
            path: ['other', 'something'],
            pathItem: 'else',
        };

        expect(getShouldLimitParent(options)).toEqual(false);
    });

    it('is true if long path matches with wildcard', () => {
        const options = {
            config: {
                limitChildrenProperties: ['axes.child.*'],
            },
            path: ['axes', 'child'],
            pathItem: 'something',
        };

        expect(getShouldLimitParent(options)).toEqual(true);
    });

    it('is true if multiple wildcards', () => {
        const options = {
            config: {
                limitChildrenProperties: ['overrides.*.*'],
            },
            path: ['overrides', 'common'],
            pathItem: 'axes',
        };

        expect(getShouldLimitParent(options)).toEqual(true);
    });

    it('is true if long path with wildcard at the end', () => {
        const options = {
            config: {
                limitChildrenProperties: ['axes.*'],
            },
            path: ['axes', 'more'],
            pathItem: 'something',
        };

        expect(getShouldLimitParent(options)).toEqual(true);
    });
});
