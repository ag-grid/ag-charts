import { EventEmitter } from './eventEmitter';

describe('EventEmitter', () => {
    interface EventMap {
        eventA: string;
        eventB: number;
    }

    let emitter: EventEmitter<EventMap>;

    beforeEach(() => {
        emitter = new EventEmitter();
    });

    it('registers and triggers an event listener', () => {
        const listener = jest.fn();
        emitter.on('eventA', listener);

        emitter.emit('eventA', 'test event');

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith('test event');
    });

    it('removes a registered listener', () => {
        const listener = jest.fn();
        const unsubscribe = emitter.on('eventA', listener);

        unsubscribe(); // Remove the listener
        emitter.emit('eventA', 'test event');

        expect(listener).not.toHaveBeenCalled();
    });

    it('supports multiple listeners for the same event', () => {
        const listener1 = jest.fn();
        const listener2 = jest.fn();

        emitter.on('eventA', listener1);
        emitter.on('eventA', listener2);

        emitter.emit('eventA', 'test event');

        expect(listener1).toHaveBeenCalledTimes(1);
        expect(listener1).toHaveBeenCalledWith('test event');
        expect(listener2).toHaveBeenCalledTimes(1);
        expect(listener2).toHaveBeenCalledWith('test event');
    });

    it('removes a specific listener while keeping others', () => {
        const listener1 = jest.fn();
        const listener2 = jest.fn();

        emitter.on('eventA', listener1);
        const unsubscribe = emitter.on('eventA', listener2);

        unsubscribe(); // Remove listener2
        emitter.emit('eventA', 'test event');

        expect(listener1).toHaveBeenCalledTimes(1);
        expect(listener2).not.toHaveBeenCalled();
    });

    it('clears all listeners for a specific event', () => {
        const listenerA = jest.fn();
        const listenerB = jest.fn();
        emitter.on('eventA', listenerA);
        emitter.on('eventB', listenerB);

        emitter.clear('eventA');
        emitter.emit('eventA', 'test event A');
        emitter.emit('eventB', 123);

        expect(listenerA).not.toHaveBeenCalled();
        expect(listenerB).toHaveBeenCalledTimes(1);
    });

    it('clears all listeners for all events', () => {
        const listenerA = jest.fn();
        const listenerB = jest.fn();

        emitter.on('eventA', listenerA);
        emitter.on('eventB', listenerB);

        emitter.clear();
        emitter.emit('eventA', 'test event A');
        emitter.emit('eventB', 123);

        expect(listenerA).not.toHaveBeenCalled();
        expect(listenerB).not.toHaveBeenCalled();
    });

    it('does not throw if emitting an event with no listeners', () => {
        expect(() => emitter.emit('eventA', 'test event')).not.toThrow();
    });

    it('does not throw when removing a listener that does not exist', () => {
        const listener = jest.fn();
        expect(() => emitter.off('eventA', listener)).not.toThrow();
    });
});
