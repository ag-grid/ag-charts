import { VERSION } from '../../version';
import { MementoCaretaker, type MementoOriginator } from './memento';

export class StateManager {
    private readonly caretaker = new MementoCaretaker(VERSION);
    private readonly state = new Map<string, any>();

    setState(originator: MementoOriginator, value: any) {
        this.state.set(originator.mementoOriginatorKey, value);
        this.restoreState(originator);
    }

    restoreState(originator: MementoOriginator) {
        const { caretaker, state } = this;
        if (!state.has(originator.mementoOriginatorKey)) return;

        const value = state.get(originator.mementoOriginatorKey);
        caretaker.restore({ version: caretaker.version, [originator.mementoOriginatorKey]: value }, originator);
    }
}
