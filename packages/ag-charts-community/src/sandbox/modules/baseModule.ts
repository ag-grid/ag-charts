import type { IModule } from '../types';

export class BaseModule implements IModule {
    static createInstance() {
        return new this();
    }
}
