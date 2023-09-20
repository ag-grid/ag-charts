import { Debug } from '../util/debug';

type StateDefinition<State extends string, Event extends string> = {
    [key in Event]?: {
        target: State;
        action?: (data?: any) => void;
    };
};

export class StateMachine<State extends string, Event extends string> {
    private readonly debug = Debug.create(true, 'animation');
    private readonly states: Record<State, StateDefinition<State, Event>>;
    private state: State;

    constructor(initialState: State, states: Record<State, StateDefinition<State, Event>>) {
        this.state = initialState;
        this.states = states;

        this.debug(`%c${this.constructor.name} | init -> ${initialState}`, 'color: green');
    }

    transition(event: Event, data?: any) {
        const currentStateConfig = this.states[this.state];
        const destinationTransition = currentStateConfig?.[event];

        if (!destinationTransition) {
            this.debug(`%c${this.constructor.name} | ${this.state} -> ${event} -> ${this.state}`, 'color: grey');
            return;
        }

        const destinationState = destinationTransition.target;

        this.debug(`%c${this.constructor.name} | ${this.state} -> ${event} -> ${destinationState}`, 'color: green');

        destinationTransition.action?.(data);

        this.state = destinationState;

        return this.state;
    }
}
