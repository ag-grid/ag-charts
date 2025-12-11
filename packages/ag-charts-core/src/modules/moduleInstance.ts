import { CleanupRegistry } from '../state/cleanupRegistry';
import type { ModuleInstance } from './moduleDefinition';

export abstract class AbstractModuleInstance implements ModuleInstance {
    protected readonly cleanup = new CleanupRegistry();

    destroy() {
        this.cleanup.flush();
    }
}
