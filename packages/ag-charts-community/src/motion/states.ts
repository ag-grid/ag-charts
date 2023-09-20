import { Logger } from '../util/logger';
import { windowValue } from '../util/window';

type StateDefinition<State extends string, Event extends string> = {
    [key in Event]?: {
        target: State;
        action?: (data?: any) => void;
    };
};

export class StateMachine<State extends string, Event extends string> {
    static DEBUG = () => [true, 'animation'].includes(windowValue('agChartsDebug') as string) ?? false;

    private states: Record<State, StateDefinition<State, Event>>;
    private state: State;

    constructor(initialState: State, states: Record<State, StateDefinition<State, Event>>) {
        this.state = initialState;
        this.states = states;

        if (StateMachine.DEBUG()) Logger.debug(`%c${this.constructor.name} | init -> ${initialState}`, 'color: green');
    }

    transition(event: Event, data?: any) {
        const currentStateConfig = this.states[this.state];
        const destinationTransition = currentStateConfig?.[event];

        if (!destinationTransition) {
            if (StateMachine.DEBUG()) {
                Logger.debug(`%c${this.constructor.name} | ${this.state} -> ${event} -> ${this.state}`, 'color: grey');
            }
            return;
        }

        const destinationState = destinationTransition.target;

        if (StateMachine.DEBUG()) {
            Logger.debug(
                `%c${this.constructor.name} | ${this.state} -> ${event} -> ${destinationState}`,
                'color: green'
            );
        }

        // Change the state before calling the transition action to allow the action to trigger a subsequent transition
        this.state = destinationState;

        destinationTransition.action?.(data);

        return this.state;
    }
}
