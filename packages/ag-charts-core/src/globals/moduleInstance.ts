import type { ModuleInstance } from '../interfaces/moduleDefinition';
import { CleanupRegistry } from '../utils/cleanupRegistry';

export abstract class AbstractModuleInstance implements ModuleInstance {
    protected readonly cleanup = new CleanupRegistry();

    destroy() {
        this.cleanup.flush();
    }
}
