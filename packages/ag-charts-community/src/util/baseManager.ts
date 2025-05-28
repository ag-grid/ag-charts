import { CleanupRegistry } from 'ag-charts-core';

export abstract class BaseManager {
    protected readonly cleanup = new CleanupRegistry();
    protected destroyed = false;

    public destroy() {
        this.cleanup.flush();
        this.destroyed = true;
    }
}
