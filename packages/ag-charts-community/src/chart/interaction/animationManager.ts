import { BaseManager } from './baseManager';
import type { InteractionManager } from './interactionManager';
import { Logger } from '../../util/logger';
import type { AnimationOptions, AnimationValue, IAnimation } from '../../motion/animation';
import { Animation } from '../../motion/animation';
import { onContentLoaded } from '../../util/document';

const DEFAULT_DURATION = 1000;

type AnimationEventType = 'animation-frame';

interface AnimationEvent {
    type: AnimationEventType;
    deltaMs: number;
}

/**
 * Manage animations across a chart, running all animations through only one `requestAnimationFrame` callback,
 * preventing duplicate animations and handling their lifecycle.
 */
export class AnimationManager extends BaseManager<AnimationEventType, AnimationEvent> {
    private readonly controllers: Map<string, IAnimation> = new Map();

    private isPlaying = false;
    private requestId: number | null = null;
    private readyToPlay = false;

    private interactionManager: InteractionManager;

    public skipAnimations = false;
    public debug = false;

    constructor(interactionManager: InteractionManager) {
        super();
        this.interactionManager = interactionManager;
        onContentLoaded(() => {
            this.readyToPlay = true;
        });
    }

    /**
     * Create an animation to tween a value between the `from` and `to` properties. If an animation already exists
     * with the same `id`, immediately stop it.
     */
    public animate<T extends AnimationValue>({
        disableInteractions = true,
        ...opts
    }: AnimationOptions<T> & { disableInteractions?: boolean }) {
        if (this.skipAnimations) {
            opts.onUpdate?.(opts.to, null);
            return null;
        }

        if (opts.id != null) {
            this.controllers.get(opts.id)?.stop();
        }

        const id = opts.id ?? Math.random().toString();
        const controller = new Animation({
            ...opts,
            autoplay: this.isPlaying ? opts.autoplay : false,
            onPlay: (controller) => {
                this.controllers.set(id, controller);
                this.requestAnimation();
                if (disableInteractions) {
                    this.interactionManager.pause(`animation_${id}`);
                }
                opts.onPlay?.(controller);
            },
            onStop: (controller) => {
                this.controllers.delete(id);
                if (this.controllers.size === 0) {
                    this.cancelAnimation();
                }
                if (disableInteractions) {
                    this.interactionManager.resume(`animation_${id}`);
                }
                opts.onStop?.(controller);
            },
        });

        // Initialise the animation immediately without requesting a frame to prevent flashes
        opts.onUpdate?.(opts.from, controller);

        return controller;
    }

    public play() {
        if (this.isPlaying) {
            return;
        }

        this.isPlaying = true;
        this.debugLog('AnimationManager.play()');

        for (const controller of this.controllers.values()) {
            controller.play();
        }

        this.requestAnimation();
    }

    public pause() {
        if (!this.isPlaying) {
            return;
        }

        this.isPlaying = false;
        this.cancelAnimation();
        this.debugLog('AnimationManager.pause()');

        for (const controller of this.controllers.values()) {
            controller.pause();
        }
    }

    public stop() {
        this.isPlaying = false;
        this.cancelAnimation();
        this.debugLog('AnimationManager.stop()');

        for (const controller of this.controllers.values()) {
            controller.stop();
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

    public defaultDuration() {
        return DEFAULT_DURATION;
    }

    private requestAnimation() {
        if (this.controllers.size === 0 || this.requestId !== null) return;

        let prevTime: number;
        const onAnimationFrame = (time: number) => {
            this.requestId = requestAnimationFrame(onAnimationFrame);

            if (!this.readyToPlay) {
                return;
            }

            const deltaTime = time - (prevTime ?? time);

            prevTime = time;

            this.debugLog('AnimationManager - onAnimationFrame()', { controllersCount: this.controllers.size });

            for (const controller of this.controllers.values()) {
                controller.update(deltaTime);
            }

            this.listeners.dispatch('animation-frame', { type: 'animation-frame', deltaMs: deltaTime });
        };

        this.requestId = requestAnimationFrame(onAnimationFrame);
    }

    private cancelAnimation() {
        if (this.requestId === null) return;
        cancelAnimationFrame(this.requestId);
        this.requestId = null;
    }

    private debugLog(...logContent: any[]) {
        if (this.debug) {
            Logger.debug(...logContent);
        }
    }
}
