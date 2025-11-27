import { describe, expect, it } from '@jest/globals';

import { EventEmitter } from 'ag-charts-core';

import { Mutex } from '../../util/mutex';
import { AnimationManager } from '../interaction/animationManager';
import { InteractionManager } from '../interaction/interactionManager';
import { DataService } from './dataService';

const REQUEST_THROTTLE = 1;

function sleep() {
    return new Promise((resolve) => setTimeout(resolve, REQUEST_THROTTLE));
}

describe('DataService', () => {
    let dataService: DataService<any>;
    let eventsHub: EventEmitter<any>;
    let eventEmitSpy: jest.SpyInstance;

    const undefinedWindow = { windowStart: undefined, windowEnd: undefined };
    const definedWindow = { windowStart: new Date('2025-01-01'), windowEnd: new Date('2025-12-31') };

    beforeEach(() => {
        eventsHub = new EventEmitter();
        eventEmitSpy = jest.spyOn(eventsHub, 'emit');

        const interactionManager = new InteractionManager();
        const chartUpdateMutex = new Mutex();
        const animationManager = new AnimationManager(interactionManager, chartUpdateMutex);
        dataService = new DataService(eventsHub, {}, animationManager);
        dataService.requestThrottle = REQUEST_THROTTLE;
    });

    afterEach(() => {
        dataService.clearCallback();
        eventEmitSpy.mockReset();
        eventEmitSpy.mockRestore();
    });

    it('should emit `data:load` and callback with an undefined window', async () => {
        const data = [{ datum: 'value' }];
        const dataSourceCallback = jest.fn((_params) => Promise.resolve(data));
        dataService.updateCallback(dataSourceCallback);
        dataService.load(undefinedWindow);

        await sleep();

        expect(dataSourceCallback).toHaveBeenCalledTimes(1);
        expect(dataSourceCallback).toHaveBeenCalledWith(undefinedWindow);
        expect(eventEmitSpy).toHaveBeenCalledWith('data:load', { data });
    });

    it('should emit `data:load` and callback with a defined window', async () => {
        const data = [{ datum: 'value' }];
        const dataSourceCallback = jest.fn((_params) => Promise.resolve(data));
        dataService.updateCallback(dataSourceCallback);
        dataService.load(definedWindow);

        await sleep();

        expect(dataSourceCallback).toHaveBeenCalledTimes(1);
        expect(dataSourceCallback).toHaveBeenCalledWith(definedWindow);
        expect(eventEmitSpy).toHaveBeenCalledWith('data:load', { data });
    });

    describe('pending data', () => {
        afterEach(() => {
            (dataService as any).pendingData = undefined;
        });

        it('should emit `data:load` with restored data and NOT callback with an undefined window', async () => {
            const dataCallback = [{ datum: 'value' }];
            const dataRestored = [{ restored: 'other-value' }];
            const dataSourceCallback = jest.fn((_params) => Promise.resolve(dataCallback));
            dataService.updateCallback(dataSourceCallback);
            dataService.restoreData({ params: undefinedWindow, data: dataRestored });
            dataService.load(undefinedWindow);

            await sleep();

            expect(dataSourceCallback).not.toHaveBeenCalled();
            expect(eventEmitSpy).toHaveBeenCalledWith('data:load', { data: dataRestored });
        });

        it('should emit `data:load` with restored data and NOT callback with a defined window', async () => {
            const dataCallback = [{ datum: 'value' }];
            const dataRestored = [{ restored: 'other-value' }];
            const dataSourceCallback = jest.fn((_params) => Promise.resolve(dataCallback));
            dataService.updateCallback(dataSourceCallback);
            dataService.restoreData({ params: definedWindow, data: dataRestored });
            dataService.load(definedWindow);

            await sleep();

            expect(dataSourceCallback).not.toHaveBeenCalled();
            expect(eventEmitSpy).toHaveBeenCalledWith('data:load', { data: dataRestored });
        });

        it('should emit `data:load` with callback data if pending window does not match requested window', async () => {
            const dataCallback = [{ datum: 'value' }];
            const dataRestored = [{ restored: 'other-value' }];
            const dataSourceCallback = jest.fn((_params) => Promise.resolve(dataCallback));
            dataService.updateCallback(dataSourceCallback);
            dataService.restoreData({ params: definedWindow, data: dataRestored });
            dataService.load({ windowStart: new Date('2025-04-01'), windowEnd: definedWindow.windowEnd });

            await sleep();

            expect(dataSourceCallback).toHaveBeenCalledTimes(1);
            expect(dataSourceCallback).toHaveBeenCalledWith({
                windowStart: new Date('2025-04-01'),
                windowEnd: definedWindow.windowEnd,
            });
            expect(eventEmitSpy).toHaveBeenCalledWith('data:load', { data: dataCallback });
        });

        it('should emit `data:load` with restored data and NOT callback if pending window is undefined and requested window is defined', async () => {
            const dataCallback = [{ datum: 'value' }];
            const dataRestored = [{ restored: 'other-value' }];
            const dataSourceCallback = jest.fn((_params) => Promise.resolve(dataCallback));
            dataService.updateCallback(dataSourceCallback);
            dataService.restoreData({ params: undefinedWindow, data: dataRestored });
            dataService.load(definedWindow);

            await sleep();

            expect(dataSourceCallback).not.toHaveBeenCalled();
            expect(eventEmitSpy).toHaveBeenCalledWith('data:load', { data: dataRestored });
        });
    });
});
