import { describe, expect, it, jest } from '@jest/globals';

import { type DynamicContext, createDynamicContext } from './dynamicContext';

interface TestRegistry {
    name: string;
    count: number;
    logger: { log: (msg: string) => void; destroy: () => void };
    formatter: { format: (v: number) => string };
    greeting: string;
}

describe('DynamicContext', () => {
    describe('constant', () => {
        it('should store and retrieve via property access', () => {
            const container = createDynamicContext<TestRegistry>();
            container.constant('name', 'test');
            expect(container.name).toBe('test');
        });

        it('should return the same reference for object constants', () => {
            const container = createDynamicContext<TestRegistry>();
            const obj = { log: jest.fn(), destroy: jest.fn() };
            container.constant('logger', obj);
            expect(container.logger).toBe(obj);
        });

        it('should support destructuring', () => {
            const container = createDynamicContext<TestRegistry>();
            container.constant('name', 'hello');
            container.constant('count', 42);

            const { name, count } = container;
            expect(name).toBe('hello');
            expect(count).toBe(42);
        });
    });

    describe('service', () => {
        it('should lazily initialise on first access', () => {
            const factory = jest.fn(() => 42);
            const container = createDynamicContext<TestRegistry>();
            container.service('count', factory);

            expect(factory).not.toHaveBeenCalled();
            expect(container.count).toBe(42);
            expect(factory).toHaveBeenCalledTimes(1);
        });

        it('should return the cached instance on subsequent accesses', () => {
            const factory = jest.fn(() => 42);
            const container = createDynamicContext<TestRegistry>();
            container.service('count', factory);

            expect(container.count).toBe(42);
            expect(container.count).toBe(42);
            expect(container.count).toBe(42);
            expect(factory).toHaveBeenCalledTimes(1);
        });

        it('should pass the container to the factory', () => {
            const container = createDynamicContext<TestRegistry>();
            container.constant('name', 'world');
            container.service('greeting', (c) => `hello ${c.name}`);

            expect(container.greeting).toBe('hello world');
        });

        it('should support destructuring of lazy services', () => {
            const container = createDynamicContext<TestRegistry>();
            container.constant('name', 'world');
            container.service('greeting', (c) => `hello ${c.name}`);
            container.service('count', () => 99);

            const { greeting, count } = container;
            expect(greeting).toBe('hello world');
            expect(count).toBe(99);
        });
    });

    describe('factory', () => {
        it('should create a new instance on every access', () => {
            let callCount = 0;
            const container = createDynamicContext<TestRegistry>();
            container.factory('count', () => ++callCount);

            expect(container.count).toBe(1);
            expect(container.count).toBe(2);
            expect(container.count).toBe(3);
        });

        it('should pass the container to the factory', () => {
            const container = createDynamicContext<TestRegistry>();
            container.constant('name', 'world');
            container.factory('greeting', (c) => `hello ${c.name}`);

            expect(container.greeting).toBe('hello world');
        });
    });

    describe('has', () => {
        it('should return true for registered entries', () => {
            const container = createDynamicContext<TestRegistry>();
            container.constant('name', 'test');
            expect(container.has('name')).toBe(true);
        });

        it('should return false for unregistered entries', () => {
            const container = createDynamicContext<TestRegistry>();
            expect(container.has('name')).toBe(false);
        });

        it('should check parent registrations', () => {
            const parent = createDynamicContext<TestRegistry>();
            parent.constant('name', 'parent');
            const child = parent.child();

            expect(child.has('name')).toBe(true);
            expect(child.has('count')).toBe(false);
        });

        it('should support the "in" operator', () => {
            const container = createDynamicContext<TestRegistry>();
            container.constant('name', 'test');

            expect('name' in container).toBe(true);
            expect('count' in container).toBe(false);
        });
    });

    describe('error handling', () => {
        it('should detect circular dependencies', () => {
            interface CircularRegistry {
                a: string;
                b: string;
            }

            const container = createDynamicContext<CircularRegistry>();
            container.service('a', (c) => c.b);
            container.service('b', (c) => c.a);

            expect(() => container.a).toThrow("circular dependency detected while resolving 'a'");
        });

        it('should detect self-referencing dependencies', () => {
            interface SelfRegistry {
                a: string;
            }

            const container = createDynamicContext<SelfRegistry>();
            container.service('a', (c) => c.a);

            expect(() => container.a).toThrow("circular dependency detected while resolving 'a'");
        });
    });

    describe('child containers', () => {
        it('should resolve from parent when not registered locally', () => {
            const parent = createDynamicContext<TestRegistry>();
            parent.constant('name', 'parent-value');
            const child = parent.child();

            expect(child.name).toBe('parent-value');
        });

        it('should prefer local registrations over parent', () => {
            const parent = createDynamicContext<TestRegistry>();
            parent.constant('name', 'parent-value');
            const child = parent.child();
            child.constant('name', 'child-value');

            expect(child.name).toBe('child-value');
            expect(parent.name).toBe('parent-value');
        });

        it('should support extended type registrations', () => {
            const parent = createDynamicContext<TestRegistry>();
            parent.constant('name', 'test');

            interface ChildExtension {
                extra: number;
            }

            const child = parent.child<ChildExtension>();
            child.constant('extra', 99);

            expect(child.name).toBe('test');
            expect(child.extra).toBe(99);
        });

        it('should support destructuring across parent and child', () => {
            interface ParentRegistry {
                base: string;
            }
            interface ChildExtension {
                derived: string;
            }

            const parent = createDynamicContext<ParentRegistry>();
            parent.constant('base', 'hello');

            const child = parent.child<ChildExtension>();
            child.service('derived', (c) => `${c.base} world`);

            const { base, derived } = child;
            expect(base).toBe('hello');
            expect(derived).toBe('hello world');
        });
    });

    describe('destroy', () => {
        it('should call destroy() on initialised services', () => {
            const destroy = jest.fn();
            const container = createDynamicContext<TestRegistry>();
            container.service('logger', () => ({ log: jest.fn(), destroy }));

            expect(container.logger).toBeDefined();
            container.destroy();

            expect(destroy).toHaveBeenCalledTimes(1);
        });

        it('should not call destroy() on uninitialised services', () => {
            const destroy = jest.fn();
            const container = createDynamicContext<TestRegistry>();
            container.service('logger', () => ({ log: jest.fn(), destroy }));

            container.destroy();

            expect(destroy).not.toHaveBeenCalled();
        });

        it('should not call destroy() on primitive constants', () => {
            const container = createDynamicContext<TestRegistry>();
            container.constant('name', 'test');
            container.constant('count', 42);

            // Should not throw
            container.destroy();
        });

        it('should cascade destroy to children', () => {
            const parentDestroy = jest.fn();
            const childDestroy = jest.fn();

            const parent = createDynamicContext<TestRegistry>();
            parent.service('logger', () => ({ log: jest.fn(), destroy: parentDestroy }));
            expect(parent.logger).toBeDefined();

            const child = parent.child<{ childLogger: { destroy: () => void } }>();
            child.service('childLogger', () => ({ destroy: childDestroy }));
            expect(child.childLogger).toBeDefined();

            parent.destroy();

            expect(childDestroy).toHaveBeenCalledTimes(1);
            expect(parentDestroy).toHaveBeenCalledTimes(1);
        });

        it('should skip destroy() on ref-registered entries', () => {
            const destroy = jest.fn();
            const container = createDynamicContext<TestRegistry>();
            container.ref('logger', { log: jest.fn(), destroy });

            container.destroy();

            expect(destroy).not.toHaveBeenCalled();
        });

        it('should flush cleanup registry on destroy', () => {
            const cleanupFn = jest.fn();
            const container = createDynamicContext<TestRegistry>();
            container.cleanup.register(cleanupFn);

            container.destroy();

            expect(cleanupFn).toHaveBeenCalledTimes(1);
        });

        it('should be idempotent', () => {
            const destroy = jest.fn();
            const container = createDynamicContext<TestRegistry>();
            container.service('logger', () => ({ log: jest.fn(), destroy }));
            expect(container.logger).toBeDefined();

            container.destroy();
            container.destroy();

            expect(destroy).toHaveBeenCalledTimes(1);
        });

        it('should destroy in reverse-registration (LIFO) order', () => {
            interface OrderRegistry {
                first: { destroy: () => void };
                second: { destroy: () => void };
                third: { destroy: () => void };
            }

            const order: string[] = [];
            const container = createDynamicContext<OrderRegistry>();
            container.service('first', () => ({ destroy: () => order.push('first') }));
            container.service('second', () => ({ destroy: () => order.push('second') }));
            container.service('third', () => ({ destroy: () => order.push('third') }));

            // Force initialisation so destroy has something to call
            expect(container.first).toBeDefined();
            expect(container.second).toBeDefined();
            expect(container.third).toBeDefined();

            container.destroy();

            expect(order).toEqual(['third', 'second', 'first']);
        });

        it('should throw on registration after destroy', () => {
            const container = createDynamicContext<TestRegistry>();
            container.destroy();

            expect(() => container.constant('name', 'test')).toThrow('destroyed context');
            expect(() => container.service('count', () => 1)).toThrow('destroyed context');
            expect(() => container.factory('count', () => 1)).toThrow('destroyed context');
        });
    });

    describe('chaining', () => {
        it('should support fluent registration', () => {
            const container = createDynamicContext<TestRegistry>();
            const result = container.constant('name', 'test').service('count', () => 42);

            expect(result).toBe(container);
            expect(container.name).toBe('test');
            expect(container.count).toBe(42);
        });
    });

    describe('module registration pattern', () => {
        interface AppRegistry {
            core: string;
            analytics: { track: (event: string) => void };
            toolbar: { render: () => void };
        }

        interface ModuleDef {
            name: string;
            enabled: boolean;
            register: (container: DynamicContext<AppRegistry>) => void;
        }

        it('should only register services for enabled modules', () => {
            const modules: ModuleDef[] = [
                {
                    name: 'analytics',
                    enabled: true,
                    register: (c) => c.service('analytics', () => ({ track: jest.fn() })),
                },
                {
                    name: 'toolbar',
                    enabled: false,
                    register: (c) => c.service('toolbar', () => ({ render: jest.fn() })),
                },
            ];

            const container = createDynamicContext<AppRegistry>();
            container.constant('core', 'base');

            for (const mod of modules) {
                if (mod.enabled) {
                    mod.register(container);
                }
            }

            expect(container.has('core')).toBe(true);
            expect(container.has('analytics')).toBe(true);
            expect(container.has('toolbar')).toBe(false);
        });

        it('should allow multiple modules to guard shared service registration', () => {
            const factory = jest.fn(() => ({ render: jest.fn() }));

            const moduleA: ModuleDef = {
                name: 'moduleA',
                enabled: true,
                register: (c) => {
                    if (!c.has('toolbar')) {
                        c.service('toolbar', factory);
                    }
                },
            };

            const moduleB: ModuleDef = {
                name: 'moduleB',
                enabled: true,
                register: (c) => {
                    if (!c.has('toolbar')) {
                        c.service('toolbar', factory);
                    }
                },
            };

            const container = createDynamicContext<AppRegistry>();
            moduleA.register(container);
            moduleB.register(container);

            // Trigger initialisation
            expect(container.toolbar).toBeDefined();
            // Factory called once despite two registrations
            expect(factory).toHaveBeenCalledTimes(1);
        });
    });
});
