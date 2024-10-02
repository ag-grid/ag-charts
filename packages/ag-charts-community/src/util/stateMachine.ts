import { Debug } from './debug';

type StateDefinition<State extends string, Event extends string> = {
    [key in Event]?: Destination<State>;
};
type Destination<State extends string> =
    | Array<StateTransition<State>>
    | StateTransition<State>
    | StateTransitionAction
    | State
    | HierarchyState
    | StateMachine<any, any>;
type StateUtils<State extends string> = {
    onEnter?: (from?: State, data?: any) => void;
    onExit?: () => void;
};
type StateTransition<State> = {
    /**
     * Return `false` to prevent the action and transition. The FSM will pick the first transition that passes its
     * guard or does not have one.
     */
    guard?: (data?: any) => boolean;
    target?: State | HierarchyState | StateMachine<any, any>;
    action?: StateTransitionAction;
};
type StateTransitionAction = (data?: any) => void;
type HierarchyState = '__parent' | '__child';

const debugColor = 'color: green';
const debugQuietColor = 'color: grey';

/**
 * A Hierarchical Finite State Machine is a system that must be in exactly one of a list of states, where those states
 * can also be other state machines. It can only transition between one state and another if a transition event is
 * provided between the two states.
 */
export class StateMachine<State extends string, Event extends string> {
    static readonly child = '__child' as const;
    static readonly parent = '__parent' as const;

    protected readonly debug = Debug.create(true, 'animation');
    private state: State | HierarchyState;
    private childState?: StateMachine<any, any>;

    constructor(
        private readonly defaultState: State,
        private readonly states: Record<State, StateDefinition<State, Event> & StateUtils<State>>,
        private readonly enterEach?: (from: State | HierarchyState, to: State | HierarchyState) => void
    ) {
        this.state = defaultState;

        this.debug(`%c${this.constructor.name} | init -> ${defaultState}`, debugColor);
    }

    transition(event: Event, data?: any) {
        const shouldTransitionSelf = this.transitionChild(event, data);

        if (!shouldTransitionSelf || this.state === StateMachine.child || this.state === StateMachine.parent) {
            return;
        }

        const currentState = this.state;
        const currentStateConfig = this.states[this.state];
        let destination: Destination<State> | undefined = currentStateConfig[event];

        const debugPrefix = `%c${this.constructor.name} | ${this.state} -> ${event} ->`;

        if (Array.isArray(destination)) {
            destination = destination.find((transition) => {
                if (!transition.guard) return true;
                const valid = transition.guard(data);
                if (!valid) {
                    this.debug(`${debugPrefix} ${transition.target} (guarded)`, debugQuietColor);
                }
                return valid;
            });
        } else if (
            typeof destination === 'object' &&
            !(destination instanceof StateMachine) &&
            destination.guard &&
            !destination.guard(data)
        ) {
            this.debug(`${debugPrefix} ${destination.target} (guarded)`, debugQuietColor);
            return;
        }

        if (!destination) {
            this.debug(`${debugPrefix} ${this.state}`, debugQuietColor);
            return;
        }

        const destinationState = this.getDestinationState(destination);
        const exitFn = destinationState === this.state ? undefined : currentStateConfig.onExit;

        this.debug(`${debugPrefix} ${destinationState}`, debugColor);

        // Change the state before calling the transition action to allow the action to trigger a subsequent transition
        this.state = destinationState;

        if (typeof destination === 'function') {
            destination(data);
        } else if (typeof destination === 'object' && !(destination instanceof StateMachine)) {
            destination.action?.(data);
        }

        exitFn?.();

        this.enterEach?.(currentState, destinationState);
        if (
            destinationState !== currentState &&
            destinationState !== StateMachine.child &&
            destinationState !== StateMachine.parent
        ) {
            this.states[destinationState].onEnter?.(currentState, data);
        }
    }

    transitionAsync(event: Event, data?: any) {
        // TODO: consider merging this with transition
        setTimeout(() => {
            this.transition(event, data);
        }, 0);
    }

    protected is(value: unknown): boolean {
        if (this.state === StateMachine.child && this.childState) {
            return this.childState.is(value);
        }
        return this.state === value;
    }

    protected resetHierarchy() {
        this.debug(
            `%c${this.constructor.name} | ${this.state} -> [resetHierarchy] -> ${this.defaultState}`,
            'color: green'
        );
        this.state = this.defaultState;
    }

    private transitionChild(event: Event, data?: any) {
        if (this.state !== StateMachine.child || !this.childState) return true;

        this.childState.transition(event, data);

        if (!this.childState.is(StateMachine.parent)) return true;

        this.debug(`%c${this.constructor.name} | ${this.state} -> ${event} -> ${this.defaultState}`, debugColor);
        this.state = this.defaultState;
        this.states[this.state].onEnter?.();
        this.childState.resetHierarchy();

        return false;
    }

    private getDestinationState(
        destination: StateTransition<State> | StateTransitionAction | State | HierarchyState | StateMachine<any, any>
    ) {
        let state: State | HierarchyState = this.state;

        if (typeof destination === 'string') {
            state = destination as State;
        } else if (destination instanceof StateMachine) {
            this.childState = destination;
            state = StateMachine.child;
        } else if (typeof destination === 'object') {
            if (destination.target instanceof StateMachine) {
                this.childState = destination.target;
                state = StateMachine.child;
            } else if (destination.target != null) {
                state = destination.target;
            }
        }

        return state;
    }
}
