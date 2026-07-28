import { type Logger, MementoCaretaker, type MementoOriginator, objectsEqual } from 'ag-charts-core';

import { VERSION } from '../../version';

export class StateManager {
    private readonly caretaker = new MementoCaretaker(VERSION);
    private readonly state = new Map<string, any>();

    constructor(private readonly logger: Logger) {}

    setState(originator: MementoOriginator, value: any) {
        if (objectsEqual(this.state.get(originator.mementoOriginatorKey), value)) {
            return;
        }

        this.setStateAndRestore(originator, value);
    }

    setStateAndRestore(originator: MementoOriginator, value: any) {
        this.state.set(originator.mementoOriginatorKey, value);
        this.restoreState(originator);
    }

    restoreState(originator: MementoOriginator) {
        const { caretaker, state } = this;
        if (!state.has(originator.mementoOriginatorKey)) return;

        const value = state.get(originator.mementoOriginatorKey);
        caretaker.restore(
            this.logger,
            { version: caretaker.version, [originator.mementoOriginatorKey]: value },
            originator
        );
    }
}
