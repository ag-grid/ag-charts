import type { Module } from '../../module/module';
import { InitialState } from './initialState';

export const InitialStateModule: Module = {
    type: 'root',
    optionsKey: 'initialState',
    packageType: 'community',
    chartTypes: ['cartesian'],
    instanceConstructor: InitialState,
};
