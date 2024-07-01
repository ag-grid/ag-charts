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
/**
 * A Hierarchical Finite State Machine is a system that must be in exactly one of a list of states, where those states
 * can also be other state machines. It can only transition between one state and another if a transition event is
 * provided between the two states.
 */
export declare class StateMachine<State extends string, Event extends string> {
    private readonly defaultState;
    private readonly states;
    private readonly enterEach?;
    protected readonly debug: import("./debug").DebugLogger;
    private state;
    private childState?;
    constructor(defaultState: State, states: Record<State, StateDefinition<State, Event> & StateUtils>, enterEach?: ((from: State | HierarchyState, to: State | HierarchyState) => void) | undefined);
    is(value: any): boolean;
    transition(event: Event, data?: any): void;
    protected resetHierarchy(): void;
    private transitionChild;
    private getDestinationState;
}
export {};
