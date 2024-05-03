import { Debug } from './debug';

type StateDefinition<State extends string, Event extends string> = {
    [key in Event]?: StateTransition<State> | StateTransitionAction | State | HierarchyState | StateMachine<any, any>;
};
type StateUtils = {
    onEnter?: () => void;
    onExit?: () => void;
};
type StateTransition<State> = {
    target: State | HierarchyState | StateMachine<any, any>;
    action?: StateTransitionAction;
};
type StateTransitionAction = (data?: any) => void;
type HierarchyState = '__parent' | '__child';

const debugColor = 'color: green';

/**
 * A Hierarchical Finite State Machine is a system that must be in exactly one of a list of states, where those states
 * can also be other state machines. It can only transition between one state and another if a transition event is
 * provided between the two states.
 */
export class StateMachine<State extends string, Event extends string> {
    protected readonly debug = Debug.create(true, 'animation');
    private state: State | HierarchyState;
    private childState?: StateMachine<any, any>;

    constructor(
        private readonly defaultState: State,
        private readonly states: Record<State, StateDefinition<State, Event> & StateUtils>,
        private readonly enterEach?: (from: State | HierarchyState, to: State | HierarchyState) => void
    ) {
        this.state = defaultState;

        this.debug(`%c${this.constructor.name} | init -> ${defaultState}`, debugColor);
    }

    is(value: any): boolean {
        if (this.state === '__child' && this.childState) {
            return this.childState.is(value);
        }
        return this.state === value;
    }

    transition(event: Event, data?: any) {
        const shouldTransitionSelf = this.transitionChild(event, data);

        if (!shouldTransitionSelf || this.state === '__child' || this.state === '__parent') {
            return;
        }

        const currentStateConfig = this.states[this.state];
        const destinationTransition = currentStateConfig?.[event];

        if (!destinationTransition) {
            this.debug(`%c${this.constructor.name} | ${this.state} -> ${event} -> ${this.state}`, 'color: grey');
            return;
        }

        const destinationState = this.getDestinationState(destinationTransition);
        const exitFn = destinationState === this.state ? undefined : currentStateConfig.onExit;

        this.debug(`%c${this.constructor.name} | ${this.state} -> ${event} -> ${destinationState}`, debugColor);

        this.enterEach?.(this.state, destinationState);
        if (destinationState !== '__child' && destinationState !== '__parent') {
            this.states[destinationState].onEnter?.();
        }

        // Change the state before calling the transition action to allow the action to trigger a subsequent transition
        this.state = destinationState;

        if (typeof destinationTransition === 'function') {
            destinationTransition(data);
        } else if (typeof destinationTransition === 'object' && !(destinationTransition instanceof StateMachine)) {
            destinationTransition.action?.(data);
        }

        exitFn?.();
    }

    protected resetHierarchy() {
        this.debug(
            `%c${this.constructor.name} | ${this.state} -> [resetHierarchy] -> ${this.defaultState}`,
            'color: green'
        );
        this.state = this.defaultState;
    }

    private transitionChild(event: Event, data?: any) {
        if (this.state !== '__child' || !this.childState) return true;

        this.childState.transition(event, data);

        if (!this.childState.is('__parent')) return true;

        this.debug(`%c${this.constructor.name} | ${this.state} -> ${event} -> ${this.defaultState}`, debugColor);
        this.state = this.defaultState;
        this.states[this.state].onEnter?.();
        this.childState.resetHierarchy();

        return false;
    }

    private getDestinationState(
        transition: StateTransition<State> | StateTransitionAction | State | HierarchyState | StateMachine<any, any>
    ) {
        let state: State | HierarchyState = this.state;

        if (typeof transition === 'string') {
            state = transition as State;
        } else if (transition instanceof StateMachine) {
            this.childState = transition;
            state = '__child';
        } else if (typeof transition === 'object') {
            if (transition.target instanceof StateMachine) {
                this.childState = transition.target;
                state = '__child';
            } else {
                state = transition.target;
            }
        }

        return state;
    }
}
