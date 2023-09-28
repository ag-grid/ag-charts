import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { StateMachine } from './states';

describe('Animation States', () => {
    let state: any;
    let initialEventNext: any;

    beforeEach(() => {
        initialEventNext = jest.fn();
        state = new StateMachine('initial', {
            initial: {
                event: {
                    target: 'next',
                    action: initialEventNext,
                },
            },
            next: {},
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
});
