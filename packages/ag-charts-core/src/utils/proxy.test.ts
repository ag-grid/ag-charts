import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { ProxyOnWrite, ProxyProperty, ProxyPropertyOnWrite } from './proxy';

interface TestProxyObject {
    normalProp?: string;

    singleProperty?: number;
    multipleProperties?: number;

    proxied?: string;
    target?: string;

    proxiedProp?: string;
    proxiedProp2?: string;
    child: {
        proxiedProp?: string;
        otherProp?: string;
    };
}

describe('proxy module', () => {
    let test: TestProxyObject;
    const originalConsoleWarn = console.warn;

    beforeEach(() => {
        class TestProxy implements TestProxyObject {
            normalProp?: string;

            topLevelProperty = 1;

            @ProxyProperty('topLevelProperty')
            singleProperty?: number;

            nestedProperty = { inner: 1 };

            @ProxyProperty('nestedProperty.inner')
            multipleProperties?: number;

            @ProxyOnWrite('target')
            proxied?: string;
            target?: string;

            @ProxyPropertyOnWrite('child')
            proxiedProp?: string;
            @ProxyPropertyOnWrite('child', 'otherProp')
            proxiedProp2?: string;
            child: { proxiedProp?: string; otherProp?: string } = {};
        }
        console.warn = jest.fn();
        test = new TestProxy();
    });

    afterEach(() => {
        console.warn = originalConsoleWarn;
    });

    describe('@ProxyProperty decorator', () => {
        it('proxies to a single named property', () => {
            expect(test.singleProperty).toBe(1);
            test.singleProperty = 2;
            expect(test.singleProperty).toBe(2);

            // eslint-disable-next-line no-prototype-builtins
            expect(test.hasOwnProperty('singleProperty')).toBe(false);
        });

        it('proxies to a nested property', () => {
            expect(test.multipleProperties).toBe(1);
            test.multipleProperties = 2;
            expect(test.multipleProperties).toBe(2);

            // eslint-disable-next-line no-prototype-builtins
            expect(test.hasOwnProperty('multipleProperties')).toBe(false);
        });
    });

    describe('@ProxyOnWrite decorator', () => {
        it('should write value to named property', () => {
            test.proxied = 'test1234';
            expect(test.proxied).toEqual('test1234');
            expect(test.target).toEqual('test1234');

            // eslint-disable-next-line no-prototype-builtins
            expect(test.hasOwnProperty('proxied')).toBe(false);
            // eslint-disable-next-line no-prototype-builtins
            expect(test.hasOwnProperty('target')).toBe(true);
        });
    });

    describe('@ProxyPropertyOnWrite decorator', () => {
        it('should write value to child', () => {
            test.proxiedProp = 'test1234';
            expect(test.proxiedProp).toEqual('test1234');
            expect(test.child.proxiedProp).toEqual('test1234');
            expect(test.child.otherProp).toBeUndefined();

            // eslint-disable-next-line no-prototype-builtins
            expect(test.hasOwnProperty('proxiedProp')).toBe(false);
            // eslint-disable-next-line no-prototype-builtins
            expect(test.child.hasOwnProperty('proxiedProp')).toBe(true);
            // eslint-disable-next-line no-prototype-builtins
            expect(test.child.hasOwnProperty('otherProp')).toBe(false);
        });

        it('should write value to child with different property key', () => {
            test.proxiedProp2 = 'test1234';
            expect(test.proxiedProp2).toEqual('test1234');
            expect(test.child.proxiedProp).toBeUndefined();
            expect(test.child.otherProp).toEqual('test1234');

            // eslint-disable-next-line no-prototype-builtins
            expect(test.hasOwnProperty('proxiedProp2')).toBe(false);
            // eslint-disable-next-line no-prototype-builtins
            expect(test.child.hasOwnProperty('proxiedProp')).toBe(false);
            // eslint-disable-next-line no-prototype-builtins
            expect(test.child.hasOwnProperty('otherProp')).toBe(true);
        });
    });
});
