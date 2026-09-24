import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ParallelStateMachine, StateMachine } from './stateMachine';

describe('State Machine', () => {
    let state: any;
    let initialEventNext: any;
    let nextEnter: any;

    describe('Simple', () => {
        beforeEach(() => {
            initialEventNext = vi.fn();
            nextEnter = vi.fn();
            state = new StateMachine<'initial' | 'next', { event: undefined }>('initial', {
                initial: {
                    event: {
                        target: 'next',
                        action: initialEventNext,
                    },
                },
                next: {
                    onEnter: nextEnter,
                },
            });
        });

        it('should initialise to the given initial state', () => {
            expect(state.state).toBe('initial');
        });

        it('should transition between two states', () => {
            state.transition('event');
            expect(state.state).toBe('next');
        });

        it('should call the transition action', () => {
            state.transition('event');
            expect(initialEventNext).toHaveBeenCalledTimes(1);
        });

        it('should call the onEnter for the new state', () => {
            state.transition('event');
            expect(nextEnter).toHaveBeenCalledTimes(1);
        });
    });

    describe('Hierarchical', () => {
        let child: any;

        beforeEach(() => {
            child = new StateMachine<'child-initial' | 'child-next', { event: undefined }>('child-initial', {
                'child-initial': {
                    event: {
                        target: 'child-next',
                    },
                },
                'child-next': {
                    event: {
                        target: '__parent',
                    },
                },
            });
            state = new StateMachine<'initial', { event: undefined }>('initial', {
                initial: {
                    event: {
                        target: child,
                        action: initialEventNext,
                    },
                },
            });
        });

        it('should transition to a child state', () => {
            state.transition('event');
            expect(state.state).toBe('__child');
            expect(child.state).toBe('child-initial');
            expect(state.is('child-initial')).toBe(true);
        });

        it('should transition between two child states', () => {
            state.transition('event');
            state.transition('event');
            expect(state.state).toBe('__child');
            expect(child.state).toBe('child-next');
            expect(state.is('child-next')).toBe(true);
        });

        it("should transition back to the parent's default state", () => {
            state.transition('event');
            state.transition('event');
            state.transition('event');
            expect(child.state).toBe('child-initial');
            expect(state.state).toBe('initial');
            expect(state.is('initial')).toBe(true);
        });
    });

    describe('Parallel', () => {
        let child1: any;
        let child2: any;

        beforeEach(() => {
            child1 = new StateMachine<'child-initial' | 'child-next', { event: undefined }>('child-initial', {
                'child-initial': {
                    event: {
                        target: 'child-next',
                    },
                },
                'child-next': {
                    event: {
                        target: '__parent',
                    },
                },
            });
            child2 = new StateMachine<'child-initial' | 'child-next', { event: undefined }>('child-initial', {
                'child-initial': {
                    event: {
                        target: 'child-next',
                    },
                },
                'child-next': {
                    event: {
                        target: '__parent',
                    },
                },
            });
            state = new ParallelStateMachine<'initial', { event: undefined }>(child1, child2);
        });

        it('should transition all children', () => {
            expect(child1.state).toBe('child-initial');
            expect(child2.state).toBe('child-initial');
            state.transition('event');
            expect(child1.state).toBe('child-next');
            expect(child2.state).toBe('child-next');
        });
    });

    describe('Properties', () => {
        let childProperty: any;

        class Parent extends StateMachine<'initial', { event: undefined }> {
            testProperty = 'parent-value';

            override inheritedProperties() {
                return ['testProperty'] as const;
            }

            constructor() {
                super('initial', {
                    initial: {
                        event: {
                            target: new Child(),
                            action: initialEventNext,
                        },
                    },
                });
            }
        }

        class Child extends StateMachine<'child-initial', { event: undefined }> {
            testProperty = 'child-value';

            override inheritedProperties() {
                return ['testProperty'] as const;
            }

            constructor() {
                super('child-initial', {
                    'child-initial': {
                        event: () => {
                            childProperty = this.testProperty;
                        },
                    },
                });
                childProperty = this.testProperty;
            }
        }

        class GrandChild extends Child {}

        beforeEach(() => {
            state = new Parent();
        });

        it('should pass properties to children before transitioning', () => {
            expect(childProperty).toBe('child-value');
            state.transition('event'); // parent
            state.transition('event'); // child
            expect(childProperty).toBe('parent-value');
        });

        it('should pass properties through every level of nested state machines', () => {
            let leafProperty: string | undefined;

            class Leaf extends StateMachine<'leaf-initial', { event: undefined }> {
                testProperty = 'leaf-value';

                override inheritedProperties() {
                    return ['testProperty'] as const;
                }

                constructor() {
                    super('leaf-initial', {
                        'leaf-initial': {
                            event: () => {
                                leafProperty = this.testProperty;
                            },
                        },
                    });
                }
            }

            class Middle extends StateMachine<'middle-initial', { event: undefined }> {
                testProperty = 'middle-value';

                override inheritedProperties() {
                    return ['testProperty'] as const;
                }

                constructor() {
                    super('middle-initial', { 'middle-initial': { event: { target: new Leaf() } } });
                }
            }

            class Root extends StateMachine<'root-initial', { event: undefined }> {
                testProperty = 'root-value';

                override inheritedProperties() {
                    return ['testProperty'] as const;
                }

                constructor() {
                    super('root-initial', { 'root-initial': { event: { target: new Middle() } } });
                }
            }

            state = new Root();
            state.transition('event'); // root enters middle
            state.transition('event'); // middle enters leaf
            state.transition('event'); // leaf handles the event
            expect(leafProperty).toBe('root-value');
        });

        it('should pass properties to a subclass that inherits its parent list', () => {
            class SubclassParent extends StateMachine<'initial', { event: undefined }> {
                testProperty = 'parent-value';

                override inheritedProperties() {
                    return ['testProperty'] as const;
                }

                constructor() {
                    super('initial', { initial: { event: { target: new GrandChild(), action: initialEventNext } } });
                }
            }

            state = new SubclassParent();
            state.transition('event'); // parent
            state.transition('event'); // grandchild
            expect(childProperty).toBe('parent-value');
        });
    });
});
