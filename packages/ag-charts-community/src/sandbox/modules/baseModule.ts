import type { IModule } from './modulesTypes';

export class BaseModule implements IModule {
    static createInstance() {
        return new this();
    }
}
