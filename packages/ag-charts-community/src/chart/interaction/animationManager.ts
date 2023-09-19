import type { AnimationControls, AnimationOptions as BaseAnimationOptions, Driver } from '../../motion/animate';
import { animate as baseAnimate } from '../../motion/animate';
import { Debug } from '../../util/debug';
import { BaseManager } from './baseManager';
import type { InteractionManager } from './interactionManager';

const DEFAULT_DURATION = 1000;

type AnimationId = string;
type AnimationEventType = 'animation-frame';

interface AnimationEvent<AnimationEventType> {
    type: AnimationEventType;
    deltaMs: number;
}

interface AnimationOptions<T> extends Omit<BaseAnimationOptions<T>, 'driver'> {
    /** Set to `true` to disable all interactions with the chart while the animation is running. */
    disableInteractions?: boolean;
}

interface AnimationManyOptions<T> extends Omit<AnimationOptions<T>, 'from' | 'to' | 'onUpdate'> {
    /** Called once per frame with the tweened values for each `from` and `to` property pair. */
    onUpdate: (props: Array<T>) => void;
}

interface AnimationThrottleOptions {
    /**
     * Animations that share this throttleId will cause each other to be throttled if triggered within the duration of
     * a previous animation.
     */
    throttleId?: string;

    /**
     * Animations within a throttleGroup will not cause each other to be throttled. Used in combination with a
     * throttleId this allows batches of animations to run normally but throttle later batches.
     */
    throttleGroup?: string;
}

type AnimationWithThrottleOptions<T> =
    | (AnimationOptions<T> & AnimationThrottleOptions)
    | (AnimationManyOptions<T> & AnimationThrottleOptions);

/**
 * Manage animations across a chart, running all animations through only one `requestAnimationFrame` callback,
 * preventing duplicate animations and handling their lifecycle.
 */
export class AnimationManager extends BaseManager<AnimationEventType, AnimationEvent<AnimationEventType>> {
    private readonly debug = Debug.create(true, 'animation');
    private readonly controllers: Record<AnimationId, AnimationControls> = {};

    private throttles: Record<string, number> = {};
    private throttleGroups: Set<string> = new Set();

    private updaters: Array<[AnimationId, FrameRequestCallback]> = [];

    private isPlaying = false;
    private requestId?: number;
    private lastTime?: number;
    private readyToPlay = false;

    private interactionManager: InteractionManager;

    public defaultOptions: Partial<Pick<AnimationOptions<any>, 'duration'>> = {};
    public skipAnimations = false;

    constructor(interactionManager: InteractionManager, window: Window) {
        super();

        this.interactionManager = interactionManager;

        window.addEventListener('DOMContentLoaded', () => {
            this.readyToPlay = true;
        });

        // Fallback if `DOMContentLoaded` event is not fired, e.g. in an iframe
        setTimeout(() => {
            this.readyToPlay = true;
        }, 10);
    }

    public play() {
        if (this.isPlaying) return;

        this.isPlaying = true;

        this.debug('AnimationManager.play()');

        for (const id in this.controllers) {
            this.controllers[id].play();
        }

        this.startAnimationCycle();
    }

    public pause() {
        if (!this.isPlaying) return;

        this.isPlaying = false;
        this.cancelAnimationFrame();

        this.debug('AnimationManager.pause()');

        for (const id in this.controllers) {
            this.controllers[id].pause();
        }
    }

    public stop() {
        this.isPlaying = false;
        this.cancelAnimationFrame();

        this.debug('AnimationManager.stop()');

        for (const id in this.controllers) {
            this.controllers[id].stop();
        }
    }

    public reset() {
        if (this.isPlaying) {
            this.stop();
            this.play();
        } else {
            this.stop();
        }
    }

    /**
     * Create an animation to tween a value between the `from` and `to` properties. If an animation already exists
     * with the same `id`, immediately stop it.
     */
    public animate<T>(id: AnimationId, { disableInteractions = true, ...opts }: AnimationOptions<T>) {
        if (this.skipAnimations) {
            // Initialise the animation with the final values immediately and then stop the animation
            opts.onUpdate?.(opts.to);
            return;
        }

        const optsExtra = {
            ...opts,
            autoplay: this.isPlaying ? opts.autoplay : false,
            driver: this.createDriver(id, disableInteractions),
        };

        if (this.controllers[id]) {
            this.controllers[id].stop();
        }

        const controller = baseAnimate(optsExtra);
        this.controllers[id] = controller;

        // Initialise the animation immediately without requesting a frame to prevent flashes
        opts.onUpdate?.(opts.from);

        return controller;
    }

    /**
     * Create multiple animations at the same time, each with it's own `from` and `to` properties. The `onUpdate`
     * callback is shared and called once for the batch as a whole per frame.
     */
    public animateMany<T>(
        id: AnimationId,
        props: Array<Pick<AnimationOptions<T>, 'from' | 'to'>>,
        opts: AnimationManyOptions<T>
    ) {
        if (this.skipAnimations) {
            const state = props.map((prop) => prop.to);
            opts.onUpdate(state);
            opts.onComplete?.();
            return;
        }

        const state = props.map((prop) => prop.from);

        let playBatch = 0;
        let stopBatch = 0;
        let updateBatch = 0;
        let completeBatch = 0;

        const onUpdate = (index: number) => (v: T) => {
            state[index] = v;
            if (++updateBatch >= props.length) {
                opts.onUpdate?.(state);
                updateBatch = 0;
            }
        };

        const onPlay = () => {
            if (++playBatch >= props.length) {
                opts.onPlay?.();
            }
        };

        const onStop = () => {
            if (++stopBatch >= props.length) {
                opts.onStop?.();
            }
        };

        const onComplete = () => {
            if (++completeBatch >= props.length) {
                opts.onComplete?.();
            }
        };

        let index = 0;
        for (const prop of props) {
            const inner_id = `${id}-${index}`;
            this.animate(inner_id, {
                ...opts,
                ...prop,
                onUpdate: onUpdate(index),
                onPlay,
                onStop,
                onComplete,
            });
            index++;
        }
    }

    /**
     * Create an animation with a throttle. If a subsequent animation is created with the same `throttleId` and while
     * within the duration of the former animation, run this new animation to completion immediately.
     */
    public animateWithThrottle<T>(id: AnimationId, opts: AnimationOptions<T> & AnimationThrottleOptions) {
        const options = this.throttle<T, AnimationOptions<T> & AnimationThrottleOptions>(id, opts);

        this.animate(id, options);
    }

    /**
     * Create many animations at once with a throttle. If a subsequent animation is created with the same `throttleId`
     * and not in the same `throttleGroup`, then run this new animation to completion immediately. If they share
     * a `throttleGroup`, then do not run to completion but instead allow it to run through normally. This
     * allows us to create a batch of animations at once, then cancel any future colliding batches until
     * the first batch has completed.
     */
    public animateManyWithThrottle<T>(
        id: AnimationId,
        props: Array<Pick<AnimationOptions<T>, 'from' | 'to'>>,
        opts: AnimationManyOptions<T> & AnimationThrottleOptions
    ) {
        const options = this.throttle<T, AnimationManyOptions<T> & AnimationThrottleOptions>(id, opts);

        return this.animateMany(id, props, options);
    }

    private throttle<T, OT extends AnimationWithThrottleOptions<T>>(id: AnimationId, opts: OT) {
        const { throttleGroup } = opts;
        const throttleId = opts.throttleId ?? id;

        const now = Date.now();

        const isThrottled =
            this.throttles[throttleId] && opts.duration && now - this.throttles[throttleId] < opts.duration;
        const inGroup = throttleGroup && this.throttleGroups.has(throttleGroup);

        if (isThrottled && !inGroup) {
            opts.delay = 0;
            opts.duration = 1;
        }

        if (!isThrottled && throttleGroup) {
            this.throttleGroups.add(throttleGroup);
        }

        const onStop = () => {
            if (throttleGroup) {
                this.throttleGroups.delete(throttleGroup);
            }
            opts.onStop?.();
        };

        this.throttles[throttleId] = now;

        return { ...opts, onStop };
    }

    public defaultDuration() {
        return this.defaultOptions.duration ?? DEFAULT_DURATION;
    }

    private createDriver(id: AnimationId, disableInteractions?: boolean): Driver {
        return (update: (time: number) => void) => {
            return {
                start: () => {
                    this.updaters.push([id, update]);
                    if (this.requestId == null) {
                        this.startAnimationCycle();
                    }

                    if (disableInteractions) {
                        this.interactionManager.pause(`animation_${id}`);
                    }
                },
                stop: () => {
                    delete this.controllers[id];

                    this.updaters = this.updaters.filter(([uid]) => uid !== id);
                    if (this.updaters.length <= 0) {
                        this.cancelAnimationFrame();
                    }

                    if (disableInteractions) {
                        this.interactionManager.resume(`animation_${id}`);
                    }
                },
                reset: () => {},
            };
        };
    }

    private startAnimationCycle() {
        if (this.updaters.length === 0) return;

        const frame = (time: number) => {
            this.requestId = requestAnimationFrame(frame);

            if (!this.readyToPlay) return;

            if (this.lastTime === undefined) this.lastTime = time;
            const deltaMs = time - this.lastTime;
            this.lastTime = time;

            this.debug('AnimationManager - frame()', { updaterCount: this.updaters.length });

            this.updaters.forEach(([_, update]) => update(deltaMs));

            this.listeners.dispatch('animation-frame', { type: 'animation-frame', deltaMs });
        };

        this.requestId = requestAnimationFrame(frame);
    }

    private cancelAnimationFrame() {
        if (!this.requestId) return;

        cancelAnimationFrame(this.requestId);
        this.requestId = undefined;
        this.lastTime = undefined;
    }
}
