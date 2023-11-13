import { Debug } from '../util/debug';

type StateDefinition<State extends string, Event extends string> = {
    [key in Event]?: StateTransition<State> | StateTransitionAction | State;
};
type StateTransition<State> = {
    target: State;
    action?: StateTransitionAction;
};
type StateTransitionAction = (data?: any) => void;

export class StateMachine<State extends string, Event extends string> {
    private readonly debug = Debug.create(true, 'animation');
    private state: State;

    constructor(
        initialState: State,
        private readonly states: Record<State, StateDefinition<State, Event>>,
        private readonly preTransitionCb?: (from: State, to: State) => void
    ) {
        this.state = initialState;

        this.debug(`%c${this.constructor.name} | init -> ${initialState}`, 'color: green');
    }

    transition(event: Event, data?: any) {
        const currentStateConfig = this.states[this.state];
        const destinationTransition = currentStateConfig?.[event];

        if (!destinationTransition) {
            this.debug(`%c${this.constructor.name} | ${this.state} -> ${event} -> ${this.state}`, 'color: grey');
            return;
        }

        let destinationState = this.state;

        if (typeof destinationTransition === 'string') {
            destinationState = destinationTransition as State;
        } else if (typeof destinationTransition === 'object') {
            destinationState = destinationTransition.target;
        }

        this.debug(`%c${this.constructor.name} | ${this.state} -> ${event} -> ${destinationState}`, 'color: green');

        this.preTransitionCb?.(this.state, destinationState);

        // Change the state before calling the transition action to allow the action to trigger a subsequent transition
        this.state = destinationState;

        if (typeof destinationTransition === 'function') {
            destinationTransition(data);
        } else if (typeof destinationTransition === 'object') {
            destinationTransition.action?.(data);
        }

        return this.state;
    }
}
