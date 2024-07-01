import { type MementoOriginator } from './memento';
export declare class StateManager {
    private readonly caretaker;
    private readonly state;
    setState(originator: MementoOriginator, value: any): void;
    restoreState(originator: MementoOriginator): void;
}
