import { getShouldLimitChildren } from './getShouldLimitChildren';

describe('getShouldLimitChildren', () => {
    it('is false for no config', () => {
        const options = {
            path: [],
            pathItem: 'axes',
        };

        expect(getShouldLimitChildren(options)).toEqual(false);
    });

    it('is false if path item does not match', () => {
        const options = {
            config: {
                limitChildrenProperties: ['not-axes'],
            },
            path: [],
            pathItem: 'axes',
        };

        expect(getShouldLimitChildren(options)).toEqual(false);
    });

    it('is true for path item in config', () => {
        const options = {
            config: {
                limitChildrenProperties: ['axes'],
            },
            path: [],
            pathItem: 'axes',
        };

        expect(getShouldLimitChildren(options)).toEqual(true);
    });

    it('is false for different path to property', () => {
        const options = {
            config: {
                limitChildrenProperties: ['axes'],
            },
            path: ['something'],
            pathItem: 'axes',
        };

        expect(getShouldLimitChildren(options)).toEqual(false);
    });

    it('is false for path item without path match in config with wildcard', () => {
        const options = {
            config: {
                limitChildrenProperties: ['overrides/*'],
            },
            path: [],
            pathItem: 'overrides',
        };

        expect(getShouldLimitChildren(options)).toEqual(false);
    });

    it('is true for path in config with wildcard', () => {
        const options = {
            config: {
                limitChildrenProperties: ['overrides.*'],
            },
            path: ['overrides'],
            pathItem: 'anything',
        };

        expect(getShouldLimitChildren(options)).toEqual(true);
    });

    it('is true for long path in config with wildcard', () => {
        const options = {
            config: {
                limitChildrenProperties: ['root.options.overrides.*'],
            },
            path: ['root', 'options', 'overrides'],
            pathItem: 'anything',
        };

        expect(getShouldLimitChildren(options)).toEqual(true);
    });
});
